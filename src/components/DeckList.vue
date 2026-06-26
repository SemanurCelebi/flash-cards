<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useDecksStore } from '../stores/decksStore'
import { parseBulkTextToCards } from '../utils/bulkImport'

const decksStore = useDecksStore()
const showImportDialog = ref(false)
const showCreateDeckDialog = ref(false)
const importError = ref('')
const newCardForms = reactive<Record<string, { front: string; back: string; open: boolean; error: string }>>({})
const createDeckForm = reactive({
  deckName: '',
  description: '',
  language: 'nl-tr',
  cards: [{ front: '', back: '' }],
  bulkText: '',
  error: '',
})

const emit = defineEmits<{
  startStudy: [deckId: string]
}>()

const handleFileImport = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  try {
    importError.value = ''
    const name = (file.name || '').toLowerCase()
    if (name.endsWith('.json') || file.type === 'application/json') {
      await decksStore.importFromFile(file)
    } else if (name.endsWith('.pdf') || file.type === 'application/pdf') {
      await decksStore.importFromPdf(file)
    } else {
      throw new Error('Unsupported file type')
    }

    showImportDialog.value = false
    target.value = ''
  } catch (error) {
    importError.value = error instanceof Error ? error.message : 'Import failed'
  }
}

const loadExampleDeck = async () => {
  try {
    importError.value = ''
    await decksStore.importFromUrl('/decks/example-nl-tr.json')
    showImportDialog.value = false
  } catch (error) {
    importError.value = error instanceof Error ? error.message : 'Import failed'
  }
}

const startStudy = (deckId: string) => {
  emit('startStudy', deckId)
}

const resetCreateDeckForm = () => {
  createDeckForm.deckName = ''
  createDeckForm.description = ''
  createDeckForm.language = 'nl-tr'
  createDeckForm.cards = [{ front: '', back: '' }]
  createDeckForm.bulkText = ''
  createDeckForm.error = ''
}

const addCreateDeckCardRow = () => {
  createDeckForm.cards.push({ front: '', back: '' })
}

const removeCreateDeckCardRow = (index: number) => {
  if (createDeckForm.cards.length > 1) {
    createDeckForm.cards.splice(index, 1)
  }
}

const handleCreateDeck = () => {
  createDeckForm.error = ''
  if (!createDeckForm.deckName.trim()) {
    createDeckForm.error = 'Lütfen deck adı girin.'
    return
  }

  const validCards = createDeckForm.bulkText.trim()
    ? parseBulkTextToCards(createDeckForm.bulkText.trim())
    : createDeckForm.cards
        .map((card) => ({ front: card.front.trim(), back: card.back.trim() }))
        .filter((card) => card.front && card.back)

  if (validCards.length === 0) {
    createDeckForm.error = 'En az bir kelime ve anlam çifti ekleyin.'
    return
  }

  decksStore.createDeck(
    createDeckForm.deckName.trim(),
    createDeckForm.description.trim(),
    createDeckForm.language,
    validCards,
  )

  resetCreateDeckForm()
  showCreateDeckDialog.value = false
}

const deleteDeck = (deckId: string) => {
  if (confirm('Are you sure you want to delete this deck?')) {
    decksStore.deleteDeck(deckId)
  }
}

const toggleAddCardForm = (deckId: string) => {
  if (!newCardForms[deckId]) {
    newCardForms[deckId] = { front: '', back: '', open: false, error: '' }
  }
  newCardForms[deckId].open = !newCardForms[deckId].open
}

const handleAddCard = (deckId: string) => {
  const form = newCardForms[deckId]
  if (!form) return

  form.error = ''
  if (!form.front.trim() || !form.back.trim()) {
    form.error = 'Lütfen hem kelimeyi hem de anlamını girin.'
    return
  }

  decksStore.addCard(deckId, form.front.trim(), form.back.trim())
  form.front = ''
  form.back = ''
  form.open = false
}

const resetDeck = (deckId: string) => {
  if (confirm('Are you sure you want to reset this deck progress?')) {
    decksStore.resetDeckProgress(deckId)
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header with Import Button -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <h2 class="text-2xl font-bold text-gray-800">Your Decks</h2>
      <div class="flex gap-2">
        <button
          @click="showCreateDeckDialog = true"
          class="btn-primary"
        >
          + Create Deck
        </button>
        <button
          @click="showImportDialog = true"
          class="btn-secondary"
        >
          + Import Deck
        </button>
      </div>
    </div>

    <!-- Create Deck Dialog -->
    <div v-if="showCreateDeckDialog" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 class="text-xl font-bold mb-4">Create New Deck</h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Deck name</label>
            <input
              v-model="createDeckForm.deckName"
              type="text"
              placeholder="Dutch-Turkish Beginner"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              v-model="createDeckForm.description"
              type="text"
              placeholder="Easy Dutch-Turkish words"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <p class="text-sm font-medium text-gray-700">Deck cards</p>
              <button
                @click.prevent="addCreateDeckCardRow"
                class="text-sm text-blue-600 hover:underline"
              >
                + Add word
              </button>
            </div>

            <div v-for="(card, index) in createDeckForm.cards" :key="index" class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Dutch word</label>
                <input
                  v-model="card.front"
                  type="text"
                  placeholder="hallo"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Turkish meaning</label>
                <input
                  v-model="card.back"
                  type="text"
                  placeholder="merhaba"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                v-if="createDeckForm.cards.length > 1"
                @click.prevent="removeCreateDeckCardRow(index)"
                class="text-sm text-red-600 hover:underline self-end"
              >
                Remove
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Or paste bulk cards</label>
            <textarea
              v-model="createDeckForm.bulkText"
              placeholder="grappig komik, eğlenceli\nvernoemd naar (vernoemen (naar)) adını vermek"
              rows="6"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
            <p class="text-xs text-gray-500 mt-2">
              Her satır bir kart olmalıdır. Ayırıcı olarak tab, “ - ”, “:”, “—”, “–” veya son boşluk kullanılabilir.
            </p>
          </div>

          <div v-if="createDeckForm.error" class="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {{ createDeckForm.error }}
          </div>

          <div class="flex gap-2 justify-end">
            <button
              @click="showCreateDeckDialog = false; resetCreateDeckForm()"
              class="btn-secondary"
            >
              Cancel
            </button>
            <button
              @click="handleCreateDeck"
              class="btn-primary"
            >
              Create Deck
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Import Dialog -->
    <div v-if="showImportDialog" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-xl font-bold mb-4">Import Deck</h3>
        
        <div class="space-y-4">
          <!-- File Input -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Select JSON or PDF File
            </label>
            <input
              type="file"
              accept=".json,.pdf"
              @change="handleFileImport"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Error Message -->
          <div v-if="importError" class="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {{ importError }}
          </div>

          <!-- Help Text -->
          <p class="text-sm text-gray-600">
            Or use the example deck: <button
              @click="loadExampleDeck"
              class="text-blue-600 hover:underline font-semibold"
            >
              Load Example
            </button>
          </p>

          <!-- Buttons -->
          <div class="flex gap-2 justify-end">
            <button
              @click="showImportDialog = false"
              class="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Decks Grid -->
    <div v-if="decksStore.decksList.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="deck in decksStore.decksList"
        :key="deck.metadata.deckId"
        class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
      >
        <!-- Deck Info -->
        <h3 class="text-xl font-bold text-gray-800 mb-2">{{ deck.metadata.deckName }}</h3>
        <p class="text-gray-600 text-sm mb-4">{{ deck.metadata.description }}</p>

        <!-- Stats -->
        <div class="bg-gray-100 rounded p-3 mb-4">
          <p class="text-sm text-gray-700">
            <span class="font-semibold">{{ deck.metadata.cardCount }}</span> cards
          </p>
        </div>

        <!-- Progress Info -->
        <div v-if="decksStore.getDeckProgress(deck.metadata.deckId)" class="text-xs text-gray-600 mb-4">
          <p>New: {{ decksStore.getDeckProgress(deck.metadata.deckId)?.stats.newCards }}</p>
          <p>Learning: {{ decksStore.getDeckProgress(deck.metadata.deckId)?.stats.learningCards }}</p>
          <p>Review: {{ decksStore.getDeckProgress(deck.metadata.deckId)?.stats.reviewCards }}</p>
        </div>

        <!-- Add Card Form Toggle -->
        <div class="mb-4">
          <button
            @click="toggleAddCardForm(deck.metadata.deckId)"
            class="w-full px-4 py-2 rounded-lg font-semibold text-gray-800 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            {{ newCardForms[deck.metadata.deckId]?.open ? 'Cancel' : 'Add Card Manually' }}
          </button>
        </div>

        <div v-if="newCardForms[deck.metadata.deckId]?.open" class="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Dutch word</label>
              <input
                v-model="newCardForms[deck.metadata.deckId].front"
                type="text"
                placeholder="hallo"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Turkish meaning</label>
              <input
                v-model="newCardForms[deck.metadata.deckId].back"
                type="text"
                placeholder="merhaba"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div v-if="newCardForms[deck.metadata.deckId]?.error" class="text-xs text-red-600">
              {{ newCardForms[deck.metadata.deckId].error }}
            </div>
            <button
              @click="handleAddCard(deck.metadata.deckId)"
              class="w-full px-4 py-2 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors"
            >
              Save Card
            </button>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2">
          <button
            @click="startStudy(deck.metadata.deckId)"
            class="flex-1 px-4 py-2 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Study
          </button>
          <button
            @click="resetDeck(deck.metadata.deckId)"
            class="px-3 py-2 rounded-lg font-semibold text-gray-700 bg-yellow-100 hover:bg-yellow-200 transition-colors text-xs"
            title="Reset Progress"
          >
            Reset
          </button>
          <button
            @click="deleteDeck(deck.metadata.deckId)"
            class="px-3 py-2 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors text-xs"
            title="Delete Deck"
          >
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <p class="text-gray-600 mb-4">No decks yet. Import a deck to get started!</p>
      <button
        @click="showImportDialog = true"
        class="btn-primary"
      >
        + Import Your First Deck
      </button>
    </div>
  </div>
</template>
