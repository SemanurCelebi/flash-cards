import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const repoBase = process.env.VITE_BASE || '/flash-cards/'

// https://vite.dev/config/
export default defineConfig({
  base: repoBase,
  plugins: [vue()],
})
