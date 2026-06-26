import type { Deck, DeckProgress } from '../types/flashcard'

const DECKS_KEY = 'flash_cards_decks'
const PROGRESS_KEY = 'flash_cards_progress'
const SESSION_KEY = 'flash_cards_session'

export const localStorageUtils = {
  // Deck management
  saveDecks(decks: Record<string, Deck>): void {
    try {
      localStorage.setItem(DECKS_KEY, JSON.stringify(decks))
    } catch (error) {
      console.error('Failed to save decks to localStorage:', error)
    }
  },

  getDecks(): Record<string, Deck> {
    try {
      const data = localStorage.getItem(DECKS_KEY)
      return data ? JSON.parse(data) : {}
    } catch (error) {
      console.error('Failed to load decks from localStorage:', error)
      return {}
    }
  },

  getDeck(deckId: string): Deck | null {
    const decks = this.getDecks()
    return decks[deckId] || null
  },

  // Progress tracking
  saveProgress(progress: Record<string, DeckProgress>): void {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
    } catch (error) {
      console.error('Failed to save progress to localStorage:', error)
    }
  },

  getProgress(): Record<string, DeckProgress> {
    try {
      const data = localStorage.getItem(PROGRESS_KEY)
      return data ? JSON.parse(data) : {}
    } catch (error) {
      console.error('Failed to load progress from localStorage:', error)
      return {}
    }
  },

  // Session management
  saveSession(session: any): void {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    } catch (error) {
      console.error('Failed to save session to localStorage:', error)
    }
  },

  getSession(): any {
    try {
      const data = localStorage.getItem(SESSION_KEY)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Failed to load session from localStorage:', error)
      return null
    }
  },

  clearSession(): void {
    localStorage.removeItem(SESSION_KEY)
  },

  // Export
  exportDecks(decks: Record<string, Deck>): string {
    return JSON.stringify({ meta: { version: '1.0' }, decks }, null, 2)
  },
}
