<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import api from "../../api/axios.js";
import { useCustomerAuthStore } from "../../stores/customerAuth.js";
import { useCartStore } from "../../stores/cart.js";

const route = useRoute();
const router = useRouter();
const auth = useCustomerAuthStore();

const product = ref(null);
const loading = ref(true);
const error = ref("");
const quantity = ref(1);

const cart = useCartStore();
const addingToCart = ref(false);
const cartError = ref("");
const cartSuccess = ref("");

const formatPrice = (value) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(value));

const stockQuantity = computed(() =>
  Number(product.value?.stock_quantity ?? 0),
);

const inStock = computed(() => stockQuantity.value > 0);

const totalPrice = computed(
  () => Number(product.value?.price ?? 0) * quantity.value,
);

async function fetchProduct() {
  loading.value = true;
  error.value = "";
  product.value = null;
  quantity.value = 1;

  try {
    const { data } = await api.get(`/api/products/${route.params.id}`);

    product.value = data;
  } catch (err) {
    error.value =
      err.response?.status === 404
        ? "Product not found."
        : "Unable to load this product. Please try again.";
  } finally {
    loading.value = false;
  }
}

function decreaseQuantity() {
  if (quantity.value > 1) {
    quantity.value--;
  }
}

function increaseQuantity() {
  if (quantity.value < stockQuantity.value) {
    quantity.value++;
  }
}

async function handleAddToCart() {
  if (!auth.token) {
    router.push({
      name: "customer-login",
      query: { redirect: route.fullPath },
    });
    return;
  }

  if (!product.value || !inStock.value || addingToCart.value) {
    return;
  }

  addingToCart.value = true;
  cartError.value = "";
  cartSuccess.value = "";

  try {
    await cart.addToCart(product.value.id, quantity.value);

    cartSuccess.value = "Product added to your cart!";
  } catch (err) {
    const detail = err.response?.data?.detail;

    cartError.value =
      typeof detail === "string" ? detail : "Unable to add product to cart.";
  } finally {
    addingToCart.value = false;
  }
}

onMounted(fetchProduct);

watch(
  () => route.params.id,
  () => fetchProduct(),
);
</script>

<template>
  <div>
    <nav class="mb-8 text-sm text-muted-foreground">
      <RouterLink to="/" class="hover:text-primary"> Products </RouterLink>
      <span class="mx-2">/</span>
      <span class="text-foreground">
        {{ product?.name || "Product Details" }}
      </span>
    </nav>

    <div v-if="loading" class="py-24 text-center text-muted-foreground">
      Loading product details...
    </div>

    <div
      v-else-if="error"
      class="rounded-2xl border border-red-200 bg-red-50 p-8 text-center"
    >
      <p class="text-red-600">{{ error }}</p>

      <RouterLink
        to="/"
        class="mt-5 inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-surface"
      >
        Back to Products
      </RouterLink>
    </div>

    <div v-else-if="product">
      <div class="grid gap-10 lg:grid-cols-2">
        <!-- Product Image -->
        <div
          class="flex aspect-square items-center justify-center overflow-hidden rounded-3xl border border-border bg-surface"
        >
          <img
            v-if="product.image_url"
            :src="product.image_url"
            :alt="product.name"
            class="h-full w-full object-contain p-10"
          />

          <span v-else class="text-muted-foreground"> No image available </span>
        </div>

        <!-- Product Information -->
        <div class="flex flex-col">
          <p
            class="text-sm font-medium uppercase tracking-wider text-muted-foreground"
          >
            SKU: {{ product.sku }}
          </p>

          <h1 class="mt-3 text-3xl font-bold text-foreground sm:text-4xl">
            {{ product.name }}
          </h1>

          <p class="mt-6 text-3xl font-bold text-primary">
            {{ formatPrice(product.price) }}
          </p>

          <div class="mt-5">
            <span
              class="inline-flex rounded-full px-4 py-2 text-sm font-semibold"
              :class="
                inStock
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-red-50 text-red-600'
              "
            >
              {{ inStock ? `${stockQuantity} available` : "Out of Stock" }}
            </span>
          </div>

          <div class="mt-8 border-t border-border pt-7">
            <h2 class="text-lg font-semibold text-foreground">Description</h2>

            <p class="mt-3 whitespace-pre-line leading-7 text-muted-foreground">
              {{ product.description || "No description available." }}
            </p>
          </div>

          <!-- Quantity -->
          <div v-if="inStock" class="mt-8">
            <label class="mb-3 block text-sm font-semibold text-foreground">
              Quantity
            </label>

            <div
              class="inline-flex items-center overflow-hidden rounded-xl border border-border bg-surface"
            >
              <button
                type="button"
                :disabled="quantity <= 1"
                class="px-5 py-3 text-lg hover:bg-background disabled:opacity-40"
                @click="decreaseQuantity"
              >
                −
              </button>

              <span class="min-w-12 text-center font-semibold">
                {{ quantity }}
              </span>

              <button
                type="button"
                :disabled="quantity >= stockQuantity"
                class="px-5 py-3 text-lg hover:bg-background disabled:opacity-40"
                @click="increaseQuantity"
              >
                +
              </button>
            </div>

            <p class="mt-3 text-sm text-muted-foreground">
              Total:
              <span class="font-semibold text-foreground">
                {{ formatPrice(totalPrice) }}
              </span>
            </p>
          </div>

          <div class="mt-8 space-y-3">
            <p
              v-if="cartSuccess"
              role="status"
              class="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700"
            >
              {{ cartSuccess }}
              <RouterLink to="/cart" class="ml-2 font-semibold underline">
                View Cart
              </RouterLink>
            </p>

            <p
              v-if="cartError"
              role="alert"
              class="rounded-lg bg-red-50 p-3 text-sm text-red-600"
            >
              {{ cartError }}
            </p>

            <button
              type="button"
              :disabled="!inStock || addingToCart"
              class="w-full rounded-xl bg-primary px-6 py-4 text-sm font-semibold text-surface transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-border"
              @click="handleAddToCart"
            >
              {{
                !inStock
                  ? "Out of Stock"
                  : addingToCart
                    ? "Adding..."
                    : "Add to Cart"
              }}
            </button>
          </div>

          <!-- <p class="mt-3 text-center text-xs text-muted-foreground">
            Shopping cart functionality will be available in the next step.
          </p> -->
        </div>
      </div>

      <!-- Product Documents -->
      <section
        v-if="product.documents?.length"
        class="mt-12 rounded-2xl border border-border bg-surface p-7"
      >
        <h2 class="text-xl font-semibold text-foreground">Product Documents</h2>

        <p class="mt-2 text-sm text-muted-foreground">
          Manuals, warranties, and other product information.
        </p>

        <div class="mt-6 divide-y divide-border">
          <div
            v-for="document in product.documents"
            :key="document.id"
            class="flex flex-wrap items-center justify-between gap-4 py-4"
          >
            <div>
              <h3 class="font-medium text-foreground">
                {{ document.title }}
              </h3>

              <p class="mt-1 text-xs capitalize text-muted-foreground">
                {{ document.document_type }}
              </p>
            </div>

            <a
              :href="document.document_url"
              target="_blank"
              rel="noopener noreferrer"
              class="rounded-lg border border-primary-border px-4 py-2 text-sm font-semibold text-primary hover:bg-primary-soft"
            >
              View Document
            </a>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
