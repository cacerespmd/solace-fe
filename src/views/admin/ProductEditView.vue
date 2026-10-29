
<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "../../api/axios";

const route = useRoute();
const router = useRouter();

const productId = computed(() => Number(route.params.id));

const loading = ref(true);
const saving = ref(false);
const error = ref("");
const success = ref("");

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

const documentForm = ref({
  id: null,
  title: "",
  document_url: "",
  document_type: "manual",
});

const showDocumentForm = ref(false);
const savingDocument = ref(false);
const deletingDocumentId = ref(null);
const documentError = ref("");

const isEditingDocument = computed(
  () => documentForm.value.id !== null
);

const formatPrice = (price) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(price || 0));

const formatDate = (date) => {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
};

const formatDocumentType = (type) =>
  (type || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getErrorMessage = (err, fallback) => {
  const detail = err.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item.msg || "Invalid value")
      .join(", ");
  }

  return fallback;
};

const fetchProduct = async () => {
  loading.value = true;
  error.value = "";

  try {
    const { data } = await api.get(
      `/api/products/${productId.value}`
    );

    form.value = {
      name: data.name ?? "",
      sku: data.sku ?? "",
      description: data.description ?? "",
      price: data.price ?? "",
      stock_quantity: data.stock_quantity ?? 0,
      image_url: data.image_url ?? "",
      is_active: data.is_active ?? true,
    };

    documents.value = data.documents ?? [];
  } catch (err) {
    error.value = getErrorMessage(
      err,
      "Unable to load product details."
    );
  } finally {
    loading.value = false;
  }
};

const saveProduct = async () => {
  if (saving.value) return;

  saving.value = true;
  error.value = "";
  success.value = "";

  try {
    const payload = {
      name: form.value.name.trim(),
      sku: form.value.sku.trim(),
      description: form.value.description,
      price: Number(form.value.price),
      stock_quantity: Number(form.value.stock_quantity),
      image_url: form.value.image_url.trim() || null,
      is_active: form.value.is_active,
    };

    await api.patch(
      `/api/products/${productId.value}`,
      payload
    );

    router.push(
      `/admin/products/${productId.value}`
    );
  } catch (err) {
    error.value = getErrorMessage(
      err,
      "Unable to update product."
    );
  } finally {
    saving.value = false;
  }
};

const resetDocumentForm = () => {
  documentForm.value = {
    id: null,
    title: "",
    document_url: "",
    document_type: "manual",
  };

  documentError.value = "";
  showDocumentForm.value = false;
};

const addDocument = () => {
  documentForm.value = {
    id: null,
    title: "",
    document_url: "",
    document_type: "manual",
  };

  documentError.value = "";
  showDocumentForm.value = true;
};

const editDocument = (document) => {
  documentForm.value = {
    id: document.id,
    title: document.title,
    document_url: document.document_url,
    document_type: document.document_type,
  };

  documentError.value = "";
  showDocumentForm.value = true;
};

const refreshDocuments = async () => {
  const { data } = await api.get(
    `/api/products/${productId.value}`
  );

  documents.value = data.documents ?? [];
};

const saveDocument = async () => {
  if (savingDocument.value) return;

  savingDocument.value = true;
  documentError.value = "";
  success.value = "";

  try {
    const payload = {
      title: documentForm.value.title.trim(),
      document_url: documentForm.value.document_url.trim(),
      document_type: documentForm.value.document_type,
    };

    if (isEditingDocument.value) {
      await api.patch(
        `/api/products/${productId.value}/documents/${documentForm.value.id}`,
        payload
      );
    } else {
      await api.post(
        `/api/products/${productId.value}/documents`,
        payload
      );
    }

    await refreshDocuments();

    success.value = isEditingDocument.value
      ? "Document updated successfully."
      : "Document added successfully.";

    resetDocumentForm();
  } catch (err) {
    documentError.value = getErrorMessage(
      err,
      "Unable to save document."
    );
  } finally {
    savingDocument.value = false;
  }
};

const deleteDocument = async (document) => {
  const confirmed = window.confirm(
    `Are you sure you want to remove "${document.title}"?`
  );

  if (!confirmed) return;

  deletingDocumentId.value = document.id;
  documentError.value = "";
  success.value = "";

  try {
    await api.delete(
      `/api/products/${productId.value}/documents/${document.id}`
    );

    await refreshDocuments();

    if (documentForm.value.id === document.id) {
      resetDocumentForm();
    }

    success.value = "Document removed successfully.";
  } catch (err) {
    documentError.value = getErrorMessage(
      err,
      "Unable to remove document."
    );
  } finally {
    deletingDocumentId.value = null;
  }
};

onMounted(fetchProduct);
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

      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-foreground">
            Edit Product
          </h1>

          <p class="mt-1 text-sm text-muted-foreground">
            Update product information and manage attached documents.
          </p>
        </div>

        <RouterLink
          :to="`/admin/products/${productId}`"
          class="rounded-xl border border-border bg-surface px-5 py-3 text-sm font-medium text-foreground hover:bg-background"
        >
          View Product
        </RouterLink>
      </div>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="rounded-2xl border border-border bg-surface p-10 text-center text-muted-foreground"
    >
      Loading product...
    </div>

    <div
      v-else-if="error && !form.name"
      class="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-600"
    >
      {{ error }}
    </div>

    <template v-else>
      <div
        v-if="success"
        role="status"
        class="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700"
      >
        {{ success }}
      </div>

      <!-- Product form -->
      <form @submit.prevent="saveProduct">
        <div class="grid gap-6 lg:grid-cols-3">
          <!-- Product image -->
          <div class="rounded-2xl border border-border bg-surface p-5">
            <div
              class="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-background"
            >
              <img
                v-if="form.image_url"
                :src="form.image_url"
                :alt="form.name"
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

          <!-- Product information -->
          <div
            class="rounded-2xl border border-border bg-surface p-6 lg:col-span-2"
          >
            <div class="mb-6 flex items-center justify-between gap-4">
              <h2 class="text-lg font-semibold text-foreground">
                Product Information
              </h2>

              <label class="flex items-center gap-2 text-sm text-foreground">
                <input
                  v-model="form.is_active"
                  type="checkbox"
                  class="h-4 w-4 accent-indigo-600"
                />
                Active
              </label>
            </div>

            <div class="grid gap-5 sm:grid-cols-2">
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
                  class="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>

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
                  class="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>

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
                  step="0.01"
                  required
                  class="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
                />

                <p class="mt-2 text-xs text-muted-foreground">
                  {{ formatPrice(form.price) }}
                </p>
              </div>

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

            <div
              class="mt-6 flex flex-wrap justify-end gap-3 border-t border-border pt-5"
            >
              <button
                type="button"
                class="rounded-xl border border-border px-5 py-3 text-sm font-medium text-foreground hover:bg-background"
                @click="router.push(`/admin/products/${productId}`)"
              >
                Cancel
              </button>

              <button
                type="submit"
                :disabled="saving"
                class="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {{ saving ? "Saving..." : "Save Changes" }}
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
              Manage manuals, warranty information, FAQs, and references.
            </p>
          </div>

          <button
            type="button"
            class="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-on-primary hover:bg-primary-hover"
            @click="addDocument"
          >
            + Add Document
          </button>
        </div>

        <div
          v-if="documentError && !showDocumentForm"
          role="alert"
          class="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-600"
        >
          {{ documentError }}
        </div>

        <!-- Add/Edit document form -->
        <form
          v-if="showDocumentForm"
          class="mb-6 rounded-xl border border-primary-subtle bg-primary-soft/40 p-5"
          @submit.prevent="saveDocument"
        >
          <div class="mb-5 flex items-center justify-between">
            <h3 class="font-semibold text-foreground">
              {{
                isEditingDocument
                  ? "Edit Document"
                  : "Add Document"
              }}
            </h3>

            <button
              type="button"
              class="text-sm text-muted-foreground hover:text-foreground"
              @click="resetDocumentForm"
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
              @click="resetDocumentForm"
            >
              Cancel
            </button>

            <button
              type="submit"
              :disabled="savingDocument"
              class="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary disabled:opacity-50"
            >
              {{
                savingDocument
                  ? "Saving..."
                  : isEditingDocument
                    ? "Update Document"
                    : "Save Document"
              }}
            </button>
          </div>
        </form>

        <!-- Empty state -->
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

                  <span>
                    Added {{ formatDate(document.created_at) }}
                  </span>
                </div>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-2">
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
                class="rounded-lg border border-primary-border px-4 py-2 text-sm font-medium text-primary hover:bg-primary-soft"
                @click="editDocument(document)"
              >
                Edit
              </button>

              <button
                type="button"
                :disabled="deletingDocumentId === document.id"
                class="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                @click="deleteDocument(document)"
              >
                {{
                  deletingDocumentId === document.id
                    ? "Removing..."
                    : "Remove"
                }}
              </button>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
