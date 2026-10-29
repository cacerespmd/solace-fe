<script setup>
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import api from "../../api/axios.js";

// ==========================================
// STATE
// ==========================================

const orders = ref([]);
const loading = ref(true);
const error = ref("");

// ==========================================
// FORMATTING
// ==========================================

const formatPrice = (value) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(value ?? 0));
};

const formatDate = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const formatStatus = (value) => {
  if (!value) return "Unknown";

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

// ==========================================
// PRODUCT HELPERS
// ==========================================

const getProductName = (item) => {
  return (
    item.product_name || item.product?.name || `Product #${item.product_id}`
  );
};

const getProductImage = (item) => {
  return item.product_image_url || item.product?.image_url || null;
};

const getTotalQuantity = (order) => {
  return (order.items || []).reduce(
    (total, item) => total + Number(item.quantity),
    0,
  );
};

// ==========================================
// REFUND / RETURN HELPERS
// ==========================================

const refundReturnCategories = [
  "refund_request",
  "return_request",
  "damaged_item",
  "wrong_item",
  "missing_item",
];

const hasCancellationRequest = (order) =>
  (order.support_tickets || []).some(
    (ticket) => ["cancellation_request", "cancellation_requested"].includes(ticket.category?.toLowerCase()) &&
      ["open", "in_process", "cancellation_requested"].includes(ticket.status),
  );

const getRefundReturnTicket = (order) => {
  return (
    [...(order.support_tickets || [])]
      .filter((ticket) =>
        refundReturnCategories.includes(ticket.category?.toLowerCase()),
      )
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )[0] || null
  );
};

const getRefundReturnStatusLabel = (status) => {
  const labels = {
    open: "Refund/Return Requested",
    in_process: "Refund/Return In Process",
    return_accepted: "Return Accepted",
    return_declined: "Return Declined",
    refund_accepted: "Refund Accepted",
    refund_declined: "Refund Declined",
    returned: "Returned",
    refunded: "Refunded",
  };

  return labels[status] || formatStatus(status);
};

const getRefundReturnStatusClass = (status) => {
  const classes = {
    open: "bg-orange-50 text-orange-700",
    in_process: "bg-primary-soft text-primary-hover",
    return_accepted: "bg-emerald-50 text-emerald-700",
    refund_accepted: "bg-emerald-50 text-emerald-700",
    return_declined: "bg-red-50 text-red-700",
    refund_declined: "bg-red-50 text-red-700",
    returned: "bg-green-50 text-green-700",
    refunded: "bg-green-50 text-green-700",
  };

  return classes[status] || "bg-background text-muted-foreground";
};

// ==========================================
// DELIVERY HELPERS
// ==========================================

const getDeliveryStatus = (order) => {
  return order.delivery?.status || null;
};

const getDeliveryStatusClass = (status) => {
  switch (status) {
    case "received":
      return "bg-emerald-50 text-emerald-700";

    case "delivered":
      return "bg-green-50 text-green-700";

    case "shipped":
    case "out_for_delivery":
      return "bg-primary-soft text-primary-hover";

    case "failed":
      return "bg-red-50 text-red-700";

    default:
      return "bg-amber-50 text-amber-700";
  }
};

// ==========================================
// FETCH ORDERS
// ==========================================

async function fetchOrders() {
  loading.value = true;
  error.value = "";

  try {
    const { data } = await api.get("/api/orders");

    orders.value = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Failed to fetch orders:", err);

    error.value = "Unable to load your orders.";
  } finally {
    loading.value = false;
  }
}

onMounted(fetchOrders);

// ==========================================
// SUMMARY
// ==========================================

const totalOrders = computed(() => orders.value.length);
</script>

<template>
  <div class="pb-10">
    <!-- ======================================
         PAGE HEADER
    ======================================= -->

    <div class="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">Your account</p>
        <h1 class="text-3xl font-semibold tracking-tight text-foreground">My orders</h1>

        <p class="mt-2 text-sm text-muted-foreground">
          View your purchases, delivery progress, and order details.
        </p>
      </div>

      <span
        v-if="!loading && !error"
        class="rounded-full bg-primary-soft px-4 py-2 text-sm font-semibold text-primary-hover"
      >
        {{ totalOrders }}
        {{ totalOrders === 1 ? "Order" : "Orders" }}
      </span>
    </div>

    <!-- ======================================
         LOADING
    ======================================= -->

    <div v-if="loading" class="py-20 text-center text-muted-foreground">
      Loading your orders...
    </div>

    <!-- ======================================
         ERROR
    ======================================= -->

    <div
      v-else-if="error"
      class="rounded-xl border border-red-100 bg-red-50 p-5 text-red-600"
    >
      {{ error }}

      <button
        type="button"
        class="ml-2 font-semibold underline"
        @click="fetchOrders"
      >
        Retry
      </button>
    </div>

    <!-- ======================================
         EMPTY STATE
    ======================================= -->

    <div
      v-else-if="orders.length === 0"
      class="rounded-2xl border border-border bg-surface px-6 py-20 text-center"
    >
      <div
        class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="text-primary"
        >
          <path
            d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
          />
          <path d="m3.3 7 8.7 5 8.7-5" />
          <path d="M12 22V12" />
        </svg>
      </div>

      <h2 class="text-xl font-semibold text-foreground">No orders yet</h2>

      <p class="mt-2 text-muted-foreground">
        Your purchases will appear here after checkout.
      </p>

      <RouterLink
        to="/"
        class="mt-6 inline-flex rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-on-primary transition hover:bg-primary-hover"
      >
        Browse Products
      </RouterLink>
    </div>

    <!-- ======================================
         ORDER LIST
    ======================================= -->

    <div v-else class="space-y-5">
      <div
        v-for="order in orders"
        :key="order.id"
        class="overflow-hidden rounded-2xl border transition hover:shadow-sm"
        :class="order.support_tickets?.length
          ? 'border-red-200 bg-red-50 hover:border-red-300'
          : 'border-border bg-surface hover:border-primary-border'"
      >
        <!-- ==================================
             ORDER HEADER
        =================================== -->

        <div
          class="flex flex-wrap items-start justify-between gap-4 px-6 py-5"
          :class="order.support_tickets?.length ? 'bg-red-100/50' : 'bg-background/70'"
        >
          <div>
            <p
              class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Order Number
            </p>

            <RouterLink
              :to="{
                name: 'customer-order-details',
                params: { id: order.id },
              }"
              class="mt-1 block break-all text-lg font-bold text-foreground hover:text-primary"
            >
              {{ order.order_number }}
            </RouterLink>

            <p class="mt-2 text-sm text-muted-foreground">
              Placed {{ formatDate(order.created_at) }}
            </p>
          </div>

          <!-- ==================================
               STATUS BADGES
          =================================== -->

          <!-- Status Badges -->
          <div class="flex flex-wrap items-center gap-2">
            <span
              v-if="order.status === 'cancelled'"
              class="rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
            >
              Cancelled
            </span>
            <span
              v-else-if="hasCancellationRequest(order)"
              class="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700"
            >
              Cancellation Requested
            </span>
            <!-- Show Refund / Return Status if a support ticket exists -->
            <span
              v-else-if="getRefundReturnTicket(order)"
              :class="
                getRefundReturnStatusClass(getRefundReturnTicket(order).status)
              "
              class="rounded-full px-3 py-1.5 text-xs font-semibold"
            >
              {{
                getRefundReturnStatusLabel(getRefundReturnTicket(order).status)
              }}
            </span>

            <!-- Otherwise, show Delivery Status -->
            <span
              v-else-if="getDeliveryStatus(order)"
              :class="getDeliveryStatusClass(getDeliveryStatus(order))"
              class="rounded-full px-3 py-1.5 text-xs font-semibold"
            >
              {{ formatStatus(getDeliveryStatus(order)) }}
            </span>
          </div>
        </div>

        <!-- ==================================
             PURCHASED PRODUCTS
        =================================== -->

        <div class="px-6">
          <div
            v-for="item in order.items || []"
            :key="item.id"
            class="flex flex-wrap items-center justify-between gap-4 border-b border-border py-5 last:border-0"
          >
            <!-- Product -->
            <div class="flex min-w-0 items-center gap-4">
              <!-- Product Image -->
              <RouterLink
                :to="`/products/${item.product_id}`"
                class="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-background"
              >
                <img
                  v-if="getProductImage(item)"
                  :src="getProductImage(item)"
                  :alt="getProductName(item)"
                  class="h-full w-full object-contain p-2"
                  loading="lazy"
                />

                <!-- Image Fallback -->
                <div
                  v-else
                  class="flex flex-col items-center justify-center gap-1 text-muted-foreground"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="m21 15-5-5L5 21" />
                  </svg>

                  <span class="text-xs"> No image </span>
                </div>
              </RouterLink>

              <!-- Product Details -->
              <div class="min-w-0">
                <RouterLink
                  :to="`/products/${item.product_id}`"
                  class="font-semibold text-primary hover:underline"
                >
                  {{ getProductName(item) }}
                </RouterLink>

                <p class="mt-1 text-sm text-muted-foreground">
                  {{ formatPrice(item.unit_price) }}
                  × {{ item.quantity }}
                </p>

                <p class="mt-1 text-xs text-muted-foreground">
                  Product ID: {{ item.product_id }}
                </p>
              </div>
            </div>

            <!-- Product Subtotal -->
            <span class="font-semibold text-foreground">
              {{ formatPrice(Number(item.unit_price) * Number(item.quantity)) }}
            </span>
          </div>
        </div>

        <!-- ==================================
             DELIVERY SUMMARY
        =================================== -->

        <div
          v-if="order.delivery"
          class="border-t px-6 py-4"
          :class="order.support_tickets?.length ? 'border-red-200 bg-red-100/30' : 'border-border bg-background/40'"
        >
          <div class="flex flex-wrap items-start justify-between gap-4">
            <!-- Recipient -->
            <div>
              <p
                class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                Deliver To
              </p>

              <p class="mt-1 text-sm font-semibold text-foreground">
                {{ order.delivery.recipient_name }}
              </p>

              <p class="mt-1 text-xs text-muted-foreground">
                {{
                  [
                    order.delivery.barangay,
                    order.delivery.city,
                    order.delivery.province,
                  ]
                    .filter(Boolean)
                    .join(", ")
                }}
              </p>
            </div>

            <!-- Courier -->
            <div v-if="order.delivery.courier_name">
              <p
                class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                Courier
              </p>

              <p class="mt-1 text-sm font-semibold text-foreground">
                {{ order.delivery.courier_name }}
              </p>
            </div>
          </div>
        </div>

        <!-- ==================================
             ORDER FOOTER
        =================================== -->

        <div
          class="flex flex-wrap items-center justify-between gap-4 border-t border-border px-6 py-5"
        >
          <div>
            <p class="text-sm text-muted-foreground">
              {{ getTotalQuantity(order) }}
              {{ getTotalQuantity(order) === 1 ? "item" : "items" }}
              purchased
            </p>

            <p class="mt-1 text-xl font-bold text-primary">
              {{ formatPrice(order.total_amount) }}
            </p>
          </div>

          <RouterLink
            :to="{
              name: 'customer-order-details',
              params: { id: order.id },
            }"
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition hover:bg-primary-hover"
          >
            View Order Details

            <span aria-hidden="true">→</span>
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
