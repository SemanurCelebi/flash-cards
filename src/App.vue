<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDecksStore } from './stores/decksStore'
import { useStudyStore } from './stores/studyStore'
import DeckList from './components/DeckList.vue'
import StudySession from './components/StudySession.vue'

const decksStore = useDecksStore()
const studyStore = useStudyStore()

const currentView = ref<'home' | 'study'>('home')

onMounted(() => {
  // Load data from localStorage
  decksStore.loadDecks()
  studyStore.resumeSession()

  // Check if there's a saved session to resume
  const session = studyStore.currentSession
  if (session && !session.completedAt) {
    currentView.value = 'study'
  }
})

const startStudy = (deckId: string) => {
  const deck = decksStore.getDeckById(deckId)
  if (deck) {
    const cards = Object.values(deck.cards)
    studyStore.startSession(deckId, cards)
    currentView.value = 'study'
  }
}

const endStudy = () => {
  studyStore.clearSession()
  currentView.value = 'home'
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <!-- Header -->
    <header class="bg-white shadow">
      <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 class="text-3xl font-bold text-blue-600">📚 Flash Cards</h1>
        <p class="text-gray-600">Learn Dutch-Turkish Vocabulary</p>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-6xl mx-auto px-4 py-8">
      <DeckList 
        v-if="currentView === 'home'"
        @start-study="startStudy"
      />
      <StudySession 
        v-else
        @end-study="endStudy"
      />
    </main>
  </div>
</template>

<style scoped>
</style>
