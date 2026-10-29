<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "../../api/axios";

const route = useRoute();
const router = useRouter();

const productId = computed(() => Number(route.params.id));

const product = ref(null);
const documents = ref([]);
const loading = ref(true);
const error = ref("");

const formatPrice = (price) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(price));

const formatDate = (date) =>
  new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));

const formatDocumentType = (type) =>
  type.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const fetchProductDetails = async () => {
  loading.value = true;
  error.value = "";

  try {
    const { data } = await api.get(`/api/products/${productId.value}`);

    product.value = data;
    documents.value = data.documents ?? [];
  } catch (err) {
    const detail = err.response?.data?.detail;
    error.value =
      typeof detail === "string" ? detail : "Unable to load product details.";
  } finally {
    loading.value = false;
  }
};

onMounted(fetchProductDetails);
</script>

<template>
  <div class="mx-auto max-w-6xl">
    <!-- Page heading -->
    <div class="mb-6">
      <button
        type="button"
        class="mb-4 text-sm font-medium text-primary hover:underline"
        @click="router.push('/admin/products')"
      >
        ← Back to Products
      </button>

      <h1 class="text-2xl font-bold text-foreground">Product Details</h1>

      <p class="mt-1 text-sm text-muted-foreground">
        View product information and attached documents.
      </p>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="rounded-2xl border border-border bg-surface p-10 text-center text-muted-foreground"
    >
      Loading product details...
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-600"
    >
      {{ error }}
    </div>

    <template v-else-if="product">
      <!-- Product information -->
      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Product image -->
        <div class="rounded-2xl border border-border bg-surface p-5">
          <div
            class="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-background"
          >
            <img
              v-if="product.image_url"
              :src="product.image_url"
              :alt="product.name"
              class="h-full w-full object-contain"
            />

            <span v-else class="text-sm text-muted-foreground">
              No product image
            </span>
          </div>
        </div>

        <!-- Product details -->
        <div
          class="rounded-2xl border border-border bg-surface p-6 lg:col-span-2"
        >
          <div class="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="mb-1 text-sm text-muted-foreground">SKU: {{ product.sku }}</p>

              <h2 class="text-2xl font-bold text-foreground">
                {{ product.name }}
              </h2>
            </div>

            <span
              class="rounded-full px-3 py-1 text-xs font-semibold"
              :class="
                product.is_active
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              "
            >
              {{ product.is_active ? "Active" : "Inactive" }}
            </span>
          </div>

          <div class="mb-6 grid gap-4 sm:grid-cols-2">
            <div class="rounded-xl bg-background p-4">
              <p class="text-sm text-muted-foreground">Price</p>
              <p class="mt-1 text-xl font-bold text-foreground">
                {{ formatPrice(product.price) }}
              </p>
            </div>

            <div class="rounded-xl bg-background p-4">
              <p class="text-sm text-muted-foreground">Available Stock</p>
              <p
                class="mt-1 text-xl font-bold"
                :class="
                  product.stock_quantity <= 5
                    ? 'text-red-600'
                    : 'text-foreground'
                "
              >
                {{ product.stock_quantity }} units
              </p>
            </div>
          </div>

          <div>
            <h3 class="mb-2 text-base font-semibold text-foreground">
              Description
            </h3>

            <p class="whitespace-pre-line text-sm leading-7 text-muted-foreground">
              {{ product.description || "No description available." }}
            </p>
          </div>
        </div>
      </div>

      <!-- Product documents -->
      <section class="mt-6 rounded-2xl border border-border bg-surface p-6">
        <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold text-foreground">
              Product Documents
            </h2>

            <p class="mt-1 text-sm text-muted-foreground">
              Manuals, warranty information, FAQs, and other references.
            </p>
          </div>

          <span
            class="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-hover"
          >
            {{ documents.length }}
            {{ documents.length === 1 ? "Document" : "Documents" }}
          </span>
        </div>

        <!-- Empty documents -->
        <div
          v-if="documents.length === 0"
          class="rounded-xl border border-dashed border-border p-10 text-center"
        >
          <p class="font-medium text-foreground">No documents attached</p>
          <p class="mt-1 text-sm text-muted-foreground">
            This product doesn't have any documents yet.
          </p>
        </div>

        <!-- Document list -->
        <div v-else class="space-y-3">
          <div
            v-for="document in documents"
            :key="document.id"
            class="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border p-4"
          >
            <div class="flex min-w-0 items-center gap-4">
              <div
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-xl"
              >
                📄
              </div>

              <div class="min-w-0">
                <h3 class="truncate text-sm font-semibold text-foreground">
                  {{ document.title }}
                </h3>

                <div
                  class="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
                >
                  <span class="rounded-md bg-background px-2 py-1">
                    {{ formatDocumentType(document.document_type) }}
                  </span>

                  <span> Added {{ formatDate(document.created_at) }} </span>
                </div>
              </div>
            </div>

            <a
              :href="document.document_url"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex rounded-lg border border-primary-border px-4 py-2 text-sm font-semibold text-primary hover:bg-primary-soft"
            >
              View Document ↗
            </a>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
