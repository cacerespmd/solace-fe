
<script setup>
import { ref } from 'vue'
import PasswordInput from '../../components/PasswordInput.vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')

const handleLogin = async () => {
  const success = await auth.login(email.value, password.value)

  if (success) {
    router.push('/admin')
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background px-4">
    <div class="w-full max-w-md rounded-2xl bg-surface p-8 shadow-lg">
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold tracking-tight text-foreground">
          Voltech
        </h1>
        <p class="mt-2 text-sm text-muted-foreground">
          Admin Dashboard
        </p>
      </div>

      <form class="space-y-5" @submit.prevent="handleLogin">
        <div>
          <label class="mb-2 block text-sm font-medium text-foreground">
            Email address
          </label>
          <input
            v-model="email"
            type="email"
            required
            autocomplete="username"
            placeholder="Enter your email"
            class="w-full rounded-lg border border-border px-4 py-3 outline-none focus:border-primary"
          />
        </div>

        <div>
          <label for="admin-password" class="mb-2 block text-sm font-medium text-foreground">
            Password
          </label>
          <PasswordInput
            id="admin-password"
            v-model="password"
            required
            autocomplete="current-password"
            placeholder="Enter your password"
            class="w-full rounded-lg border border-border px-4 py-3 outline-none focus:border-primary"
          />
        </div>

        <p v-if="auth.error" class="text-sm text-red-600" role="alert">
          {{ auth.error }}
        </p>

        <button
          type="submit"
          :disabled="auth.loading"
          class="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-surface transition hover:bg-primary-hover disabled:opacity-50"
        >
          {{ auth.loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>
    </div>
  </div>
</template>
