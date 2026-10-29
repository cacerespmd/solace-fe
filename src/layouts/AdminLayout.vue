
<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { LayoutDashboard, Package, ShoppingBag, Tickets, LogOut, Menu, UserRound, X, ShieldCheck } from '@lucide/vue'
import BrandLogo from '../components/BrandLogo.vue'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const sidebarOpen = ref(false)

const navigation = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Products', path: '/admin/products', icon: Package },
  { name: 'Orders', path: '/admin/orders', icon: ShoppingBag },
  { name: 'Support Tickets', path: '/admin/support-tickets', icon: Tickets },
]

const activePath = computed(() => [...navigation].reverse().find(item =>
  route.path === item.path || (item.path !== '/admin' && route.path.startsWith(`${item.path}/`))
)?.path || '/admin')
const pageTitle = computed(() => navigation.find(item => item.path === activePath.value)?.name || 'Dashboard')

const logout = () => {
  auth.logout()
  router.push('/admin/login')
}
</script>

<template>
  <div class="app-shell min-h-screen bg-background" @keydown.esc="sidebarOpen = false">
    <!-- Mobile overlay -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-40 bg-dark/40 lg:hidden"
      @click="sidebarOpen = false"
    />

    <!-- Sidebar -->
    <aside
      id="admin-navigation"
      class="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/10 bg-navy text-white transition-transform lg:translate-x-0"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="flex h-24 items-center justify-between border-b border-white/10 px-6">
        <RouterLink to="/admin" class="rounded-xl px-3 py-1" @click="sidebarOpen = false">
          <BrandLogo variant="header-light" alt="Voltech dashboard" class="h-12" />
        </RouterLink>
        <button type="button" aria-label="Close navigation" class="rounded-lg p-2 text-white/70 hover:bg-white/10 lg:hidden" @click="sidebarOpen = false"><X :size="20" aria-hidden="true" /></button>
      </div>

      <nav aria-label="Admin navigation" class="flex-1 space-y-2 px-4 py-7">
        <p class="mb-5 flex items-center gap-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/45"><ShieldCheck :size="13" aria-hidden="true" /> Admin portal</p>
        <RouterLink
          v-for="item in navigation"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition"
          :class="
            activePath === item.path
              ? 'bg-primary text-white shadow-lg shadow-primary/20'
              : 'text-white/65 hover:bg-white/5 hover:text-white'
          "
          :aria-current="activePath === item.path ? 'page' : undefined"
          @click="sidebarOpen = false"
        >
          <span
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-xs font-bold"
          >
            <component :is="item.icon" :size="20" aria-hidden="true" />
          </span>
          {{ item.name }}
        </RouterLink>
      </nav>

      <div class="border-t border-white/10 p-4 pb-20 lg:pb-4">
        <p class="mb-3 px-4 text-xs text-white/40">Powered by <span class="font-semibold text-white/65">SolaceAI</span></p>
        <button
          class="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-white/65 transition hover:bg-white/5 hover:text-white"
          @click="logout"
        >
          <LogOut :size="20" aria-hidden="true" />
          Logout
        </button>
      </div>
    </aside>

    <!-- Main content -->
    <div class="lg:pl-64">
      <header
        class="sticky top-0 z-30 flex h-24 items-center justify-between gap-3 border-b border-border bg-background/90 px-5 backdrop-blur-xl lg:px-10"
      >
        <button
          class="rounded-lg p-2 text-foreground lg:hidden"
          aria-label="Open navigation"
          aria-controls="admin-navigation"
          :aria-expanded="sidebarOpen"
          @click="sidebarOpen = true"
        >
          <Menu :size="24" aria-hidden="true" />
        </button>

        <div>
          <h2 class="text-lg font-semibold text-foreground">
            {{ pageTitle }}
          </h2>
          <p class="text-xs text-muted-foreground">
            Manage your Voltech store
          </p>
        </div>

        <div class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-subtle font-semibold text-primary-hover"
          >
            <UserRound :size="20" aria-hidden="true" />
          </div>
          <span class="hidden text-sm font-medium text-foreground sm:block">
            Voltech Admin
          </span>
        </div>
      </header>

      <main class="app-content mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-10">
        <RouterView />
      </main>
    </div>
  </div>
</template>
