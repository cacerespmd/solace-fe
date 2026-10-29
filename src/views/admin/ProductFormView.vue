
<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import api from "../../api/axios";

const router = useRouter();

const form = ref({
  name: "",
  sku: "",
  description: "",
  price: "",
  stock_quantity: 0,
  image_url: "",
  is_active: true,
});

const documents = ref([]);
const loading = ref(false);
const error = ref("");
const documentError = ref("");
const createdProductId = ref(null);

const documentForm = ref({
  title: "",
  document_url: "",
  document_type: "manual",
});

const showDocumentForm = ref(false);
let nextDocumentId = 1;

const formatPrice = (price) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(price || 0));

const formatDocumentType = (type) =>
  (type || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getErrorMessage = (err, fallback) => {
  const detail = err.response?.data?.detail;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg || "Invalid value").join(", ");
  }

  return fallback;
};

const addDocument = () => {
  documentForm.value = {
    title: "",
    document_url: "",
    document_type: "manual",
  };

  documentError.value = "";
  showDocumentForm.value = true;
};

const cancelDocument = () => {
  showDocumentForm.value = false;
  documentError.value = "";
};

const saveDocument = () => {
  documentError.value = "";

  const title = documentForm.value.title.trim();
  const url = documentForm.value.document_url.trim();

  if (!title || !url) {
    documentError.value = "Document title and URL are required.";
    return;
  }

  try {
    const parsedUrl = new URL(url);

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Invalid protocol");
    }
  } catch {
    documentError.value = "Please enter a valid document URL.";
    return;
  }

  documents.value.push({
    id: nextDocumentId++,
    title,
    document_url: url,
    document_type: documentForm.value.document_type,
  });

  cancelDocument();
};

const removeDocument = (id) => {
  documents.value = documents.value.filter(
    (document) => document.id !== id
  );
};

const submitProduct = async () => {
  if (loading.value) return;

  // If product creation previously succeeded but document saving failed,
  // don't create another product.
  if (createdProductId.value) {
    router.push(`/admin/products/${createdProductId.value}/edit`);
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    const { data: product } = await api.post("/api/products", {
      name: form.value.name.trim(),
      sku: form.value.sku.trim(),
      description: form.value.description,
      price: Number(form.value.price),
      stock_quantity: Number(form.value.stock_quantity),
      image_url: form.value.image_url.trim() || null,
    });

    createdProductId.value = product.id;

    for (const document of documents.value) {
      await api.post(
        `/api/products/${product.id}/documents`,
        {
          title: document.title,
          document_url: document.document_url,
          document_type: document.document_type,
        }
      );
    }

    router.push(`/admin/products/${product.id}`);
  } catch (err) {
    const message = getErrorMessage(
      err,
      "Unable to create product. Please check your inputs."
    );

    if (createdProductId.value) {
      error.value =
        `Product #${createdProductId.value} was created, but some documents could not be saved. ` +
        `${message} Click "Manage Created Product" to finish adding documents.`;
    } else {
      error.value = message;
    }
  } finally {
    loading.value = false;
  }
};
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

      <h1 class="text-2xl font-bold text-foreground">
        Add Product
      </h1>

      <p class="mt-1 text-sm text-muted-foreground">
        Create a new product and attach product documents.
      </p>
    </div>

    <!-- Product information -->
    <form @submit.prevent="submitProduct">
      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Product image -->
        <div class="rounded-2xl border border-border bg-surface p-5">
          <div
            class="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-background"
          >
            <img
              v-if="form.image_url"
              :src="form.image_url"
              :alt="form.name || 'Product preview'"
              class="h-full w-full object-contain"
            />

            <span v-else class="text-sm text-muted-foreground">
              No product image
            </span>
          </div>

          <div class="mt-5">
            <label
              for="image_url"
              class="mb-2 block text-sm font-medium text-foreground"
            >
              Image URL
            </label>

            <input
              id="image_url"
              v-model.trim="form.image_url"
              type="url"
              placeholder="https://example.com/image.jpg"
              class="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        <!-- Product details -->
        <div
          class="rounded-2xl border border-border bg-surface p-6 lg:col-span-2"
        >
          <div class="mb-6 flex items-center justify-between gap-4">
            <h2 class="text-lg font-semibold text-foreground">
              Product Information
            </h2>

            <span
              class="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700"
            >
              Active
            </span>
          </div>

          <div class="grid gap-5 sm:grid-cols-2">
            <!-- Product name -->
            <div>
              <label
                for="name"
                class="mb-2 block text-sm font-medium text-foreground"
              >
                Product Name *
              </label>

              <input
                id="name"
                v-model.trim="form.name"
                required
                maxlength="150"
                placeholder="Wireless Headphones"
                class="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>

            <!-- SKU -->
            <div>
              <label
                for="sku"
                class="mb-2 block text-sm font-medium text-foreground"
              >
                SKU *
              </label>

              <input
                id="sku"
                v-model.trim="form.sku"
                required
                maxlength="50"
                placeholder="SOL-HP-002"
                class="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>

            <!-- Price -->
            <div>
              <label
                for="price"
                class="mb-2 block text-sm font-medium text-foreground"
              >
                Price (PHP) *
              </label>

              <input
                id="price"
                v-model="form.price"
                type="number"
                min="0"
                max="99999999.99"
                step="0.01"
                required
                placeholder="2499.00"
                class="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
              />

              <p class="mt-2 text-xs text-muted-foreground">
                {{ formatPrice(form.price) }}
              </p>
            </div>

            <!-- Stock -->
            <div>
              <label
                for="stock_quantity"
                class="mb-2 block text-sm font-medium text-foreground"
              >
                Stock Quantity *
              </label>

              <input
                id="stock_quantity"
                v-model.number="form.stock_quantity"
                type="number"
                min="0"
                step="1"
                required
                class="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          <!-- Description -->
          <div class="mt-5">
            <label
              for="description"
              class="mb-2 block text-sm font-medium text-foreground"
            >
              Description
            </label>

            <textarea
              id="description"
              v-model="form.description"
              rows="6"
              placeholder="Enter product description..."
              class="w-full resize-y rounded-xl border border-border px-4 py-3 text-sm leading-7 outline-none focus:border-primary"
            />
          </div>

          <div
            v-if="error"
            role="alert"
            class="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-600"
          >
            {{ error }}
          </div>

          <!-- Actions -->
          <div
            class="mt-6 flex flex-wrap justify-end gap-3 border-t border-border pt-5"
          >
            <button
              type="button"
              class="rounded-xl border border-border px-5 py-3 text-sm font-medium text-foreground hover:bg-background"
              @click="router.push('/admin/products')"
            >
              Cancel
            </button>

            <button
              type="submit"
              :disabled="loading"
              class="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-on-primary hover:bg-primary-hover disabled:opacity-50"
            >
              {{
                loading
                  ? "Creating..."
                  : createdProductId
                    ? "Manage Created Product"
                    : "Create Product"
              }}
            </button>
          </div>
        </div>
      </div>
    </form>

    <!-- Product documents -->
    <section
      class="mt-6 rounded-2xl border border-border bg-surface p-6"
    >
      <div
        class="mb-6 flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h2 class="text-lg font-semibold text-foreground">
            Product Documents
          </h2>

          <p class="mt-1 text-sm text-muted-foreground">
            Add manuals, warranty information, FAQs, and other references.
          </p>
        </div>

        <button
          type="button"
          :disabled="loading || !!createdProductId"
          class="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-on-primary hover:bg-primary-hover disabled:opacity-50"
          @click="addDocument"
        >
          + Add Document
        </button>
      </div>

      <!-- Add document form -->
      <form
        v-if="showDocumentForm"
        class="mb-6 rounded-xl border border-primary-subtle bg-primary-soft/40 p-5"
        @submit.prevent="saveDocument"
      >
        <div class="mb-5 flex items-center justify-between">
          <h3 class="font-semibold text-foreground">
            Add Document
          </h3>

          <button
            type="button"
            class="text-sm text-muted-foreground hover:text-foreground"
            @click="cancelDocument"
          >
            ✕
          </button>
        </div>

        <div class="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              for="document_title"
              class="mb-2 block text-sm font-medium text-foreground"
            >
              Document Title *
            </label>

            <input
              id="document_title"
              v-model.trim="documentForm.title"
              required
              placeholder="User Manual"
              class="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </div>

          <div>
            <label
              for="document_type"
              class="mb-2 block text-sm font-medium text-foreground"
            >
              Document Type *
            </label>

            <select
              id="document_type"
              v-model="documentForm.document_type"
              required
              class="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
            >
              <option value="manual">Manual</option>
              <option value="warranty">Warranty</option>
              <option value="faq">FAQ</option>
              <option value="guide">Guide</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div class="sm:col-span-2">
            <label
              for="document_url"
              class="mb-2 block text-sm font-medium text-foreground"
            >
              Document URL *
            </label>

            <input
              id="document_url"
              v-model.trim="documentForm.document_url"
              type="url"
              required
              placeholder="https://example.com/manual.pdf"
              class="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        <p
          v-if="documentError"
          role="alert"
          class="mt-4 text-sm text-red-600"
        >
          {{ documentError }}
        </p>

        <div class="mt-5 flex justify-end gap-3">
          <button
            type="button"
            class="rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-medium text-foreground"
            @click="cancelDocument"
          >
            Cancel
          </button>

          <button
            type="submit"
            class="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary"
          >
            Add Document
          </button>
        </div>
      </form>

      <!-- Empty documents -->
      <div
        v-if="documents.length === 0"
        class="rounded-xl border border-dashed border-border p-10 text-center"
      >
        <p class="font-medium text-foreground">
          No documents attached
        </p>

        <p class="mt-1 text-sm text-muted-foreground">
          Click Add Document to attach your first document.
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

                <span>Pending creation</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <a
              :href="document.document_url"
              target="_blank"
              rel="noopener noreferrer"
              class="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-background"
            >
              View
            </a>

            <button
              type="button"
              :disabled="loading || !!createdProductId"
              class="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              @click="removeDocument(document.id)"
            >
              Remove
            </button>
          </div>
        </div>
      </div>

      <p class="mt-5 text-xs text-muted-foreground">
        Documents will be saved to the product when you click Create Product.
      </p>
    </section>
  </div>
</template>
