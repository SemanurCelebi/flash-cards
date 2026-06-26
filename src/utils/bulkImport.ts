import type { Card } from '../types/flashcard'

export interface BulkCardEntry {
  front: string
  back: string
}

const separators = [
  /\t+/,          // tab
  /\s-\s/,       // space-dash-space
  /:\s/,          // colon-space
  /\s—\s/,       // em dash
  /\s–\s/,       // en dash
]

export function parseBulkTextToCards(text: string): BulkCardEntry[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      // 1) Try explicit separators first
      for (const sep of separators) {
        if (sep.test(line)) {
          const parts = line.split(sep)
          const front = parts[0].trim()
          const back = parts.slice(1).join(' ').trim()
          if (front && back) return { front, back }
        }
      }

      const tokens = line.split(/\s+/)
      // 2) If line contains a comma, assume first token is front, rest is back
      if (line.includes(',')) {
        const firstSpace = line.indexOf(' ')
        if (firstSpace > 0) {
          const front = line.slice(0, firstSpace).trim()
          const back = line.slice(firstSpace + 1).trim()
          if (front && back) return { front, back }
        }
      }

      // 3) If there are parentheses before the end, they likely belong to the front
      //    so treat the last two tokens as the back if possible
      const parenIndex = line.indexOf('(')
      if (parenIndex >= 0 && tokens.length >= 3) {
        const back = tokens.slice(-2).join(' ')
        const front = tokens.slice(0, -2).join(' ')
        if (front && back) return { front: front.trim(), back: back.trim() }
      }

      // 4) Fallback: if there are exactly two tokens, split simply
      if (tokens.length === 2) {
        return { front: tokens[0].trim(), back: tokens[1].trim() }
      }

      // 5) Fallback: split at first space (front = first token, back = rest)
      if (tokens.length >= 2) {
        const firstSpace = line.indexOf(' ')
        const front = line.slice(0, firstSpace).trim()
        const back = line.slice(firstSpace + 1).trim()
        if (front && back) return { front, back }
      }

      return null
    })
    .filter((entry): entry is BulkCardEntry => entry !== null)
}
