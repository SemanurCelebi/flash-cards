import type { Deck, Card, DeckMetadata } from '../types/flashcard'

// Lightweight PDF -> Deck importer using pdfjs-dist
// Heuristics: extract page text, split into lines, detect pairs by separators (" - ", "\t", ":", " — ")
// or treat alternating lines as front/back.

export const pdfImportUtils = {
  async importFromFile(file: File): Promise<Deck[]> {
    // dynamic import so bundler includes pdfjs only when needed
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf')

    const arrayBuffer = await file.arrayBuffer()
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise

    let fullText = ''
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      const pageText = content.items.map((it: any) => (it.str || '')).join(' ')
      fullText += pageText + '\n'
    }

    const decks = this.parseTextToDecks(fullText, file.name)
    return decks
  },

  parseTextToDecks(text: string, filename = 'pdf-deck'): Deck[] {
    // Normalize line breaks and split
    const lines = text
      .replace(/\r/g, '\n')
      .split(/\n+/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0)

    const cards: Record<string, Card> = {}
    let id = 1

    // Multiple spaces/tabs common in PDFs with columns should be tried first
    const separators = [
      /\s{2,}/,           // 2+ spaces (common in column-based PDFs)
      /\t+/,               // tabs
      /\s-\s/,             // space-dash-space
      /:\s/,               // colon-space
      /\s—\s/,             // em dash
      /\s–\s/,             // en dash
    ]

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      // try to find separator in the line
      let matched = false
      for (const sep of separators) {
        if (sep.test(line)) {
          const parts = line.split(sep)
          const front = parts[0].trim()
          const back = parts.slice(1).join(' ').trim()
          if (front && back && front.length > 1 && back.length > 1) {
            const card: Card = {
              id: String(id++),
              front,
              back,
              state: 0,
              difficulty: 5,
              stability: 1,
              due: 0,
              lapses: 0,
              reps: 0,
              factor: 2.5,
            }
            cards[card.id] = card
            matched = true
            break
          }
        }
      }

      if (matched) continue

      // fallback: try pairing current line with next line
      if (i + 1 < lines.length) {
        const next = lines[i + 1]
        // heuristic: if next line looks like translation (shorter or different script), pair
        if (line && next && line.length > 2 && next.length > 2) {
          const card: Card = {
            id: String(id++),
            front: line,
            back: next,
            state: 0,
            difficulty: 5,
            stability: 1,
            due: 0,
            lapses: 0,
            reps: 0,
            factor: 2.5,
          }
          cards[card.id] = card
          i++ // skip next
        }
      }
    }

    const meta: DeckMetadata = {
      deckId: filename.replace(/[^a-z0-9-_]/gi, '-').toLowerCase(),
      deckName: filename.replace(/\.[^.]+$/, ''),
      description: `Imported from PDF: ${filename}`,
      language: 'nl-tr',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      cardCount: Object.keys(cards).length,
    }

    return [{ metadata: meta, cards }]
  },
}

export default pdfImportUtils
