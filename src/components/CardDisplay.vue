<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Card } from '../types/flashcard'

interface Props {
  card: Card | null
  cardIndex: number
  totalCards: number
  showAnswer?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showAnswer: false,
})

const emit = defineEmits<{
  updateShowAnswer: [value: boolean]
  swipeLeft: []
  swipeRight: []
}>()

const isFlipped = computed({
  get: () => props.showAnswer,
  set: (value) => emit('updateShowAnswer', value),
})

const touchStartX = ref<number | null>(null)
const touchStartY = ref<number | null>(null)
const touchMoved = ref(false)

const handleTouchStart = (event: TouchEvent) => {
  const touch = event.touches[0]
  touchStartX.value = touch.clientX
  touchStartY.value = touch.clientY
  touchMoved.value = false
}

const handleTouchMove = (event: TouchEvent) => {
  if (touchStartX.value === null) return
  const touch = event.touches[0]
  if (Math.abs(touch.clientX - touchStartX.value) > 20) {
    touchMoved.value = true
  }
}

const handleTouchEnd = (event: TouchEvent) => {
  if (touchStartX.value === null || touchStartY.value === null) return

  const touch = event.changedTouches[0]
  const dx = touch.clientX - touchStartX.value
  const dy = touch.clientY - touchStartY.value

  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
    if (dx > 0) {
      emit('swipeRight')
    } else {
      emit('swipeLeft')
    }
  }

  touchStartX.value = null
  touchStartY.value = null
  touchMoved.value = false
}

const toggleFlip = () => {
  if (touchMoved.value) {
    touchMoved.value = false
    return
  }

  isFlipped.value = !isFlipped.value
}
</script>

<template>
  <div class="space-y-4">
    <!-- Progress Info -->
    <div class="flex items-center justify-between text-sm text-gray-600">
      <span>Card {{ cardIndex + 1 }} of {{ totalCards }}</span>
      <div class="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          class="h-full bg-blue-600 transition-all duration-300"
          :style="{ width: `${((cardIndex + 1) / totalCards) * 100}%` }"
        ></div>
      </div>
    </div>

    <!-- Card Display -->
    <div
      @click="toggleFlip"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
      class="cursor-pointer perspective"
    >
      <div
        class="relative w-full h-96 rounded-2xl shadow-2xl transition-transform duration-300 transform hover:scale-105"
        :class="{ 'scale-95': isFlipped }"
      >
        <!-- Front (Dutch) -->
        <div
          v-show="!isFlipped"
          class="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex flex-col items-center justify-center p-8 text-white"
        >
          <p class="text-lg font-medium mb-4 opacity-75">Dutch</p>
          <p class="text-4xl font-bold text-center break-words">{{ card?.front }}</p>
          <p class="text-sm mt-8 opacity-50">Click to reveal answer</p>
        </div>

        <!-- Back (Turkish) -->
        <div
          v-show="isFlipped"
          class="absolute inset-0 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex flex-col items-center justify-center p-8 text-white"
        >
          <p class="text-lg font-medium mb-4 opacity-75">Turkish</p>
          <p class="text-4xl font-bold text-center break-words">{{ card?.back }}</p>
          <p class="text-sm mt-8 opacity-50">Click to hide answer</p>
        </div>
      </div>
    </div>

    <!-- Keyboard Hint -->
    <p class="text-center text-xs text-gray-500">
      Press <kbd class="px-2 py-1 bg-gray-200 rounded">Space</kbd> to flip
    </p>
  </div>
</template>

<style scoped>
.perspective {
  perspective: 1000px;
}
</style>
