<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Info } from '@lucide/vue'
import ThemeToggle from './components/ThemeToggle.vue'

const route = useRoute()
const inAdmin = computed(() => route.path.startsWith('/admin') && route.path !== '/admin/login')
</script>

<template>
  <div class="border-b border-amber-200 bg-amber-50" :class="{ 'lg:pl-64': inAdmin }">
    <p class="mx-auto flex max-w-7xl items-start justify-center gap-2 px-4 py-2.5 text-center text-xs leading-5 text-amber-800 sm:text-sm">
      <Info :size="16" class="mt-0.5 shrink-0" aria-hidden="true" />
      <span>This site is for demonstration purposes only. No real purchases or payments are processed.</span>
    </p>
  </div>
  <RouterView />
  <ThemeToggle />
</template>
