import type { Deck, DeckMetadata, Card } from '../types/flashcard'

interface ImportFileStructure {
  meta?: {
    author?: string
    version?: string
  }
  decks?: Record<string, any>
}

export const jsonImportUtils = {
  async importFromFile(file: File): Promise<Deck[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const data: ImportFileStructure = JSON.parse(content)
          const decks = this.validateAndParseDeckStructure(data)
          resolve(decks)
        } catch (error) {
          reject(new Error(`Failed to parse JSON file: ${error}`))
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  },

  async importFromUrl(url: string): Promise<Deck[]> {
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data: ImportFileStructure = await response.json()
      return this.validateAndParseDeckStructure(data)
    } catch (error) {
      throw new Error(`Failed to import from URL: ${error}`)
    }
  },

  validateAndParseDeckStructure(data: ImportFileStructure): Deck[] {
    if (!data.decks || typeof data.decks !== 'object') {
      throw new Error('Invalid JSON structure: missing "decks" object')
    }

    const decks: Deck[] = []

    for (const [deckKey, deckData] of Object.entries(data.decks)) {
      try {
        // Parse deck metadata
        const meta: DeckMetadata = {
          deckId: deckData.meta?.deckId || deckKey,
          deckName: deckData.meta?.deckName || deckKey,
          description: deckData.meta?.description || '',
          language: deckData.meta?.language || 'unknown',
          createdAt: deckData.meta?.createdAt || Date.now(),
          updatedAt: deckData.meta?.updatedAt || Date.now(),
          cardCount: 0,
        }

        // Parse cards
        const cards: Record<string, Card> = {}
        if (deckData.cards && typeof deckData.cards === 'object') {
          for (const [cardKey, cardData] of Object.entries(deckData.cards)) {
            const card = this.parseCard(cardData as any, cardKey)
            if (card) cards[card.id] = card
          }
        }

        meta.cardCount = Object.keys(cards).length

        const deck: Deck = { metadata: meta, cards }
        decks.push(deck)
      } catch (error) {
        console.warn(`Skipped invalid deck "${deckKey}":`, error)
      }
    }

    if (decks.length === 0) {
      throw new Error('No valid decks found in JSON file')
    }

    return decks
  },

  parseCard(data: any, id: string): Card | null {
    try {
      if (!data.front && !data.q) return null
      if (!data.back && !data.a) return null

      return {
        id: data.id || id,
        front: data.front || data.q || '',
        back: data.back || data.a || '',
        state: data.state ?? 0,
        difficulty: typeof data.difficulty === 'number' ? data.difficulty : 5,
        stability: typeof data.stability === 'number' ? data.stability : 1,
        due: typeof data.due === 'number' ? data.due : 0,
        lapses: typeof data.lapses === 'number' ? data.lapses : 0,
        reps: typeof data.reps === 'number' ? data.reps : 0,
        factor: typeof data.factor === 'number' ? data.factor : 2.5,
      }
    } catch (error) {
      console.warn(`Failed to parse card with id "${id}":`, error)
      return null
    }
  },

  validateCard(card: Partial<Card>): boolean {
    return Boolean(card.front && card.back && card.id)
  },

  createExportData(decks: Record<string, Deck>): ImportFileStructure {
    return {
      meta: {
        author: 'Flash Cards App',
        version: '1.0',
      },
      decks: decks,
    }
  },
}
