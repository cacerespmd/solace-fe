
<script setup>
import { ref } from 'vue'
import PasswordInput from '../../components/PasswordInput.vue'
import { RouterLink, useRouter } from 'vue-router'
import { useCustomerAuthStore } from '../../stores/customerAuth'

const router = useRouter()
const auth = useCustomerAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  if (loading.value) return

  loading.value = true
  error.value = ''

  try {
    await auth.login({
      email: email.value,
      password: password.value,
    })

    router.push('/')
  } catch (err) {
    error.value =
      err.response?.data?.detail ||
      'Unable to sign in. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background px-4 py-12">
    <div class="w-full max-w-md">
      <div class="mb-8 text-center">
        <RouterLink to="/" class="text-3xl font-bold tracking-tight text-primary">
          Voltech
        </RouterLink>

        <h1 class="mt-6 text-2xl font-semibold text-foreground">
          Welcome back
        </h1>

        <p class="mt-2 text-sm text-muted-foreground">
          Sign in to manage your orders and get support.
        </p>
      </div>

      <form
        class="rounded-2xl border border-border bg-surface p-8 shadow-sm"
        @submit.prevent="handleLogin"
      >
        <div
          v-if="error"
          role="alert"
          class="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {{ error }}
        </div>

        <div class="space-y-5">
          <div>
            <label for="email" class="mb-2 block text-sm font-medium text-foreground">
              Email address
            </label>

            <input
              id="email"
              v-model.trim="email"
              type="email"
              autocomplete="email"
              required
              placeholder="you@example.com"
              class="w-full rounded-lg border border-border px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-subtle"
            />
          </div>

          <div>
            <label for="password" class="mb-2 block text-sm font-medium text-foreground">
              Password
            </label>

            <PasswordInput
              id="password"
              v-model="password"
              autocomplete="current-password"
              required
              placeholder="Enter your password"
              class="w-full rounded-lg border border-border px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-subtle"
            />
          </div>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="mt-6 w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-surface transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>

        <p class="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?
          <RouterLink to="/register" class="font-semibold text-primary hover:underline">
            Create an account
          </RouterLink>
        </p>
      </form>
    </div>
  </div>
</template>
