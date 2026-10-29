
<script setup>
import { computed, onMounted, ref } from "vue";
import { ArrowRight, MessageCircle, Package, Search, Sparkles, X } from "@lucide/vue";
import { RouterLink } from "vue-router";
import api from "../../api/axios.js";

const products = ref([]);
const loading = ref(true);
const error = ref("");
const searchQuery = ref("");
const filteredProducts = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return products.value;

  return products.value.filter((product) =>
    [product.name, product.description].some((value) =>
      String(value ?? "").toLowerCase().includes(query),
    ),
  );
});

const formatPrice = (price) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(price));
};

async function fetchProducts() {
  loading.value = true;
  error.value = "";

  try {
    const { data } = await api.get("/api/products");
    products.value = Array.isArray(data) ? data : data.items || [];
  } catch (err) {
    error.value = "Unable to load products. Please try again.";
  } finally {
    loading.value = false;
  }
}

onMounted(fetchProducts);
</script>

<template>
  <div>
    <section class="storefront-hero relative mb-12 overflow-hidden rounded-3xl px-6 py-10 text-on-primary sm:px-12 sm:py-14">
      <div class="relative z-10 max-w-2xl">
      <span class="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80">
        <Sparkles :size="14" class="text-accent" aria-hidden="true" />
        Welcome to Voltech
      </span>

      <h1 class="max-w-2xl !text-4xl !font-semibold leading-tight sm:!text-5xl">
        Power your digital life.
      </h1>

      <p class="mt-5 max-w-md text-sm leading-7 text-white/65 sm:text-base">
        Find your next upgrade, with a little help from SolaceAI. Explore our collection and shop with confidence.
      </p>

      <a
        href="#products"
        class="mt-8 inline-flex items-center gap-3 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
      >
        Explore Products
        <ArrowRight :size="17" aria-hidden="true" />
      </a>
      <div class="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/10 pt-6 text-xs text-white/65">
        <span class="inline-flex items-center gap-2"><Package :size="16" class="text-accent" aria-hidden="true" /> Browse. Order. Track.</span>
        <span class="inline-flex items-center gap-2"><MessageCircle :size="16" class="text-accent" aria-hidden="true" /> Support from SolaceAI</span>
      </div>
      </div>
      <div aria-hidden="true" class="pointer-events-none absolute -right-20 top-8 hidden h-80 w-80 rounded-full border border-white/10 lg:block"></div>
      <div aria-hidden="true" class="pointer-events-none absolute -right-4 top-24 hidden h-48 w-48 rounded-full border border-white/10 bg-white/5 lg:block"></div>
    </section>

    <section id="products">
      <div class="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-foreground">
            Find your next favorite
          </h2>

          <p class="mt-1 text-sm text-muted-foreground">
            Explore the latest in our collection.
          </p>
        </div>

        <span class="text-sm text-muted-foreground" role="status">
          {{ filteredProducts.length }} {{ filteredProducts.length === 1 ? 'product' : 'products' }}
        </span>
      </div>

      <div class="relative mb-7">
        <label for="product-search" class="sr-only">Search products</label>
        <Search :size="20" class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          id="product-search"
          v-model="searchQuery"
          type="search"
          placeholder="Search products by name or description..."
          class="w-full rounded-xl border border-border bg-surface py-3 pl-12 pr-12 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary-subtle [&::-webkit-search-cancel-button]:appearance-none"
        />
        <button
          v-if="searchQuery"
          type="button"
          aria-label="Clear product search"
          class="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
          @click="searchQuery = ''"
        >
          <X :size="18" aria-hidden="true" />
        </button>
      </div>

      <div v-if="loading" class="py-20 text-center text-muted-foreground">
        Loading products...
      </div>

      <div
        v-else-if="error"
        class="rounded-xl border border-red-200 bg-red-50 p-6 text-red-600"
      >
        {{ error }}

        <button
          type="button"
          class="ml-3 font-semibold underline"
          @click="fetchProducts"
        >
          Retry
        </button>
      </div>

      <div
        v-else-if="products.length === 0"
        class="rounded-2xl border border-border bg-surface py-20 text-center text-muted-foreground"
      >
        No products available yet.
      </div>

      <div
        v-else-if="filteredProducts.length === 0"
        class="rounded-2xl border border-border bg-surface px-6 py-20 text-center text-muted-foreground"
      >
        <p>No products match your search.</p>
        <button type="button" class="mt-3 font-semibold text-primary hover:underline" @click="searchQuery = ''">
          Clear search
        </button>
      </div>

      <div
        v-else
        class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <RouterLink
          v-for="product in filteredProducts"
          :key="product.id"
          :to="`/products/${product.id}`"
          class="group overflow-hidden rounded-2xl border border-border bg-surface transition hover:-translate-y-1 hover:border-primary-border hover:shadow-lg"
        >
          <div class="flex aspect-square items-center justify-center bg-background">
            <img
              v-if="product.image_url"
              :src="product.image_url"
              :alt="product.name"
              class="h-full w-full object-contain p-5 transition group-hover:scale-105"
            />

            <span v-else class="text-sm text-muted-foreground">
              No image available
            </span>
          </div>

          <div class="p-5">
            <h3 class="line-clamp-2 font-semibold text-foreground">
              {{ product.name }}
            </h3>

            <p class="mt-2 text-xl font-bold text-primary">
              {{ formatPrice(product.price) }}
            </p>

            <p
              class="mt-3 text-xs font-medium"
              :class="
                product.stock_quantity > 0
                  ? 'text-emerald-600'
                  : 'text-red-500'
              "
            >
              {{ product.stock_quantity > 0 ? "In Stock" : "Out of Stock" }}
            </p>

            <div
              class="mt-5 rounded-lg bg-primary-soft px-4 py-3 text-center text-sm font-semibold text-primary group-hover:bg-primary group-hover:text-on-primary"
            >
              View Product
            </div>
          </div>
        </RouterLink>
      </div>
    </section>
  </div>
</template>
