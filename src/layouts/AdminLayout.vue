
<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { LayoutDashboard, Package, ShoppingBag, Tickets, LogOut, Menu, UserRound } from '@lucide/vue'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const sidebarOpen = ref(false)

const navigation = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Products', path: '/admin/products', icon: Package },
  { name: 'Orders', path: '/admin/orders', icon: ShoppingBag },
  { name: 'Support Tickets', path: '/admin/support-tickets', icon: Tickets },
]

const logout = () => {
  auth.logout()
  router.push('/admin/login')
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Mobile overlay -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-40 bg-dark/40 lg:hidden"
      @click="sidebarOpen = false"
    />

    <!-- Sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface transition-transform lg:translate-x-0"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="flex h-20 items-center border-b border-border px-6">
        <div>
            <img src="/src/assets/logo/header.png" alt="Voltech Logo" class="h-16 w-auto" />
        </div>
      </div>

      <nav class="flex-1 space-y-1 px-3 py-6">
        <RouterLink
          v-for="item in navigation"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition"
          :class="
            $route.path === item.path
              ? 'bg-primary-soft text-primary-hover'
              : 'text-muted-foreground hover:bg-background'
          "
          @click="sidebarOpen = false"
        >
          <span
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-background text-xs font-bold"
          >
            <component :is="item.icon" :size="20" aria-hidden="true" />
          </span>
          {{ item.name }}
        </RouterLink>
      </nav>

      <div class="border-t border-border p-4">
        <button
          class="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50"
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
        class="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border bg-surface px-5 lg:px-8"
      >
        <button
          class="rounded-lg p-2 text-foreground lg:hidden"
          aria-label="Open navigation"
          @click="sidebarOpen = true"
        >
          <Menu :size="24" aria-hidden="true" />
        </button>

        <div>
          <h2 class="text-lg font-semibold text-foreground">
            Admin Dashboard
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

      <main class="p-5 lg:p-8">
        <RouterView />
      </main>
    </div>
  </div>
</template>
