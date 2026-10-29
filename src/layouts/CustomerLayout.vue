<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { ChevronDown, LogOut, Menu, Package, ReceiptText, ShoppingBag, UserRound, X } from "@lucide/vue";
import BrandLogo from "../components/BrandLogo.vue";
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
const mobileOpen = ref(false);
const menuTrigger = ref(null);
const header = ref(null);

function closeMenus() {
  accountOpen.value = false;
  mobileOpen.value = false;
}

watch(() => router.currentRoute.value.fullPath, closeMenus);

function handleOutsideClick(event) {
  if (!header.value?.contains(event.target)) mobileOpen.value = false;
  if (!accountDropdown.value?.contains(event.target)) {
    accountOpen.value = false;
  }
}

function handleEscape(event) {
  if (event.key === "Escape" && accountOpen.value) {
    accountOpen.value = false;
    accountTrigger.value?.focus();
  } else if (event.key === "Escape" && mobileOpen.value) {
    mobileOpen.value = false;
    menuTrigger.value?.focus();
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
  <div class="app-shell flex min-h-screen flex-col bg-background">
    <div class="bg-navy px-4 py-2 text-center text-xs tracking-wide text-white/75">
      Power your digital life. <span class="font-medium text-white">Welcome to Voltech.</span>
    </div>
    <header ref="header" class="relative z-40 border-b border-border bg-surface/90 backdrop-blur-xl">
      <div
        class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-3 px-4 py-3 sm:px-6 md:py-4"
      >
        <RouterLink
          to="/"
          class="flex shrink-0 rounded-lg text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          @click="closeMenus"
        >
        <BrandLogo alt="Voltech homepage" class="h-10 sm:h-12 lg:h-14" />
        </RouterLink>

        <button
          ref="menuTrigger"
          type="button"
          class="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary md:hidden"
          :aria-expanded="mobileOpen"
          aria-controls="customer-navigation"
          :aria-label="mobileOpen ? 'Close navigation' : 'Open navigation'"
          @click="mobileOpen = !mobileOpen; accountOpen = false"
        >
          <component :is="mobileOpen ? X : Menu" :size="20" aria-hidden="true" />
          <span class="hidden min-[360px]:inline">Menu</span>
        </button>

        <nav
          id="customer-navigation"
          aria-label="Main navigation"
          class="w-full flex-col gap-2 border-t border-border pt-4 pb-1 text-sm font-medium md:flex md:w-auto md:flex-row md:items-center md:gap-1 md:border-0 md:p-0 lg:gap-2"
          :class="mobileOpen ? 'mt-3 flex md:mt-0' : 'hidden'"
        >
          <RouterLink to="/" exact-active-class="nav-active" class="inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-3 text-muted-foreground transition hover:bg-primary-soft hover:text-primary">
            <Package :size="17" aria-hidden="true" />
            Products
          </RouterLink>

          <RouterLink v-if="isLoggedIn" to="/cart" active-class="nav-active" class="inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-3 text-muted-foreground transition hover:bg-primary-soft hover:text-primary">
            <ShoppingBag :size="17" aria-hidden="true" />
            Cart
          </RouterLink>

          <RouterLink
            v-if="isLoggedIn"
            to="/orders"
            active-class="nav-active"
            class="inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-3 text-muted-foreground transition hover:bg-primary-soft hover:text-primary"
          >
            <ReceiptText :size="17" aria-hidden="true" />
            My Orders
          </RouterLink>

          <div
            v-if="isLoggedIn"
            ref="accountDropdown"
            class="relative mt-2 border-t border-border pt-3 md:mt-0 md:ml-2 md:border-t-0 md:border-l md:pt-0 md:pl-3"
            @focusout="!$event.currentTarget.contains($event.relatedTarget) && (accountOpen = false)"
          >
            <button
              ref="accountTrigger"
              type="button"
              class="flex min-h-11 w-full items-center gap-2 rounded-xl bg-background px-3 py-2 text-foreground transition hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-primary md:w-auto"
              :aria-expanded="accountOpen"
              aria-controls="customer-account-dropdown"
              @click="accountOpen = !accountOpen"
            >
              <UserRound :size="17" class="shrink-0 text-primary" aria-hidden="true" />
              <span class="max-w-48 truncate md:max-w-28 lg:max-w-40">Hi, {{ auth.customer?.name || "Customer" }}</span>
              <ChevronDown
                :size="16"
                class="ml-auto shrink-0 transition-transform"
                :class="{ 'rotate-180': accountOpen }"
                aria-hidden="true"
              />
            </button>

            <div
              v-if="accountOpen"
              id="customer-account-dropdown"
              class="relative z-50 mt-2 w-full rounded-xl border border-border bg-surface p-1.5 shadow-lg md:absolute md:right-0 md:w-48"
            >
              <button
                type="button"
                class="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-primary"
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
              class="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-5 py-3 text-foreground transition hover:bg-primary-soft hover:text-primary md:ml-3"
            >
              Login
            </RouterLink>

            <RouterLink
              to="/register"
              class="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 py-3 text-on-primary shadow-sm transition hover:bg-primary-hover"
            >
              Sign Up
            </RouterLink>
          </template>
        </nav>
      </div>
    </header>

    <main class="app-content mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
      <RouterView />
      <SolaceChatWidget />
    </main>

    <footer class="mt-16 shrink-0 border-t border-white/10 bg-navy">
      <div
        class="mx-auto max-w-7xl px-4 py-8 text-center text-sm text-white/70 sm:px-6"
      >
        <p>
          © {{ new Date().getFullYear() }} Voltech. Power your digital life.
        </p>
        <p class="mt-2 text-xs">
          Powered by <span class="font-semibold text-accent">SolaceAI</span>
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
nav .nav-active {
  color: var(--primary);
  font-weight: 600;
  background-color: var(--color-primary-soft);
}
</style>
