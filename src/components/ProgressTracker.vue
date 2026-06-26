<script setup lang="ts">
interface Props {
  totalCards: number
  studiedCards: number
  remaining: number
  ratings: {
    1: number
    2: number
    3: number
    4: number
  }
}

defineProps<Props>()
</script>

<template>
  <div class="bg-white rounded-lg shadow p-6">
    <h3 class="text-lg font-bold text-gray-800 mb-4">Study Progress</h3>

    <!-- Main Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="text-center">
        <p class="text-2xl font-bold text-blue-600">{{ studiedCards }}</p>
        <p class="text-xs text-gray-600">Studied</p>
      </div>
      <div class="text-center">
        <p class="text-2xl font-bold text-purple-600">{{ remaining }}</p>
        <p class="text-xs text-gray-600">Remaining</p>
      </div>
      <div class="text-center">
        <p class="text-2xl font-bold text-gray-600">{{ totalCards }}</p>
        <p class="text-xs text-gray-600">Total</p>
      </div>
      <div class="text-center">
        <p class="text-2xl font-bold text-green-600">{{ Math.round((studiedCards / totalCards) * 100) }}%</p>
        <p class="text-xs text-gray-600">Complete</p>
      </div>
    </div>

    <!-- Ratings Breakdown -->
    <div v-if="studiedCards > 0" class="space-y-3">
      <p class="text-sm font-semibold text-gray-700">Rating Breakdown:</p>
      
      <!-- Again (Red) -->
      <div class="flex items-center gap-2">
        <span class="text-xs font-semibold text-red-600 w-12">Again:</span>
        <div class="flex-1 h-6 bg-red-100 rounded relative">
          <div
            class="h-full bg-red-500 rounded transition-all"
            :style="{ width: `${(ratings[1] / studiedCards) * 100}%` }"
          ></div>
          <span class="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-700">
            {{ ratings[1] }}
          </span>
        </div>
      </div>

      <!-- Hard (Orange) -->
      <div class="flex items-center gap-2">
        <span class="text-xs font-semibold text-orange-600 w-12">Hard:</span>
        <div class="flex-1 h-6 bg-orange-100 rounded relative">
          <div
            class="h-full bg-orange-500 rounded transition-all"
            :style="{ width: `${(ratings[2] / studiedCards) * 100}%` }"
          ></div>
          <span class="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-700">
            {{ ratings[2] }}
          </span>
        </div>
      </div>

      <!-- Good (Green) -->
      <div class="flex items-center gap-2">
        <span class="text-xs font-semibold text-green-600 w-12">Good:</span>
        <div class="flex-1 h-6 bg-green-100 rounded relative">
          <div
            class="h-full bg-green-500 rounded transition-all"
            :style="{ width: `${(ratings[3] / studiedCards) * 100}%` }"
          ></div>
          <span class="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-700">
            {{ ratings[3] }}
          </span>
        </div>
      </div>

      <!-- Easy (Blue) -->
      <div class="flex items-center gap-2">
        <span class="text-xs font-semibold text-blue-600 w-12">Easy:</span>
        <div class="flex-1 h-6 bg-blue-100 rounded relative">
          <div
            class="h-full bg-blue-500 rounded transition-all"
            :style="{ width: `${(ratings[4] / studiedCards) * 100}%` }"
          ></div>
          <span class="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-700">
            {{ ratings[4] }}
          </span>
        </div>
      </div>
    </div>

    <!-- Accuracy -->
    <div v-if="studiedCards > 0" class="mt-4 pt-4 border-t">
      <p class="text-sm text-gray-600">
        <span class="font-semibold">Accuracy:</span> 
        {{ Math.round(((ratings[3] + ratings[4]) / studiedCards) * 100) }}% correct
      </p>
    </div>
  </div>
</template>
