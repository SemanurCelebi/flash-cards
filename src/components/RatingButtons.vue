<script setup lang="ts">
interface Emits {
  rate: [rating: 1 | 2 | 3 | 4]
  skip: []
}

defineEmits<Emits>()
</script>

<template>
  <div class="space-y-4">
    <!-- Rating Explanation -->
    <p class="text-center text-sm text-gray-600 mb-4">
      How difficult was this card?
    </p>

    <!-- Rating Buttons (FSRS 4-point scale) -->
    <div class="grid grid-cols-2 gap-3">
      <!-- Again (Red) -->
      <button
        @click="$emit('rate', 1)"
        class="px-4 py-3 rounded-lg font-bold text-white bg-red-500 hover:bg-red-600 transition-all transform hover:scale-105 active:scale-95"
      >
        <span class="text-lg">🔴</span>
        <div class="text-xs mt-1">Again</div>
        <div class="text-xs opacity-75">(Forgot)</div>
      </button>

      <!-- Hard (Orange) -->
      <button
        @click="$emit('rate', 2)"
        class="px-4 py-3 rounded-lg font-bold text-white bg-orange-500 hover:bg-orange-600 transition-all transform hover:scale-105 active:scale-95"
      >
        <span class="text-lg">🟠</span>
        <div class="text-xs mt-1">Hard</div>
        <div class="text-xs opacity-75">(Difficult)</div>
      </button>

      <!-- Good (Green) -->
      <button
        @click="$emit('rate', 3)"
        class="px-4 py-3 rounded-lg font-bold text-white bg-green-500 hover:bg-green-600 transition-all transform hover:scale-105 active:scale-95 col-span-2"
      >
        <span class="text-lg">🟢</span>
        <div class="text-xs mt-1">Good</div>
        <div class="text-xs opacity-75">(Correct)</div>
      </button>

      <!-- Easy (Blue) -->
      <button
        @click="$emit('rate', 4)"
        class="px-4 py-3 rounded-lg font-bold text-white bg-blue-500 hover:bg-blue-600 transition-all transform hover:scale-105 active:scale-95 col-span-2"
      >
        <span class="text-lg">🔵</span>
        <div class="text-xs mt-1">Easy</div>
        <div class="text-xs opacity-75">(Too easy)</div>
      </button>
    </div>

    <!-- Keyboard Shortcuts Hint -->
    <div class="text-xs text-gray-500 text-center pt-2">
      <p>Keyboard: <kbd class="px-1 bg-gray-200 rounded">1</kbd> 
      <kbd class="px-1 bg-gray-200 rounded">2</kbd> 
      <kbd class="px-1 bg-gray-200 rounded">3</kbd> 
      <kbd class="px-1 bg-gray-200 rounded">4</kbd></p>
    </div>

    <!-- Skip Button -->
    <button
      @click="$emit('skip')"
      class="w-full px-4 py-2 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
    >
      Skip this card
    </button>
  </div>
</template>

<style scoped>
kbd {
  display: inline-block;
  padding: 0.2rem 0.4rem;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 3px;
  font-size: 0.75rem;
  font-family: monospace;
}
</style>
