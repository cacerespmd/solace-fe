<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { ChevronDown, LogOut } from "@lucide/vue";
import { RouterLink, RouterView, useRouter } from "vue-router";
import { useCustomerAuthStore } from "../stores/customerAuth.js";
import { useCartStore } from "../stores/cart.js";
import SolaceChatWidget from "../components/SolaceChatWidget.vue";

const router = useRouter();
const auth = useCustomerAuthStore();
const cart = useCartStore();

const isLoggedIn = computed(() => Boolean(auth.token));
const accountOpen = ref(false);
const accountDropdown = ref(null);
const accountTrigger = ref(null);

function handleOutsideClick(event) {
  if (!accountDropdown.value?.contains(event.target)) {
    accountOpen.value = false;
  }
}

function handleEscape(event) {
  if (event.key === "Escape" && accountOpen.value) {
    accountOpen.value = false;
    accountTrigger.value?.focus();
  }
}

onMounted(() => {
  document.addEventListener("click", handleOutsideClick);
  document.addEventListener("keydown", handleEscape);
});

onUnmounted(() => {
  document.removeEventListener("click", handleOutsideClick);
  document.removeEventListener("keydown", handleEscape);
});

onMounted(async () => {
  if (auth.token && !auth.customer) {
    try {
      await auth.fetchCustomer();
    } catch (error) {
      console.error("Unable to load customer profile:", error);
    }
  }
});

function handleLogout() {
  accountOpen.value = false;
  cart.clearCart();
  auth.logout();
  router.push("/login");
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <header class="border-b border-border bg-surface">
      <div
        class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6"
      >
        <RouterLink
          to="/"
          class="flex text-2xl font-bold tracking-tight text-primary"
        >
        <img src="/src/assets/logo/header.png" alt="Voltech Logo" class="h-20 w-auto" />
        </RouterLink>

        <nav class="flex flex-wrap items-center gap-5 text-sm font-medium">
          <RouterLink v-if="isLoggedIn" to="/" class="text-muted-foreground hover:text-primary">
            Products
          </RouterLink>

          <RouterLink v-if="isLoggedIn" to="/cart" class="text-muted-foreground hover:text-primary">
            Cart
          </RouterLink>

          <RouterLink
            v-if="isLoggedIn"
            to="/orders"
            class="text-muted-foreground hover:text-primary"
          >
            My Orders
          </RouterLink>

          <div
            v-if="isLoggedIn"
            ref="accountDropdown"
            class="relative"
            @focusout="!$event.currentTarget.contains($event.relatedTarget) && (accountOpen = false)"
          >
            <button
              ref="accountTrigger"
              type="button"
              class="flex items-center gap-2 rounded-lg px-3 py-2 text-foreground transition hover:bg-background focus-visible:outline-2 focus-visible:outline-primary"
              :aria-expanded="accountOpen"
              aria-controls="customer-account-dropdown"
              @click="accountOpen = !accountOpen"
            >
              Hi, {{ auth.customer?.name || "Customer" }}
              <ChevronDown
                :size="16"
                class="transition-transform"
                :class="{ 'rotate-180': accountOpen }"
                aria-hidden="true"
              />
            </button>

            <div
              v-if="accountOpen"
              id="customer-account-dropdown"
              class="absolute right-0 z-50 mt-2 w-44 rounded-xl border border-border bg-surface p-1.5 shadow-lg"
            >
              <button
                type="button"
                class="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-primary"
                @click="handleLogout"
              >
                <LogOut :size="16" aria-hidden="true" />
                Logout
              </button>
            </div>
          </div>

          <template v-else>
            <RouterLink
              to="/login"
              class="text-muted-foreground hover:text-primary"
            >
              Login
            </RouterLink>

            <RouterLink
              to="/register"
              class="rounded-lg bg-primary px-4 py-2 text-surface hover:bg-primary-hover"
            >
              Sign Up
            </RouterLink>
          </template>
        </nav>
      </div>
    </header>

    <main class="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <RouterView />
      <SolaceChatWidget />
    </main>

    <footer class="mt-16 border-t border-border bg-surface">
      <div
        class="mx-auto max-w-7xl px-4 py-8 text-center text-sm text-muted-foreground sm:px-6"
      >
        <p>
          © {{ new Date().getFullYear() }} Voltech. Power your digital life.
        </p>
        <p class="mt-2 text-xs">
          Powered by <span class="font-semibold text-primary">SolaceAI</span>
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
nav a[aria-current="page"] {
  color: var(--primary);
  font-weight: 600;
}
</style>
