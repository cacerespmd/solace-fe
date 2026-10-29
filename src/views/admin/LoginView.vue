
<script setup>
import { ref } from 'vue'
import { ArrowLeft, ArrowRight, LayoutDashboard, LoaderCircle, MessagesSquare, Package, ShieldCheck } from '@lucide/vue'
import PasswordInput from '../../components/PasswordInput.vue'
import BrandLogo from '../../components/BrandLogo.vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')

const handleLogin = async () => {
  if (auth.loading) return
  const success = await auth.login(email.value, password.value)

  if (success) {
    router.push('/admin')
  }
}
</script>

<template>
  <div class="admin-login-page flex min-h-screen items-center justify-center px-4 py-6 sm:px-8 sm:py-12">
    <div class="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/80 bg-surface shadow-xl shadow-primary/5 lg:grid-cols-[0.95fr_1.05fr]">
      <aside class="relative hidden overflow-hidden bg-navy p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden="true" class="pointer-events-none absolute -right-28 -top-24 h-80 w-80 rounded-full bg-primary/30 blur-3xl"></div>
        <div aria-hidden="true" class="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-accent/10 blur-3xl"></div>
        <div class="relative">
          <span class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80">
            <ShieldCheck :size="14" class="text-accent" aria-hidden="true" />
            Voltech administration
          </span>
          <h2 class="mt-10 text-4xl font-semibold leading-tight tracking-tight">Behind every<br />great upgrade.</h2>
          <p class="mt-5 max-w-xs text-sm leading-7 text-white/65">Keep your store running smoothly. Manage products, follow orders, and help your customers.</p>
        </div>
        <div class="relative mt-12 space-y-5">
          <div v-for="item in [
            { icon: LayoutDashboard, title: 'Your store at a glance', description: 'Stay on top of daily operations.' },
            { icon: Package, title: 'Products and orders', description: 'Keep your catalog and purchases organized.' },
            { icon: MessagesSquare, title: 'Customer support', description: 'Review tickets and help resolve requests.' },
          ]" :key="item.title" class="flex items-start gap-4">
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-accent">
              <component :is="item.icon" :size="20" aria-hidden="true" />
            </span>
            <div>
              <p class="text-sm font-medium">{{ item.title }}</p>
              <p class="mt-1 text-xs leading-5 text-white/55">{{ item.description }}</p>
            </div>
          </div>
        </div>
        <p class="relative mt-12 text-xs text-white/40">Powered by <span class="font-semibold text-white/70">SolaceAI</span></p>
      </aside>

      <div class="flex flex-col px-6 py-8 sm:px-12 sm:py-10">
        <RouterLink to="/" class="inline-flex w-fit items-center gap-2 rounded-md text-xs font-medium text-muted-foreground transition hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
          <ArrowLeft :size="15" aria-hidden="true" />
          Back to homepage
        </RouterLink>

      <div class="mb-8 mt-8">
        <RouterLink to="/" class="inline-block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
          <BrandLogo variant="logo" alt="Voltech homepage" class="h-14" />
        </RouterLink>
        <div class="mt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
          <ShieldCheck :size="15" aria-hidden="true" />
          Admin portal
        </div>
        <h1 class="mt-3 text-3xl font-semibold tracking-tight text-foreground">Welcome back</h1>
        <p class="mt-2 text-sm leading-6 text-muted-foreground">Sign in to manage your Voltech store.</p>
      </div>

      <form class="space-y-5" :aria-busy="auth.loading" @submit.prevent="handleLogin">
        <div>
          <label for="admin-email" class="mb-2 block text-sm font-medium text-foreground">
            Email address
          </label>
          <input
            id="admin-email"
            v-model.trim="email"
            type="email"
            required
            autocomplete="username"
            placeholder="Enter your email"
            class="w-full rounded-xl border border-border bg-background/60 px-4 py-3.5 text-sm outline-none transition focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary-soft"
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
            class="w-full rounded-xl border border-border bg-background/60 px-4 py-3.5 text-sm outline-none transition focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary-soft"
          />
        </div>

        <p v-if="auth.error" class="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
          {{ auth.error }}
        </p>

        <button
          type="submit"
          :disabled="auth.loading"
          class="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-on-primary shadow-lg shadow-primary/15 transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LoaderCircle v-if="auth.loading" :size="18" class="animate-spin motion-reduce:animate-none" aria-hidden="true" />
          {{ auth.loading ? 'Signing in...' : 'Sign in to dashboard' }}
          <ArrowRight v-if="!auth.loading" :size="17" aria-hidden="true" />
        </button>
      </form>
      <div class="mt-8 border-t border-border pt-5 text-center text-sm text-muted-foreground">
        Shopping with us?
        <RouterLink to="/login" class="rounded font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Customer login</RouterLink>
      </div>
      <p class="mt-5 text-center text-xs leading-5 text-muted-foreground">For authorized Voltech administrators.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-login-page {
  background:
    radial-gradient(ellipse at top left, var(--color-primary-subtle), transparent 55%),
    radial-gradient(ellipse at bottom right, var(--color-primary-soft), transparent 55%),
    var(--background);
}
</style>
