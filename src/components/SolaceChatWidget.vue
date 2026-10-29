
<script setup>
import { computed, nextTick, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useCustomerAuthStore } from "../stores/customerAuth.js";
import api from "../api/axios.js";

const route = useRoute();
const router = useRouter();
const customerAuth = useCustomerAuthStore();

const isOpen = ref(false);
const input = ref("");
const loading = ref(false);
const error = ref("");
const messagesContainer = ref(null);

const isLoggedIn = computed(() => Boolean(customerAuth.token));

const messages = ref([
  {
    id: 1,
    role: "assistant",
    content:
      "Hi! 👋 I'm SolaceAI, your AI shopping and customer support assistant for Voltech. I can help you find products, check availability, track orders, and answer questions about returns and store policies. How can I help you today?",
    sources: [],
    products: [],
  },
]);

const suggestions = [
  "What products do you have?",
  "Which products are in stock?",
  "Where is my latest order?",
  "Can I return a damaged item?",
];

let nextId = 2;

async function scrollToBottom() {
  await nextTick();

  if (messagesContainer.value) {
    messagesContainer.value.scrollTop =
      messagesContainer.value.scrollHeight;
  }
}

function toggleChat() {
  isOpen.value = !isOpen.value;

  if (isOpen.value) {
    scrollToBottom();
  }
}

function goToLogin() {
  isOpen.value = false;

  router.push({
    name: "customer-login",
    query: {
      redirect: route.fullPath,
    },
  });
}

function formatPrice(price) {
  if (price === null || price === undefined || price === "") {
    return "Price unavailable";
  }

  const amount = Number(price);

  if (!Number.isFinite(amount)) {
    return "Price unavailable";
  }

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function isSafeUrl(url) {
  if (typeof url !== "string" || !url.trim()) {
    return false;
  }

  try {
    const parsed = new URL(url);

    return (
      parsed.protocol === "https:" ||
      parsed.protocol === "http:"
    );
  } catch {
    return false;
  }
}

function handleImageError(event) {
  event.target.style.display = "none";

  const fallback = event.target.nextElementSibling;

  if (fallback) {
    fallback.classList.remove("hidden");
  }
}

function hasStockInformation(product) {
  return (
    product.stock_quantity !== null &&
    product.stock_quantity !== undefined
  );
}

function getStockQuantity(product) {
  return Number(product.stock_quantity);
}

function getProductId(product) {
  return product.id ?? product.product_id;
}

function getErrorMessage(err) {
  if (err.response?.status === 401) {
    return "Your session has expired. Please log in again.";
  }

  const detail = err.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  return "Something went wrong. Please try again.";
}

async function sendMessage(suggestion = null) {
  if (loading.value) return;

  const text =
    typeof suggestion === "string"
      ? suggestion.trim()
      : input.value.trim();

  if (!text) return;

  if (!isLoggedIn.value) {
    error.value = "Please log in to chat with SolaceAI.";
    return;
  }

  error.value = "";
  input.value = "";

  messages.value.push({
    id: nextId++,
    role: "user",
    content: text,
    sources: [],
    products: [],
  });

  loading.value = true;

  await scrollToBottom();

  try {
    const { data } = await api.post(
      "/api/chat",
      {
        message: text,
      },
      {
        headers: {
          Authorization: `Bearer ${customerAuth.token}`,
        },
      }
    );

    messages.value.push({
      id: nextId++,
      role: "assistant",
      content:
        data.reply ||
        "I'm sorry, I couldn't generate a response.",
      sources: Array.isArray(data.sources)
        ? data.sources
        : [],
      products: Array.isArray(data.products)
        ? data.products
        : [],
    });
  } catch (err) {
    error.value = getErrorMessage(err);

    // Restore the message for retry.
    input.value = text;
  } finally {
    loading.value = false;

    await scrollToBottom();
  }
}

function handleKeydown(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

watch(isOpen, (open) => {
  if (open) {
    scrollToBottom();
  }
});
</script>

<template>
  <div
    class="fixed bottom-5 right-5 z-[100] sm:bottom-6 sm:right-6"
  >
    <!-- ====================================== -->
    <!-- FLOATING CHAT WINDOW -->
    <!-- ====================================== -->
    <section
      v-if="isOpen"
      role="dialog"
      aria-label="SolaceAI customer support"
      class="mb-4 flex h-[min(600px,calc(100dvh-110px))] w-[calc(100vw-40px)] max-w-[390px] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
    >
      <!-- ==================================== -->
      <!-- CHAT HEADER -->
      <!-- ==================================== -->
      <div
        class="flex shrink-0 items-center gap-3 bg-brand-gradient px-4 py-4 text-surface"
      >
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface/20 text-xl"
        >
          ✨
        </div>

        <div class="min-w-0 flex-1">
          <h2 class="font-semibold">
            SolaceAI
          </h2>

          <p class="text-xs text-on-brand-muted">
            AI Customer Support
          </p>
        </div>

        <button
          type="button"
          aria-label="Close SolaceAI chat"
          class="rounded-lg p-2 transition hover:bg-surface/20"
          @click="toggleChat"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- ==================================== -->
      <!-- CHAT MESSAGES -->
      <!-- ==================================== -->
      <div
        ref="messagesContainer"
        aria-live="polite"
        class="min-h-0 flex-1 space-y-4 overflow-y-auto bg-background px-4 py-5"
      >
        <div
          v-for="message in messages"
          :key="message.id"
          class="flex"
          :class="
            message.role === 'user'
              ? 'justify-end'
              : 'justify-start'
          "
        >
          <div
            class="min-w-0 max-w-[90%]"
            :class="
              message.products?.length
                ? 'w-full'
                : ''
            "
          >
            <!-- ============================== -->
            <!-- MESSAGE BUBBLE -->
            <!-- ============================== -->
            <div
              class="whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
              :class="
                message.role === 'user'
                  ? 'rounded-br-sm bg-primary text-surface'
                  : 'rounded-bl-sm border border-border bg-surface text-foreground'
              "
            >
              {{ message.content }}
            </div>

            <!-- ============================== -->
            <!-- PRODUCT CARDS -->
            <!-- ============================== -->
            <div
              v-if="message.products?.length"
              class="mt-3 space-y-3"
            >
              <RouterLink
                v-for="(product, index) in message.products"
                :key="getProductId(product) ?? index"
                :to="{
                  name: 'customer-product-details',
                  params: {
                    id: getProductId(product),
                  },
                }"
                class="block overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition hover:border-primary-border hover:shadow-md"
              >
                <!-- Product image -->
                <div
                  class="relative flex h-40 items-center justify-center bg-background p-3"
                >
                  <template v-if="isSafeUrl(product.image_url)">
                    <img
                      :src="product.image_url"
                      :alt="product.name"
                      loading="lazy"
                      referrerpolicy="no-referrer"
                      class="h-full w-full object-contain"
                      @error="handleImageError"
                    />

                    <div
                      class="hidden flex-col items-center justify-center gap-2 text-muted-foreground"
                    >
                      <span class="text-3xl">📦</span>
                      <span class="text-xs">
                        Image unavailable
                      </span>
                    </div>
                  </template>

                  <div
                    v-else
                    class="flex flex-col items-center justify-center gap-2 text-muted-foreground"
                  >
                    <span class="text-3xl">📦</span>

                    <span class="text-xs">
                      No product image
                    </span>
                  </div>
                </div>

                <!-- Product information -->
                <div class="space-y-2 p-3">
                  <h3
                    class="line-clamp-2 text-sm font-semibold text-foreground"
                  >
                    {{ product.name }}
                  </h3>

                  <p
                    v-if="product.description"
                    class="line-clamp-2 text-xs leading-relaxed text-muted-foreground"
                  >
                    {{ product.description }}
                  </p>

                  <p class="text-base font-bold text-primary-hover">
                    {{ formatPrice(product.price) }}
                  </p>

                  <div
                    class="flex flex-wrap items-center justify-between gap-2"
                  >
                    <span
                      v-if="hasStockInformation(product)"
                      class="text-xs font-medium"
                      :class="
                        getStockQuantity(product) > 0
                          ? 'text-green-600'
                          : 'text-red-500'
                      "
                    >
                      {{
                        getStockQuantity(product) > 0
                          ? `${getStockQuantity(product)} in stock`
                          : "Out of stock"
                      }}
                    </span>

                    <span
                      v-else
                      class="text-xs text-muted-foreground"
                    >
                      Stock unavailable
                    </span>

                    <span
                      class="text-xs font-semibold text-primary"
                    >
                      View product →
                    </span>
                  </div>
                </div>
              </RouterLink>
            </div>

            <p
              v-if="message.role === 'assistant'"
              class="mt-1 px-1 text-[10px] text-muted-foreground"
            >
              SolaceAI
            </p>
          </div>
        </div>

        <!-- ================================ -->
        <!-- TYPING INDICATOR -->
        <!-- ================================ -->
        <div
          v-if="loading"
          class="flex justify-start"
        >
          <div
            class="flex items-center gap-1.5 rounded-2xl border border-border bg-surface px-4 py-3 shadow-sm"
          >
            <span
              class="h-2 w-2 animate-bounce rounded-full bg-primary-light"
            ></span>

            <span
              class="h-2 w-2 animate-bounce rounded-full bg-primary-light"
              style="animation-delay: 150ms"
            ></span>

            <span
              class="h-2 w-2 animate-bounce rounded-full bg-primary-light"
              style="animation-delay: 300ms"
            ></span>
          </div>
        </div>
      </div>

      <!-- ==================================== -->
      <!-- SUGGESTED QUESTIONS -->
      <!-- ==================================== -->
      <div
        v-if="messages.length === 1 && isLoggedIn"
        class="shrink-0 border-t border-border bg-surface px-3 py-3"
      >
        <p
          class="mb-2 text-xs font-medium text-muted-foreground"
        >
          Try asking SolaceAI
        </p>

        <div class="flex flex-wrap gap-2">
          <button
            v-for="question in suggestions"
            :key="question"
            type="button"
            :disabled="loading"
            class="rounded-full border border-primary-subtle bg-primary-soft px-3 py-1.5 text-xs text-primary-hover transition hover:bg-primary-subtle disabled:opacity-50"
            @click="sendMessage(question)"
          >
            {{ question }}
          </button>
        </div>
      </div>

      <!-- ==================================== -->
      <!-- LOGIN PROMPT -->
      <!-- ==================================== -->
      <div
        v-if="!isLoggedIn"
        class="shrink-0 border-t border-primary-subtle bg-primary-soft p-4 text-center"
      >
        <p class="mb-3 text-sm text-foreground">
          Please log in to start chatting with SolaceAI.
        </p>

        <button
          type="button"
          class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-surface transition hover:bg-primary-hover"
          @click="goToLogin"
        >
          Log in
        </button>
      </div>

      <!-- ==================================== -->
      <!-- ERROR MESSAGE -->
      <!-- ==================================== -->
      <div
        v-if="error"
        role="alert"
        class="mx-3 mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
      >
        {{ error }}
      </div>

      <!-- ==================================== -->
      <!-- MESSAGE INPUT -->
      <!-- ==================================== -->
      <form
        v-if="isLoggedIn"
        class="shrink-0 border-t border-border bg-surface p-3"
        @submit.prevent="sendMessage()"
      >
        <div class="flex items-end gap-2">
          <textarea
            v-model="input"
            rows="1"
            maxlength="2000"
            :disabled="loading"
            placeholder="Ask SolaceAI anything..."
            aria-label="Chat message"
            class="max-h-28 min-h-11 flex-1 resize-none rounded-xl border border-border px-3 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-60"
            @keydown="handleKeydown"
          ></textarea>

          <button
            type="submit"
            :disabled="loading || !input.trim()"
            aria-label="Send message"
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-surface transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          </button>
        </div>

        <p
          class="mt-2 text-center text-[10px] text-muted-foreground"
        >
          SolaceAI may make mistakes. All details are for demonstration purposes only.
        </p>
      </form>
    </section>

    <!-- ====================================== -->
    <!-- FLOATING TOGGLE BUTTON -->
    <!-- ====================================== -->
    <div class="flex justify-end">
      <button
        type="button"
        :aria-label="
          isOpen
            ? 'Minimize SolaceAI chat'
            : 'Open SolaceAI chat'
        "
        :aria-expanded="isOpen"
        class="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-surface shadow-lg shadow-primary-border transition hover:scale-105 hover:bg-primary-hover"
        @click="toggleChat"
      >
        <!-- Chat icon -->
        <svg
          v-if="!isOpen"
          width="27"
          height="27"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z"
          />
          <path
            d="M9 11h.01M12 11h.01M15 11h.01"
          />
        </svg>

        <!-- Close icon -->
        <svg
          v-else
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>
