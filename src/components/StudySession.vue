<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useDecksStore } from '../stores/decksStore'
import { useStudyStore } from '../stores/studyStore'
import { fsrsUtils } from '../utils/fsrs'
import CardDisplay from './CardDisplay.vue'
import RatingButtons from './RatingButtons.vue'
import ProgressTracker from './ProgressTracker.vue'
import type { Card } from '../types/flashcard'

const decksStore = useDecksStore()
const studyStore = useStudyStore()

const showAnswer = ref(false)
const sessionEnded = ref(false)
const currentCard = ref<Card | null>(null)
const allCards = ref<Record<string, Card>>({})

const emit = defineEmits<{
  endStudy: []
}>()

// Computed properties
const sessionStats = computed(() => studyStore.getSessionStats)
const currentCardIndex = computed(() => studyStore.getCurrentCardIndex)
const totalCards = computed(() => studyStore.getTotalCards)
const isCompleted = computed(() => studyStore.isSessionCompleted)

// Keyboard shortcuts
const handleKeyDown = (e: KeyboardEvent) => {
  if (sessionEnded.value) return

  switch (e.code) {
    case 'Space':
      e.preventDefault()
      showAnswer.value = !showAnswer.value
      break
    case 'Digit1':
      handleRate(1)
      break
    case 'Digit2':
      handleRate(2)
      break
    case 'Digit3':
      handleRate(3)
      break
    case 'Digit4':
      handleRate(4)
      break
    case 'ArrowLeft':
      e.preventDefault()
      handlePrevious()
      break
    case 'ArrowRight':
      e.preventDefault()
      handleNext()
      break
  }
}

onMounted(() => {
  const session = studyStore.currentSession
  if (session) {
    const deck = decksStore.getDeckById(session.deckId)
    if (deck) {
      allCards.value = deck.cards
      if (session.currentCardId && allCards.value[session.currentCardId]) {
        currentCard.value = allCards.value[session.currentCardId]
      }
    }
  }

  // Check if session was already completed
  if (isCompleted.value) {
    sessionEnded.value = true
  }

  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

// Rate current card
const handleRate = (rating: 1 | 2 | 3 | 4) => {
  if (!currentCard.value) return

  const updatedCard = fsrsUtils.updateCardRating(currentCard.value, rating)
  allCards.value[updatedCard.id] = updatedCard

  // Update deck in store
  const session = studyStore.currentSession
  if (session) {
    const deck = decksStore.getDeckById(session.deckId)
    if (deck) {
      deck.cards[updatedCard.id] = updatedCard
      decksStore.updateDeck(deck.metadata.deckId, deck)
    }
  }

  studyStore.rateCard(currentCard.value.id, rating)
  showAnswer.value = false

  // Move to next card
  if (studyStore.getCurrentCardId) {
    const nextCardId = studyStore.getCurrentCardId
    if (nextCardId && allCards.value[nextCardId]) {
      currentCard.value = allCards.value[nextCardId]
    }
  } else {
    // Session completed
    sessionEnded.value = true
  }
}

const handleSkip = () => {
  if (!currentCard.value) return
  studyStore.skipCard()
  showAnswer.value = false

  if (studyStore.getCurrentCardId) {
    const nextCardId = studyStore.getCurrentCardId
    if (nextCardId && allCards.value[nextCardId]) {
      currentCard.value = allCards.value[nextCardId]
    }
  } else {
    sessionEnded.value = true
  }
}

const handlePrevious = () => {
  studyStore.previousCard()
  showAnswer.value = false

  const prevCardId = studyStore.getCurrentCardId
  if (prevCardId && allCards.value[prevCardId]) {
    currentCard.value = allCards.value[prevCardId]
  }
}

const handleNext = () => {
  studyStore.nextCard()
  showAnswer.value = false

  const nextCardId = studyStore.getCurrentCardId
  if (nextCardId && allCards.value[nextCardId]) {
    currentCard.value = allCards.value[nextCardId]
  }
}

const handleEndSession = () => {
  studyStore.endSession()
  emit('endStudy')
}

const handleContinueStudy = () => {
  sessionEnded.value = false
  showAnswer.value = false
}
</script>

<template>
  <div class="space-y-6">
    <!-- Session Not Completed View -->
    <div v-if="!sessionEnded" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Study Area (Left) -->
      <div class="lg:col-span-2">
        <!-- Card Display -->
        <div class="relative">
          <CardDisplay
            :card="currentCard"
            :card-index="currentCardIndex"
            :total-cards="totalCards"
            :show-answer="showAnswer"
            @update-show-answer="(val) => (showAnswer = val)"
            @swipe-left="handleNext"
            @swipe-right="handlePrevious"
          />

          <button
            @click="handlePrevious"
            class="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white shadow-lg p-3 text-gray-700 hover:bg-gray-100 transition-colors"
            :disabled="currentCardIndex === 0"
          >
            ←
          </button>
          <button
            @click="handleNext"
            class="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white shadow-lg p-3 text-gray-700 hover:bg-gray-100 transition-colors"
            :disabled="currentCardIndex === totalCards - 1 && !sessionEnded"
          >
            →
          </button>
        </div>

        <p class="text-center text-sm text-gray-500 mt-3">
          Swipe left/right or use the arrows to move between cards.
        </p>

        <!-- Rating Buttons -->
        <div class="mt-8">
          <RatingButtons
            @rate="handleRate"
            @skip="handleSkip"
          />
        </div>

        <!-- Navigation Buttons -->
        <div class="flex gap-2 mt-6">
          <button
            @click="handlePrevious"
            :disabled="currentCardIndex === 0"
            class="flex-1 px-4 py-2 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>
          <button
            @click="handleNext"
            :disabled="currentCardIndex === totalCards - 1 && !sessionEnded"
            class="flex-1 px-4 py-2 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>

        <!-- End Study Button -->
        <button
          @click="handleEndSession"
          class="w-full mt-4 px-4 py-2 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
        >
          End Study Session
        </button>
      </div>

      <!-- Progress Sidebar (Right) -->
      <div>
        <ProgressTracker
          :total-cards="sessionStats.totalCards"
          :studied-cards="sessionStats.studiedCards"
          :remaining="sessionStats.remaining"
          :ratings="sessionStats.ratings"
        />
      </div>
    </div>

    <!-- Session Completed View -->
    <div v-else class="bg-white rounded-lg shadow-lg p-8 text-center space-y-6">
      <h2 class="text-3xl font-bold text-green-600">🎉 Great Job!</h2>
      <p class="text-xl text-gray-700">You've completed this study session!</p>

      <!-- Summary Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 py-6">
        <div class="bg-blue-50 rounded-lg p-4">
          <p class="text-2xl font-bold text-blue-600">{{ sessionStats.totalCards }}</p>
          <p class="text-sm text-gray-600">Total Cards</p>
        </div>
        <div class="bg-green-50 rounded-lg p-4">
          <p class="text-2xl font-bold text-green-600">{{ sessionStats.ratings[3] + sessionStats.ratings[4] }}</p>
          <p class="text-sm text-gray-600">Correct</p>
        </div>
        <div class="bg-orange-50 rounded-lg p-4">
          <p class="text-2xl font-bold text-orange-600">{{ sessionStats.ratings[1] + sessionStats.ratings[2] }}</p>
          <p class="text-sm text-gray-600">Difficult</p>
        </div>
        <div class="bg-purple-50 rounded-lg p-4">
          <p class="text-2xl font-bold text-purple-600">
            {{ Math.round(((sessionStats.ratings[3] + sessionStats.ratings[4]) / sessionStats.totalCards) * 100) }}%
          </p>
          <p class="text-sm text-gray-600">Accuracy</p>
        </div>
      </div>

      <!-- Rating Breakdown -->
      <div class="bg-gray-50 rounded-lg p-6 text-left">
        <p class="font-semibold text-gray-700 mb-4">Rating Breakdown:</p>
        <div class="space-y-2 text-sm">
          <p><span class="text-red-600 font-semibold">Again:</span> {{ sessionStats.ratings[1] }} cards</p>
          <p><span class="text-orange-600 font-semibold">Hard:</span> {{ sessionStats.ratings[2] }} cards</p>
          <p><span class="text-green-600 font-semibold">Good:</span> {{ sessionStats.ratings[3] }} cards</p>
          <p><span class="text-blue-600 font-semibold">Easy:</span> {{ sessionStats.ratings[4] }} cards</p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-4 pt-4">
        <button
          @click="handleContinueStudy"
          class="flex-1 px-6 py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          Continue Studying
        </button>
        <button
          @click="handleEndSession"
          class="flex-1 px-6 py-3 rounded-lg font-semibold text-white bg-gray-600 hover:bg-gray-700 transition-colors"
        >
          Return Home
        </button>
      </div>
    </div>
  </div>
</template>
