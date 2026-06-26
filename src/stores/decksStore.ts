import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { CardState, type Card, type Deck, type DeckProgress } from '../types/flashcard'
import { localStorageUtils } from '../utils/localStorage'
import { jsonImportUtils } from '../utils/jsonImport'
import { pdfImportUtils } from '../utils/pdfImport'

export const useDecksStore = defineStore('decks', () => {
  const decks = ref<Record<string, Deck>>({})
  const progress = ref<Record<string, DeckProgress>>({})

  // Load initial data from localStorage
  const loadDecks = () => {
    decks.value = localStorageUtils.getDecks()
    progress.value = localStorageUtils.getProgress()
  }

  // Computed: List of all decks
  const decksList = computed(() => Object.values(decks.value))

  // Computed: Get specific deck by ID
  const getDeckById = (deckId: string) => decks.value[deckId]

  // Add new deck from imported data
  const addDeck = (newDeck: Deck) => {
    decks.value[newDeck.metadata.deckId] = newDeck
    progress.value[newDeck.metadata.deckId] = {
      deckId: newDeck.metadata.deckId,
      stats: {
        newCards: newDeck.metadata.cardCount,
        learningCards: 0,
        reviewCards: 0,
        relearningCards: 0,
        totalCards: newDeck.metadata.cardCount,
        cardsStudiedToday: 0,
        averageAccuracy: 0,
      },
    }
    saveDecks()
  }

  // Add a new card manually to a deck
  const addCard = (deckId: string, front: string, back: string) => {
    const deck = decks.value[deckId]
    if (!deck) return

    const cardId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const card = {
      id: cardId,
      front,
      back,
      state: CardState.New,
      difficulty: 5,
      stability: 1,
      due: 0,
      lapses: 0,
      reps: 0,
      factor: 2.5,
    }

    deck.cards[card.id] = card
    deck.metadata.cardCount = Object.keys(deck.cards).length
    recalculateProgress(deckId)
    saveDecks()
  }

  // Create a new deck manually
  const createDeck = (
    deckName: string,
    description: string,
    language = 'nl-tr',
    cardEntries: Array<{ front: string; back: string }> = [],
  ) => {
    const baseId = deckName.trim()
      .replace(/[^a-z0-9-_]/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || `deck-${Date.now()}`

    let deckId = baseId
    let suffix = 1
    while (decks.value[deckId]) {
      deckId = `${baseId}-${suffix++}`
    }

    const cards: Record<string, Card> = {}
    cardEntries.forEach((entry, index) => {
      if (!entry.front.trim() || !entry.back.trim()) return
      const cardId = `${deckId}-card-${index + 1}`
      cards[cardId] = {
        id: cardId,
        front: entry.front.trim(),
        back: entry.back.trim(),
        state: CardState.New,
        difficulty: 5,
        stability: 1,
        due: 0,
        lapses: 0,
        reps: 0,
        factor: 2.5,
      }
    })

    const newDeck: Deck = {
      metadata: {
        deckId,
        deckName,
        description,
        language,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        cardCount: Object.keys(cards).length,
      },
      cards,
    }

    addDeck(newDeck)
    return newDeck
  }

  // Update deck
  const updateDeck = (deckId: string, updatedDeck: Deck) => {
    if (decks.value[deckId]) {
      decks.value[deckId] = updatedDeck
      recalculateProgress(deckId)
      saveDecks()
    }
  }

  // Delete deck
  const deleteDeck = (deckId: string) => {
    delete decks.value[deckId]
    delete progress.value[deckId]
    saveDecks()
  }

  // Import deck from file
  const importFromFile = async (file: File) => {
    const importedDecks = await jsonImportUtils.importFromFile(file)
    for (const deck of importedDecks) {
      addDeck(deck)
    }
  }

  // Import deck from URL
  const importFromUrl = async (url: string) => {
    const importedDecks = await jsonImportUtils.importFromUrl(url)
    for (const deck of importedDecks) {
      addDeck(deck)
    }
  }

  // Import deck from PDF file
  const importFromPdf = async (file: File) => {
    const importedDecks = await pdfImportUtils.importFromFile(file)
    for (const deck of importedDecks) {
      addDeck(deck)
    }
  }

  // Save to localStorage
  const saveDecks = () => {
    localStorageUtils.saveDecks(decks.value)
    localStorageUtils.saveProgress(progress.value)
  }

  const recalculateProgress = (deckId: string) => {
    const deck = decks.value[deckId]
    if (!deck) return

    const cards = Object.values(deck.cards)
    const stats = {
      newCards: cards.filter((c) => c.state === 0).length,
      learningCards: cards.filter((c) => c.state === 1).length,
      reviewCards: cards.filter((c) => c.state === 2).length,
      relearningCards: cards.filter((c) => c.state === 3).length,
      totalCards: cards.length,
      cardsStudiedToday: progress.value[deckId]?.stats.cardsStudiedToday || 0,
      averageAccuracy: progress.value[deckId]?.stats.averageAccuracy || 0,
    }

    progress.value[deckId] = {
      deckId,
      stats,
    }
    saveDecks()
  }

  // Get deck progress
  const getDeckProgress = (deckId: string) => progress.value[deckId] || null

  // Update progress
  const updateProgress = (deckId: string, newProgress: DeckProgress) => {
    progress.value[deckId] = newProgress
    saveDecks()
  }

  // Reset deck progress
  const resetDeckProgress = (deckId: string) => {
    if (decks.value[deckId]) {
      const deck = decks.value[deckId]
      // Reset all cards to new state
      Object.values(deck.cards).forEach((card) => {
        card.state = 0
        card.due = 0
        card.reps = 0
        card.lapses = 0
        card.difficulty = 5
        card.stability = 1
      })

      // Reset progress
      progress.value[deckId] = {
        deckId,
        stats: {
          newCards: deck.metadata.cardCount,
          learningCards: 0,
          reviewCards: 0,
          relearningCards: 0,
          totalCards: deck.metadata.cardCount,
          cardsStudiedToday: 0,
          averageAccuracy: 0,
        },
      }

      recalculateProgress(deckId)
      saveDecks()
    }
  }

  // Export deck
  const exportDeck = (deckId: string): string => {
    const deck = decks.value[deckId]
    if (!deck) return ''

    const exportData = {
      meta: {
        author: 'Flash Cards App',
        version: '1.0',
      },
      decks: {
        [deck.metadata.deckId]: deck,
      },
    }

    return JSON.stringify(exportData, null, 2)
  }

  return {
    decks,
    progress,
    decksList,
    getDeckById,
    loadDecks,
    addDeck,
    createDeck,
    addCard,
    updateDeck,
    deleteDeck,
    importFromFile,
    importFromUrl,
    importFromPdf,
    saveDecks,
    getDeckProgress,
    updateProgress,
    resetDeckProgress,
    exportDeck,
  }
})
