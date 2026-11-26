/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import RubyPlugin from 'vite-plugin-ruby'

// Vite is integrated into Rails via vite_rails: Rails renders the HTML shell
// (app/views/layouts/application.html.erb) and vite_ruby injects the bundles.
export default defineConfig({
  plugins: [RubyPlugin(), react()],
  test: {
    root: '.',
    include: ['app/frontend/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./app/frontend/test/setup.ts'],
    css: false,
  },
})
