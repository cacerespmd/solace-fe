<script setup>
import { onMounted, ref } from "vue";
import api from "../../api/axios";

const products = ref([]);
const loading = ref(false);
const error = ref("");

const fetchProducts = async () => {
  loading.value = true;
  error.value = "";

  try {
    const { data } = await api.get("/api/products");
    products.value = data;
  } catch (err) {
    error.value = err.response?.data?.detail || "Failed to load products.";
  } finally {
    loading.value = false;
  }
};

const formatPrice = (price) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(price));
};

onMounted(fetchProducts);
</script>

<template>
  <div>
    <div class="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">Your catalog</p>
        <h1 class="text-2xl font-semibold tracking-tight text-foreground">Products</h1>
        <p class="mt-1 text-sm text-muted-foreground">
          Manage your Voltech store inventory.
        </p>
      </div>

      <RouterLink
        to="/admin/products/create"
        class="inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-on-primary hover:bg-primary-hover"
      >
        + Add Product
      </RouterLink>
    </div>

    <div class="overflow-hidden rounded-2xl border border-border bg-surface">
      <div v-if="loading" class="p-8 text-center text-muted-foreground">
        Loading products...
      </div>

      <div v-else-if="error" class="p-8 text-center text-red-600">
        {{ error }}
      </div>

      <div
        v-else-if="products.length === 0"
        class="p-10 text-center text-muted-foreground"
      >
        No active products found.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-background text-muted-foreground">
            <tr>
              <th class="px-6 py-4 font-medium">Product</th>
              <th class="px-6 py-4 font-medium">SKU</th>
              <th class="px-6 py-4 font-medium">Price</th>
              <th class="px-6 py-4 font-medium">Stock</th>
              <th class="px-6 py-4 font-medium">Status</th>
              <th class="px-6 py-4 font-medium">Actions</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-border">
            <tr v-for="product in products" :key="product.id">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <img
                    v-if="product.image_url"
                    :src="product.image_url"
                    :alt="product.name"
                    class="h-12 w-12 rounded-lg bg-background object-cover"
                  />

                  <div
                    v-else
                    class="flex h-12 w-12 items-center justify-center rounded-lg bg-background text-muted-foreground"
                  >
                    —
                  </div>

                  <span class="font-medium text-foreground">
                    {{ product.name }}
                  </span>
                </div>
              </td>

              <td class="px-6 py-4 text-muted-foreground">
                {{ product.sku }}
              </td>

              <td class="px-6 py-4 text-foreground">
                {{ formatPrice(product.price) }}
              </td>

              <td class="px-6 py-4">
                <span
                  :class="
                    product.stock_quantity <= 5
                      ? 'font-semibold text-red-600'
                      : 'text-foreground'
                  "
                >
                  {{ product.stock_quantity }}
                </span>
              </td>

              <td class="px-6 py-4">
                <span
                  class="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700"
                >
                  Active
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <RouterLink
                    :to="`/admin/products/${product.id}`"
                    class="inline-flex rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-background"
                  >
                    View
                  </RouterLink>

                  <RouterLink
                    :to="`/admin/products/${product.id}/edit`"
                    class="inline-flex rounded-lg border border-primary-border px-4 py-2 text-sm font-medium text-primary hover:bg-primary-soft"
                  >
                    Edit
                  </RouterLink>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
