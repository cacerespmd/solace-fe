<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Moon, Sun } from '@lucide/vue'

const isDark = ref(document.documentElement.dataset.theme === 'dark')
const route = useRoute()
const inAdmin = computed(() => route.path.startsWith('/admin') && route.path !== '/admin/login')
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
let hasPreference = false
try { hasPreference = ['light', 'dark'].includes(localStorage.getItem('voltech-theme') || '') } catch { /* Storage may be unavailable. */ }

function applyTheme(dark: boolean) {
  isDark.value = dark
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
}

function toggleTheme() {
  applyTheme(!isDark.value)
  hasPreference = true
  try { localStorage.setItem('voltech-theme', isDark.value ? 'dark' : 'light') } catch { /* Keep the current tab preference. */ }
}

function followSystem(event: MediaQueryListEvent) {
  if (!hasPreference) applyTheme(event.matches)
}

function syncPreference(event: StorageEvent) {
  if (event.key !== 'voltech-theme' && event.key !== null) return
  const preference = event.key === null ? null : event.newValue
  hasPreference = preference === 'dark' || preference === 'light'
  applyTheme(hasPreference ? preference === 'dark' : systemTheme.matches)
}

onMounted(() => {
  systemTheme.addEventListener('change', followSystem)
  window.addEventListener('storage', syncPreference)
})
onUnmounted(() => {
  systemTheme.removeEventListener('change', followSystem)
  window.removeEventListener('storage', syncPreference)
})
</script>

<template>
  <button
    type="button"
    class="fixed bottom-4 left-4 z-[60] inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-foreground shadow-lg transition hover:border-primary hover:text-primary sm:bottom-6 sm:left-6"
    :class="{ 'lg:left-[17.5rem]': inAdmin }"
    :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    :aria-pressed="isDark"
    @click="toggleTheme"
  >
    <Sun v-if="isDark" :size="17" aria-hidden="true" />
    <Moon v-else :size="17" aria-hidden="true" />
    <span class="hidden sm:inline">{{ isDark ? 'Light mode' : 'Dark mode' }}</span>
  </button>
</template>
