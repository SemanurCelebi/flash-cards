// FSRS (Free Spaced Repetition Scheduler) types
export const CardState = {
  New: 0,
  Learning: 1,
  Review: 2,
  Relearning: 3,
} as const

export const Rating = {
  Again: 1,    // Forgot - restart learning
  Hard: 2,     // Difficult - increase interval slower
  Good: 3,     // Correct - normal interval progression
  Easy: 4,     // Too easy - increase interval faster
} as const

export type CardStateType = typeof CardState[keyof typeof CardState]
export type RatingType = typeof Rating[keyof typeof Rating]

export interface Card {
  id: string;
  front: string;  // Dutch word/phrase
  back: string;   // Turkish translation
  state: CardStateType;
  difficulty: number; // 0-10, default 5
  stability: number;
  due: number; // Timestamp when card is due for review
  lapses: number; // Number of times forgotten
  reps: number; // Number of times reviewed
  factor: number; // SM2 factor (legacy)
}

export interface DeckMetadata {
  deckId: string;
  deckName: string;
  description: string;
  language: string; // "nl-tr"
  createdAt: number;
  updatedAt: number;
  cardCount: number;
}

export interface Deck {
  metadata: DeckMetadata;
  cards: Record<string, Card>; // keyed by card.id
}

export interface DeckProgress {
  deckId: string;
  stats: {
    newCards: number;
    learningCards: number;
    reviewCards: number;
    relearningCards: number;
    totalCards: number;
    cardsStudiedToday: number;
    averageAccuracy: number;
  };
}

export interface StudySession {
  deckId: string;
  startedAt: number;
  currentCardId: string | null;
  cardOrder: string[]; // ordered card IDs to study
  ratings: Record<string, number>; // cardId -> rating (1-4)
  completedAt?: number;
}

export interface FSRSCard {
  id: string;
  due: number;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: CardStateType;
  lastReview?: number;
}
