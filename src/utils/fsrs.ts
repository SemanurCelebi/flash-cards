import type { Card, RatingType } from '../types/flashcard'

// Simplified FSRS-inspired spacing algorithm
// Implements the core concepts of Spaced Repetition Scheduling

const MIN_EASE = 1.3

/**
 * SM-2 Algorithm implementation
 * Reference: https://en.wikipedia.org/wiki/Spaced_repetition#SM-2
 */
function calculateNewFactor(factor: number, quality: number): number {
  // quality: 1-4 (Again=1, Hard=2, Good=3, Easy=4)
  const newFactor = factor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  return Math.max(MIN_EASE, newFactor)
}

function getNextInterval(reps: number, factor: number, quality: number): number {
  // quality: 1-4
  if (quality < 3) {
    // Again (1) or Hard (2) - restart learning
    return 1 // Review tomorrow
  }

  if (reps === 0) {
    return 1 // First review after 1 day
  } else if (reps === 1) {
    return 3 // Second review after 3 days
  } else {
    // Subsequent reviews
    return Math.round(reps * factor)
  }
}

export const fsrsUtils = {
  /**
   * Update card based on user rating
   * @param card Current card state
   * @param rating User's rating (1=Again, 2=Hard, 3=Good, 4=Easy)
   * @returns Updated card with new scheduling info
   */
  updateCardRating(card: Card, rating: RatingType | 1 | 2 | 3 | 4): Card {
    const quality = rating as number
    const now = Date.now()
    const dayInMs = 86400000

    // Calculate new factor
    const newFactor = calculateNewFactor(card.factor, quality)

    // Calculate new interval in days
    const newReps = card.reps + 1
    const intervalDays = getNextInterval(card.reps, card.factor, quality)

    // Determine new card state
    let newState: number
    if (quality < 3) {
      newState = 1 // Learning (relearning)
    } else if (newReps < 3) {
      newState = 1 // Learning state until 3rd review
    } else {
      newState = 2 // Review state
    }

    // Calculate new due date
    const newDue = now + intervalDays * dayInMs

    return {
      ...card,
      reps: newReps,
      factor: newFactor,
      due: newDue,
      state: newState as any,
      difficulty: Math.max(0, Math.min(10, card.difficulty + (quality - 3) * 0.5)),
      stability: Math.max(1, card.stability + (quality - 3) * 0.2),
      lapses: quality === 1 ? card.lapses + 1 : card.lapses,
    }
  },

  /**
   * Get next review date as readable string
   */
  getNextReviewDate(due: number): string {
    const now = Date.now()
    const diffInMs = due - now

    if (diffInMs < 0) return 'Due now'
    if (diffInMs < 3600000) return 'Due in minutes'
    if (diffInMs < 86400000) return 'Due today'
    if (diffInMs < 172800000) return 'Due tomorrow'

    const days = Math.ceil(diffInMs / 86400000)
    return `Due in ${days} days`
  },

  /**
   * Sort cards by due date and state (new cards first, then due cards)
   */
  sortCardsByPriority(cards: Card[]): Card[] {
    return [...cards].sort((a, b) => {
      // New cards first
      if (a.state !== b.state) {
        if (a.state === 0) return -1
        if (b.state === 0) return 1
      }

      // Then by due date
      return a.due - b.due
    })
  },

  /**
   * Get cards due for review
   */
  getCardsDue(cards: Card[]): Card[] {
    const now = Date.now()
    return cards.filter((card) => card.due <= now)
  },

  /**
   * Get statistics about cards
   */
  getCardStats(cards: Card[]) {
    return {
      new: cards.filter((c) => c.state === 0).length,
      learning: cards.filter((c) => c.state === 1).length,
      review: cards.filter((c) => c.state === 2).length,
      relearning: cards.filter((c) => c.state === 3).length,
      totalDue: cards.filter((c) => c.due <= Date.now()).length,
      averageDifficulty:
        cards.length > 0 ? cards.reduce((sum, c) => sum + c.difficulty, 0) / cards.length : 0,
      averageStability:
        cards.length > 0 ? cards.reduce((sum, c) => sum + c.stability, 0) / cards.length : 0,
    }
  },
}
