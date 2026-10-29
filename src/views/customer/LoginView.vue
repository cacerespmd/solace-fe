
<script setup>
import { ref } from 'vue'
import { ArrowLeft, ArrowRight, LoaderCircle, MessageCircle, Package, ShieldCheck, Sparkles, UserRound } from '@lucide/vue'
import PasswordInput from '../../components/PasswordInput.vue'
import BrandLogo from '../../components/BrandLogo.vue'
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
  <div class="login-page flex min-h-screen items-center justify-center px-4 py-6 sm:px-8 sm:py-12">
    <div class="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/80 bg-surface shadow-xl shadow-primary/5 lg:grid-cols-[0.95fr_1.05fr]">
      <aside class="relative hidden overflow-hidden bg-navy p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden="true" class="pointer-events-none absolute -right-28 -top-24 h-80 w-80 rounded-full bg-primary/30 blur-3xl"></div>
        <div aria-hidden="true" class="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-accent/10 blur-3xl"></div>
        <div class="relative">
          <span class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80">
            <Sparkles :size="14" class="text-accent" aria-hidden="true" />
            Your Voltech account
          </span>
          <h2 class="mt-10 text-4xl font-semibold leading-tight tracking-tight">Power your<br />digital life.</h2>
          <p class="mt-5 max-w-xs text-sm leading-7 text-white/65">Discover your next upgrade, keep track of your orders, and get help whenever you need it.</p>
        </div>
        <div class="relative mt-16 space-y-6">
          <div class="flex items-start gap-4">
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-accent"><Package :size="20" aria-hidden="true" /></span>
            <div><p class="text-sm font-medium">Keep up with every order</p><p class="mt-1 text-xs leading-5 text-white/55">Check your purchases and order details.</p></div>
          </div>
          <div class="flex items-start gap-4">
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-accent"><MessageCircle :size="20" aria-hidden="true" /></span>
            <div><p class="text-sm font-medium">A helping hand from SolaceAI</p><p class="mt-1 text-xs leading-5 text-white/55">Find products and get customer support.</p></div>
          </div>
        </div>
        <p class="relative mt-16 text-xs text-white/40">Powered by <span class="font-semibold text-white/70">SolaceAI</span></p>
      </aside>

      <div class="px-6 py-8 sm:px-12 sm:py-10">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 rounded-md text-xs font-medium text-muted-foreground transition hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          <ArrowLeft :size="15" aria-hidden="true" />
          Back to homepage
        </RouterLink>

      <div class="mb-8 mt-8">
        <RouterLink to="/" class="inline-block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
          <BrandLogo variant="logo" alt="Voltech homepage" class="h-14" />
        </RouterLink>

        <div class="mt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
          <UserRound :size="15" aria-hidden="true" />
          Customer portal
        </div>
        <h1 class="mt-3 text-3xl font-semibold tracking-tight text-foreground">
          Welcome back
        </h1>

        <p class="mt-2 text-sm leading-6 text-muted-foreground">
          Sign in to shop, track your orders, and get support.
        </p>
      </div>

      <form
        :aria-busy="loading"
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
              class="w-full rounded-xl border border-border bg-background/60 px-4 py-3.5 text-sm outline-none transition focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary-soft"
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
              class="w-full rounded-xl border border-border bg-background/60 px-4 py-3.5 text-sm outline-none transition focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary-soft"
            />
          </div>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-on-primary shadow-lg shadow-primary/15 transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LoaderCircle v-if="loading" :size="18" class="animate-spin motion-reduce:animate-none" aria-hidden="true" />
          {{ loading ? 'Signing in...' : 'Sign in to your account' }}
          <ArrowRight v-if="!loading" :size="17" aria-hidden="true" />
        </button>

        <p class="mt-6 text-center text-sm text-muted-foreground">
          New to Voltech?
          <RouterLink to="/register" class="font-semibold text-primary hover:underline">
            Create an account
          </RouterLink>
        </p>
      </form>

      <RouterLink
        to="/admin/login"
        class="group mt-8 flex items-center gap-3 rounded-xl border border-border bg-background/60 p-4 transition hover:border-primary-border hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
      >
        <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <ShieldCheck :size="22" aria-hidden="true" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block text-sm font-semibold text-foreground">Admin portal</span>
          <span class="mt-1 block text-xs leading-5 text-muted-foreground">Manage your store with admin login</span>
        </span>
        <ArrowRight
          :size="18"
          class="shrink-0 text-primary transition-transform group-hover:translate-x-1"
          aria-hidden="true"
        />
      </RouterLink>

      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  background:
    radial-gradient(ellipse at top left, var(--color-primary-subtle), transparent 55%),
    radial-gradient(ellipse at bottom right, var(--color-primary-soft), transparent 55%),
    var(--background);
}
</style>
