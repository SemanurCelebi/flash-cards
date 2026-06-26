import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { StudySession, Card } from '../types/flashcard'
import { localStorageUtils } from '../utils/localStorage'
import { fsrsUtils } from '../utils/fsrs'

export const useStudyStore = defineStore('study', () => {
  const currentSession = ref<StudySession | null>(null)
  const currentCardIndex = ref(0)

  // Initialize study session
  const startSession = (deckId: string, cards: Card[]) => {
    const sortedCards = fsrsUtils.sortCardsByPriority(cards)
    const cardOrder = sortedCards.map((c) => c.id)

    currentSession.value = {
      deckId,
      startedAt: Date.now(),
      currentCardId: cardOrder[0] || null,
      cardOrder,
      ratings: {},
    }
    currentCardIndex.value = 0
    localStorageUtils.saveSession(currentSession.value)
  }

  // Resume existing session
  const resumeSession = () => {
    const saved = localStorageUtils.getSession()
    if (saved) {
      currentSession.value = saved
      if (currentSession.value) {
        const nextIndex = currentSession.value.cardOrder.findIndex(
          (id) => id === currentSession.value?.currentCardId,
        )
        currentCardIndex.value = nextIndex >= 0 ? nextIndex : 0

        if (
          !currentSession.value.currentCardId &&
          currentSession.value.cardOrder.length > 0 &&
          !currentSession.value.completedAt
        ) {
          currentSession.value.currentCardId = currentSession.value.cardOrder[currentCardIndex.value]
        }
      }
    }
  }

  // Get current card ID
  const getCurrentCardId = computed(() => currentSession.value?.currentCardId || null)

  // Get current card index
  const getCurrentCardIndex = computed(() => currentCardIndex.value)

  // Get total cards in session
  const getTotalCards = computed(() => currentSession.value?.cardOrder.length || 0)

  // Get progress percentage
  const getProgress = computed(() => {
    const total = getTotalCards.value
    if (total === 0) return 0
    return Math.round((currentCardIndex.value / total) * 100)
  })

  // Rate current card
  const rateCard = (cardId: string, rating: 1 | 2 | 3 | 4) => {
    if (!currentSession.value) return

    currentSession.value.ratings[cardId] = rating

    // Move to next card
    if (currentCardIndex.value < currentSession.value.cardOrder.length - 1) {
      currentCardIndex.value++
      currentSession.value.currentCardId = currentSession.value.cardOrder[currentCardIndex.value]
    } else {
      // Session completed
      currentSession.value.completedAt = Date.now()
      currentSession.value.currentCardId = null
    }

    localStorageUtils.saveSession(currentSession.value)
  }

  // Check if session is completed
  const isSessionCompleted = computed(() => Boolean(currentSession.value?.completedAt))

  // Get session statistics
  const getSessionStats = computed(() => {
    if (!currentSession.value) {
      return {
        totalCards: 0,
        studiedCards: 0,
        remaining: 0,
        ratings: { 1: 0, 2: 0, 3: 0, 4: 0 },
      }
    }

    const ratings = { 1: 0, 2: 0, 3: 0, 4: 0 }
    Object.values(currentSession.value.ratings).forEach((r) => {
      ratings[r as keyof typeof ratings]++
    })

    return {
      totalCards: currentSession.value.cardOrder.length,
      studiedCards: Object.keys(currentSession.value.ratings).length,
      remaining: currentSession.value.cardOrder.length - Object.keys(currentSession.value.ratings).length,
      ratings,
    }
  })

  // Skip current card (don't rate it, just move to next)
  const skipCard = () => {
    if (!currentSession.value) return

    if (currentCardIndex.value < currentSession.value.cardOrder.length - 1) {
      currentCardIndex.value++
      currentSession.value.currentCardId = currentSession.value.cardOrder[currentCardIndex.value]
    } else {
      currentSession.value.completedAt = Date.now()
      currentSession.value.currentCardId = null
    }

    localStorageUtils.saveSession(currentSession.value)
  }

  // End session prematurely
  const endSession = () => {
    if (currentSession.value) {
      currentSession.value.completedAt = Date.now()
      localStorageUtils.saveSession(currentSession.value)
    }
  }

  // Clear session
  const clearSession = () => {
    currentSession.value = null
    currentCardIndex.value = 0
    localStorageUtils.clearSession()
  }

  // Go to previous card
  const previousCard = () => {
    if (!currentSession.value || currentCardIndex.value === 0) return

    currentCardIndex.value--
    currentSession.value.currentCardId = currentSession.value.cardOrder[currentCardIndex.value]
    localStorageUtils.saveSession(currentSession.value)
  }

  // Go to next card without rating
  const nextCard = () => {
    if (!currentSession.value) return

    if (currentCardIndex.value < currentSession.value.cardOrder.length - 1) {
      currentCardIndex.value++
      currentSession.value.currentCardId = currentSession.value.cardOrder[currentCardIndex.value]
      localStorageUtils.saveSession(currentSession.value)
    } else {
      currentSession.value.currentCardId = null
      localStorageUtils.saveSession(currentSession.value)
    }
  }

  return {
    currentSession,
    currentCardIndex,
    startSession,
    resumeSession,
    getCurrentCardId,
    getCurrentCardIndex,
    getTotalCards,
    getProgress,
    rateCard,
    isSessionCompleted,
    getSessionStats,
    skipCard,
    endSession,
    clearSession,
    previousCard,
    nextCard,
  }
})
