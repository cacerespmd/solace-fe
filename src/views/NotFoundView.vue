<script setup>
import { RouterLink } from 'vue-router'
import { House } from '@lucide/vue'
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-background px-4 py-12">
    <div class="w-full max-w-lg text-center">
      <RouterLink
        to="/"
        class="text-2xl font-bold tracking-tight text-primary"
        aria-label="Voltech home"
      >
        Voltech
      </RouterLink>

      <p class="mt-12 text-8xl font-bold tracking-tight text-primary sm:text-9xl">
        404
      </p>
      <h1 class="mt-6 text-3xl font-semibold text-foreground">
        Page not found
      </h1>
      <p class="mt-4 text-muted-foreground">
        The page you're looking for doesn't exist or may have moved.
      </p>

      <RouterLink
        to="/"
        class="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-surface transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <House :size="18" aria-hidden="true" />
        Back to home
      </RouterLink>
    </div>
  </main>
</template>
