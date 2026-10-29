
<script setup>
import { ref } from 'vue'
import PasswordInput from '../../components/PasswordInput.vue'
import { RouterLink, useRouter } from 'vue-router'
import { useCustomerAuthStore } from '../../stores/customerAuth'

const router = useRouter()
const auth = useCustomerAuthStore()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')

async function handleRegister() {
  if (loading.value) return

  error.value = ''

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.'
    return
  }

  loading.value = true

  try {
    await auth.register({
      name: name.value,
      email: email.value,
      password: password.value,
    })

    router.push({
      path: '/login',
      query: { registered: '1' },
    })
  } catch (err) {
    const detail = err.response?.data?.detail

    error.value =
      typeof detail === 'string'
        ? detail
        : 'Unable to create your account. Please check your details.'
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
          Create your account
        </h1>

        <p class="mt-2 text-sm text-muted-foreground">
          Shop confidently with intelligent customer support.
        </p>
      </div>

      <form
        class="rounded-2xl border border-border bg-surface p-8 shadow-sm"
        @submit.prevent="handleRegister"
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
            <label for="name" class="mb-2 block text-sm font-medium text-foreground">
              Full name
            </label>

            <input
              id="name"
              v-model.trim="name"
              type="text"
              autocomplete="name"
              required
              minlength="2"
              maxlength="150"
              placeholder="Juan Dela Cruz"
              class="w-full rounded-lg border border-border px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-subtle"
            />
          </div>

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
              class="w-full rounded-lg border border-border px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-subtle"
            />
          </div>

          <div>
            <label for="password" class="mb-2 block text-sm font-medium text-foreground">
              Password
            </label>

            <PasswordInput
              id="password"
              v-model="password"
              autocomplete="new-password"
              required
              minlength="8"
              maxlength="128"
              placeholder="At least 8 characters"
              class="w-full rounded-lg border border-border px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-subtle"
            />
          </div>

          <div>
            <label for="confirm-password" class="mb-2 block text-sm font-medium text-foreground">
              Confirm password
            </label>

            <PasswordInput
              id="confirm-password"
              v-model="confirmPassword"
              autocomplete="new-password"
              required
              placeholder="Re-enter your password"
              class="w-full rounded-lg border border-border px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-subtle"
            />
          </div>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="mt-6 w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-surface transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ loading ? 'Creating account...' : 'Create Account' }}
        </button>

        <p class="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?
          <RouterLink to="/login" class="font-semibold text-primary hover:underline">
            Sign in
          </RouterLink>
        </p>
      </form>
    </div>
  </div>
</template>
