
<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { useCartStore } from "../../stores/cart.js";

const cart = useCartStore();
const router = useRouter();

const updatingId = ref(null);
const checkingOut = ref(false);
const actionError = ref("");
const fieldErrors = ref({});

const deliveryForm = reactive({
  recipient_name: "",
  contact_number: "",
  address_line_1: "",
  address_line_2: "",
  barangay: "",
  city: "",
  province: "",
  postal_code: "",
  country: "Philippines",
  delivery_notes: "",
});

const requiredFields = [
  "recipient_name",
  "contact_number",
  "address_line_1",
  "barangay",
  "city",
  "province",
  "postal_code",
  "country",
];

const formatPrice = (value) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(value));

const isUpdating = computed(() => updatingId.value !== null);

onMounted(async () => {
  try {
    await cart.fetchCart();
  } catch {
    // The cart store already handles its error state.
  }
});

async function changeQuantity(item, quantity) {
  if (
    isUpdating.value ||
    quantity < 1 ||
    quantity > item.product.stock_quantity
  ) {
    return;
  }

  updatingId.value = item.id;
  actionError.value = "";

  try {
    await cart.updateQuantity(item.id, quantity);
  } catch (err) {
    actionError.value =
      err.response?.data?.detail ||
      "Unable to update quantity.";
  } finally {
    updatingId.value = null;
  }
}

async function removeItem(item) {
  if (isUpdating.value) return;

  updatingId.value = item.id;
  actionError.value = "";

  try {
    await cart.removeItem(item.id);
  } catch (err) {
    actionError.value =
      err.response?.data?.detail ||
      "Unable to remove item.";
  } finally {
    updatingId.value = null;
  }
}

function validateDeliveryForm() {
  const errors = {};

  for (const field of requiredFields) {
    if (!String(deliveryForm[field] ?? "").trim()) {
      errors[field] = "This field is required.";
    }
  }

  const contact = deliveryForm.contact_number.trim();

  if (contact) {
    const allowedCharacters = /^[0-9+()\-\s]+$/;
    const digits = contact.replace(/\D/g, "");

    if (
      !allowedCharacters.test(contact) ||
      digits.length < 7 ||
      digits.length > 15
    ) {
      errors.contact_number =
        "Enter a valid contact number (7–15 digits).";
    }
  }

  fieldErrors.value = errors;

  return Object.keys(errors).length === 0;
}

function inputClass(field) {
  return [
    "w-full rounded-xl border bg-surface px-4 py-3 text-sm",
    "text-foreground outline-none transition",
    "focus:ring-2 focus:ring-primary-subtle",
    fieldErrors.value[field]
      ? "border-red-400 focus:border-red-500"
      : "border-border focus:border-primary",
  ].join(" ");
}

function clearFieldError(field) {
  if (!fieldErrors.value[field]) return;

  const updated = { ...fieldErrors.value };
  delete updated[field];
  fieldErrors.value = updated;
}

async function handleCheckout() {
  if (checkingOut.value || cart.items.length === 0) {
    return;
  }

  actionError.value = "";

  if (!validateDeliveryForm()) {
    actionError.value =
      "Please complete the required delivery information.";

    return;
  }

  checkingOut.value = true;

  try {
    const payload = Object.fromEntries(
      Object.entries(deliveryForm).map(([key, value]) => [
        key,
        typeof value === "string" ? value.trim() : value,
      ])
    );

    const order = await cart.checkout(payload);

    await router.push({
      name: "customer-order-details",
      params: { id: order.id },
      query: { placed: "1" },
    });
  } catch (err) {
    const detail = err.response?.data?.detail;

    if (Array.isArray(detail)) {
      const errors = {};

      for (const issue of detail) {
        const field = issue.loc?.[issue.loc.length - 1];

        if (typeof field === "string") {
          errors[field] = issue.msg;
        }
      }

      fieldErrors.value = errors;

      actionError.value =
        "Please review your delivery information.";
    } else {
      actionError.value =
        typeof detail === "string"
          ? detail
          : "Unable to complete checkout. Please try again.";
    }
  } finally {
    checkingOut.value = false;
  }
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground">
        Shopping Cart
      </h1>

      <p class="mt-2 text-sm text-muted-foreground">
        Review your items and provide delivery information
        before checkout.
      </p>
    </div>

    <!-- Error -->
    <p
      v-if="actionError"
      role="alert"
      class="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-600"
    >
      {{ actionError }}
    </p>

    <!-- Loading -->
    <div
      v-if="cart.loading"
      class="py-20 text-center text-muted-foreground"
    >
      Loading your cart...
    </div>

    <!-- Cart Error -->
    <div
      v-else-if="cart.error"
      class="rounded-xl bg-red-50 p-6 text-red-600"
    >
      {{ cart.error }}

      <button
        type="button"
        class="ml-3 font-semibold underline"
        @click="cart.fetchCart()"
      >
        Retry
      </button>
    </div>

    <!-- Empty Cart -->
    <div
      v-else-if="cart.items.length === 0"
      class="rounded-2xl border border-border bg-surface px-6 py-20 text-center"
    >
      <h2 class="text-xl font-semibold text-foreground">
        Your cart is empty
      </h2>

      <p class="mt-2 text-muted-foreground">
        Explore our products and find something you love.
      </p>

      <RouterLink
        to="/"
        class="mt-6 inline-flex rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-surface"
      >
        Browse Products
      </RouterLink>
    </div>

    <!-- Cart Content -->
    <div v-else class="grid gap-8 lg:grid-cols-3">
      <div class="space-y-6 lg:col-span-2">

        <!-- Cart Items -->
        <div
          v-for="item in cart.items"
          :key="item.id"
          class="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-5 sm:flex-row"
        >
          <div
            class="flex h-32 w-32 shrink-0 items-center justify-center rounded-xl bg-background"
          >
            <img
              v-if="item.product.image_url"
              :src="item.product.image_url"
              :alt="item.product.name"
              class="h-full w-full object-contain p-3"
            />

            <span v-else class="text-xs text-muted-foreground">
              No image
            </span>
          </div>

          <div class="flex flex-1 flex-col justify-between">
            <div>
              <RouterLink
                :to="`/products/${item.product_id}`"
                class="font-semibold text-foreground hover:text-primary"
              >
                {{ item.product.name }}
              </RouterLink>

              <p class="mt-1 text-sm text-muted-foreground">
                {{ formatPrice(item.product.price) }} each
              </p>

              <p class="mt-1 text-xs text-muted-foreground">
                {{ item.product.stock_quantity }} in stock
              </p>
            </div>

            <div
              class="mt-5 flex flex-wrap items-center justify-between gap-4"
            >
              <div
                class="inline-flex items-center rounded-lg border border-border"
              >
                <button
                  type="button"
                  :disabled="
                    isUpdating || item.quantity <= 1
                  "
                  class="px-4 py-2 disabled:opacity-40"
                  @click="
                    changeQuantity(item, item.quantity - 1)
                  "
                >
                  −
                </button>

                <span
                  class="min-w-10 text-center text-sm font-semibold"
                >
                  {{ item.quantity }}
                </span>

                <button
                  type="button"
                  :disabled="
                    isUpdating ||
                    item.quantity >= item.product.stock_quantity
                  "
                  class="px-4 py-2 disabled:opacity-40"
                  @click="
                    changeQuantity(item, item.quantity + 1)
                  "
                >
                  +
                </button>
              </div>

              <button
                type="button"
                :disabled="isUpdating"
                class="text-sm font-medium text-red-500 hover:underline disabled:opacity-40"
                @click="removeItem(item)"
              >
                Remove
              </button>
            </div>
          </div>

          <div class="text-right font-bold text-foreground">
            {{ formatPrice(item.subtotal) }}
          </div>
        </div>

        <!-- Delivery Form -->
        <section
          class="rounded-2xl border border-border bg-surface p-6"
        >
          <div class="mb-6">
            <h2 class="text-xl font-semibold text-foreground">
              Delivery Information
            </h2>

            <p class="mt-1 text-sm text-muted-foreground">
              Enter the recipient's contact information
              and shipping address.
            </p>
          </div>

          <form
            id="delivery-form"
            class="space-y-6"
            @submit.prevent="handleCheckout"
          >
            <!-- Recipient -->
            <div>
              <h3 class="mb-4 text-sm font-semibold text-foreground">
                Recipient Details
              </h3>

              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    for="recipient_name"
                    class="mb-2 block text-sm font-medium text-foreground"
                  >
                    Full Name *
                  </label>

                  <input
                    id="recipient_name"
                    v-model="deliveryForm.recipient_name"
                    type="text"
                    autocomplete="name"
                    :class="inputClass('recipient_name')"
                    @input="clearFieldError('recipient_name')"
                  />

                  <p
                    v-if="fieldErrors.recipient_name"
                    class="mt-1 text-xs text-red-600"
                  >
                    {{ fieldErrors.recipient_name }}
                  </p>
                </div>

                <div>
                  <label
                    for="contact_number"
                    class="mb-2 block text-sm font-medium text-foreground"
                  >
                    Contact Number *
                  </label>

                  <input
                    id="contact_number"
                    v-model="deliveryForm.contact_number"
                    type="tel"
                    autocomplete="tel"
                    placeholder="09171234567"
                    :class="inputClass('contact_number')"
                    @input="clearFieldError('contact_number')"
                  />

                  <p
                    v-if="fieldErrors.contact_number"
                    class="mt-1 text-xs text-red-600"
                  >
                    {{ fieldErrors.contact_number }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Address -->
            <div>
              <h3 class="mb-4 text-sm font-semibold text-foreground">
                Shipping Address
              </h3>

              <div class="space-y-4">
                <div>
                  <label
                    for="address_line_1"
                    class="mb-2 block text-sm font-medium text-foreground"
                  >
                    House / Building Number and Street *
                  </label>

                  <input
                    id="address_line_1"
                    v-model="deliveryForm.address_line_1"
                    type="text"
                    autocomplete="address-line1"
                    placeholder="House number, street, subdivision"
                    :class="inputClass('address_line_1')"
                    @input="clearFieldError('address_line_1')"
                  />

                  <p
                    v-if="fieldErrors.address_line_1"
                    class="mt-1 text-xs text-red-600"
                  >
                    {{ fieldErrors.address_line_1 }}
                  </p>
                </div>

                <div>
                  <label
                    for="address_line_2"
                    class="mb-2 block text-sm font-medium text-foreground"
                  >
                    Apartment, Unit, Floor
                    <span class="text-muted-foreground">(Optional)</span>
                  </label>

                  <input
                    id="address_line_2"
                    v-model="deliveryForm.address_line_2"
                    type="text"
                    autocomplete="address-line2"
                    placeholder="Unit, floor, building"
                    :class="inputClass('address_line_2')"
                  />
                </div>

                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      for="barangay"
                      class="mb-2 block text-sm font-medium text-foreground"
                    >
                      Barangay *
                    </label>

                    <input
                      id="barangay"
                      v-model="deliveryForm.barangay"
                      type="text"
                      :class="inputClass('barangay')"
                      @input="clearFieldError('barangay')"
                    />

                    <p
                      v-if="fieldErrors.barangay"
                      class="mt-1 text-xs text-red-600"
                    >
                      {{ fieldErrors.barangay }}
                    </p>
                  </div>

                  <div>
                    <label
                      for="city"
                      class="mb-2 block text-sm font-medium text-foreground"
                    >
                      City / Municipality *
                    </label>

                    <input
                      id="city"
                      v-model="deliveryForm.city"
                      type="text"
                      autocomplete="address-level2"
                      :class="inputClass('city')"
                      @input="clearFieldError('city')"
                    />

                    <p
                      v-if="fieldErrors.city"
                      class="mt-1 text-xs text-red-600"
                    >
                      {{ fieldErrors.city }}
                    </p>
                  </div>

                  <div>
                    <label
                      for="province"
                      class="mb-2 block text-sm font-medium text-foreground"
                    >
                      Province / Region *
                    </label>

                    <input
                      id="province"
                      v-model="deliveryForm.province"
                      type="text"
                      autocomplete="address-level1"
                      :class="inputClass('province')"
                      @input="clearFieldError('province')"
                    />

                    <p
                      v-if="fieldErrors.province"
                      class="mt-1 text-xs text-red-600"
                    >
                      {{ fieldErrors.province }}
                    </p>
                  </div>

                  <div>
                    <label
                      for="postal_code"
                      class="mb-2 block text-sm font-medium text-foreground"
                    >
                      Postal Code *
                    </label>

                    <input
                      id="postal_code"
                      v-model="deliveryForm.postal_code"
                      type="text"
                      autocomplete="postal-code"
                      inputmode="numeric"
                      :class="inputClass('postal_code')"
                      @input="clearFieldError('postal_code')"
                    />

                    <p
                      v-if="fieldErrors.postal_code"
                      class="mt-1 text-xs text-red-600"
                    >
                      {{ fieldErrors.postal_code }}
                    </p>
                  </div>
                </div>

                <div>
                  <label
                    for="country"
                    class="mb-2 block text-sm font-medium text-foreground"
                  >
                    Country *
                  </label>

                  <input
                    id="country"
                    v-model="deliveryForm.country"
                    type="text"
                    autocomplete="country-name"
                    :class="inputClass('country')"
                    @input="clearFieldError('country')"
                  />

                  <p
                    v-if="fieldErrors.country"
                    class="mt-1 text-xs text-red-600"
                  >
                    {{ fieldErrors.country }}
                  </p>
                </div>

                <div>
                  <label
                    for="delivery_notes"
                    class="mb-2 block text-sm font-medium text-foreground"
                  >
                    Delivery Instructions
                    <span class="text-muted-foreground">(Optional)</span>
                  </label>

                  <textarea
                    id="delivery_notes"
                    v-model="deliveryForm.delivery_notes"
                    rows="3"
                    maxlength="1000"
                    placeholder="Landmark, gate instructions, preferred contact method..."
                    :class="inputClass('delivery_notes')"
                  ></textarea>
                </div>
              </div>
            </div>
          </form>
        </section>
      </div>

      <!-- Order Summary -->
      <aside
        class="h-fit rounded-2xl border border-border bg-surface p-6 lg:sticky lg:top-6"
      >
        <h2 class="text-xl font-semibold text-foreground">
          Order Summary
        </h2>

        <div class="mt-6 flex justify-between text-sm text-muted-foreground">
          <span>Items</span>
          <span>{{ cart.totalItems }}</span>
        </div>

        <div
          class="mt-4 flex justify-between border-t border-border pt-4"
        >
          <span class="font-semibold text-foreground">
            Total
          </span>

          <span class="text-xl font-bold text-primary">
            {{ formatPrice(cart.totalAmount) }}
          </span>
        </div>

        <button
          type="submit"
          form="delivery-form"
          :disabled="checkingOut || isUpdating || cart.items.length === 0"
          class="mt-6 w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-surface transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-border"
        >
          {{ checkingOut ? "Placing Order..." : "Place Order" }}
        </button>

        <p class="mt-3 text-center text-xs text-muted-foreground">
          Simulated checkout — no actual payment will be charged.
        </p>

        <RouterLink
          to="/"
          class="mt-4 block text-center text-sm font-medium text-primary hover:underline"
        >
          Continue Shopping
        </RouterLink>
      </aside>
    </div>
  </div>
</template>
