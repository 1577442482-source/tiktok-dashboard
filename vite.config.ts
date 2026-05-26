import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import bulkImportPlugin from './vite-plugin-bulk-import'

export default defineConfig({
  plugins: [react(), tailwindcss(), bulkImportPlugin()],
})
