<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import api from "../../api/axios.js";

const route = useRoute();

const order = ref(null);
const loading = ref(true);
const error = ref("");

const receiving = ref(false);
const receiveError = ref("");
const receiveSuccess = ref("");
const showReceiveConfirmation = ref(false);

// ==========================================
// DELIVERY INFORMATION
// ==========================================

const delivery = computed(() => {
  return order.value?.delivery ?? null;
});

const deliverySteps = [
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "shipped",
    label: "Shipped",
  },
  {
    value: "out_for_delivery",
    label: "Out for Delivery",
  },
  {
    value: "delivered",
    label: "Delivered",
  },
  {
    value: "received",
    label: "Received",
  },
];

const currentDeliveryStep = computed(() => {
  return deliverySteps.findIndex(
    (step) => step.value === delivery.value?.status,
  );
});

const deliveryStatusLabel = computed(() => {
  const status = delivery.value?.status;

  if (!status) {
    return "Not Available";
  }

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
});

const deliveryStatusClass = computed(() => {
  switch (delivery.value?.status) {
    case "received":
    case "delivered":
      return "bg-emerald-50 text-emerald-700";

    case "shipped":
    case "out_for_delivery":
      return "bg-primary-soft text-primary-hover";

    case "failed":
      return "bg-red-50 text-red-700";

    default:
      return "bg-amber-50 text-amber-700";
  }
});

const orderStatusClass = computed(() => {
  switch (order.value?.status) {
    case "received":
    case "delivered":
    case "completed":
      return "bg-emerald-50 text-emerald-700";

    case "shipped":
    case "out_for_delivery":
      return "bg-primary-soft text-primary-hover";

    case "cancelled":
    case "failed":
      return "bg-red-50 text-red-700";

    default:
      return "bg-amber-50 text-amber-700";
  }
});

const fullAddress = computed(() => {
  if (!delivery.value) {
    return "";
  }

  const fields = [
    delivery.value.address_line_1,
    delivery.value.address_line_2,
    delivery.value.barangay,
    delivery.value.city,
    delivery.value.province,
    delivery.value.postal_code,
    delivery.value.country,
  ];

  return fields.filter(Boolean).join(", ");
});

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
  if (!value) {
    return "Not yet available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not yet available";
  }

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const formatStatus = (value) => {
  if (!value) {
    return "Unknown";
  }

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

// ==========================================
// SUPPORT TICKETS
// ==========================================

const supportTickets = computed(() =>
  [...(order.value?.support_tickets || [])].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  ),
);

const refundReturnCategories = [
  "refund_request",
  "return_request",
  "damaged_item",
  "wrong_item",
  "missing_item",
];

const hasCancellationRequest = computed(() =>
  supportTickets.value.some(
    (ticket) => ["cancellation_request", "cancellation_requested"].includes(ticket.category?.toLowerCase()) &&
      ["open", "in_process", "cancellation_requested"].includes(ticket.status),
  ),
);

const refundReturnTicket = computed(() => {
  return (
    supportTickets.value.find((ticket) =>
      refundReturnCategories.includes(ticket.category?.toLowerCase()),
    ) || null
  );
});

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

const getTicketStatusClass = (status) => {
  const classes = {
    open: "bg-amber-50 text-amber-700",
    in_process: "bg-primary-soft text-primary-hover",
    return_accepted: "bg-emerald-50 text-emerald-700",
    refund_accepted: "bg-emerald-50 text-emerald-700",
    return_declined: "bg-red-50 text-red-700",
    refund_declined: "bg-red-50 text-red-700",
    returned: "bg-green-50 text-green-700",
    refunded: "bg-green-50 text-green-700",
    resolved: "bg-emerald-50 text-emerald-700",
    closed: "bg-background text-muted-foreground",
  };

  return classes[status?.toLowerCase()] || "bg-background text-muted-foreground";
};

// ==========================================
// PRODUCT INFORMATION
// ==========================================

const getProductName = (item) => {
  return (
    item.product_name || item.product?.name || `Product #${item.product_id}`
  );
};

const getProductImage = (item) => {
  return item.product_image_url || item.product?.image_url || null;
};

const getItemSubtotal = (item) => {
  return Number(item.unit_price) * Number(item.quantity);
};

// ==========================================
// FETCH ORDER
// ==========================================

async function fetchOrder(showLoading = true) {
  if (showLoading) {
    loading.value = true;
    order.value = null;
  }

  error.value = "";

  try {
    const { data } = await api.get(`/api/orders/${route.params.id}`);

    order.value = data;
  } catch (err) {
    console.error("Failed to fetch order:", err);

    const message =
      err.response?.status === 404
        ? "Order not found."
        : "Unable to load order details.";

    if (showLoading) {
      error.value = message;
    } else {
      receiveError.value = message;
    }
  } finally {
    if (showLoading) {
      loading.value = false;
    }
  }
}

// ==========================================
// CONFIRM ORDER RECEIVED
// ==========================================

const openReceiveConfirmation = () => {
  if (!order.value || delivery.value?.status !== "delivered") {
    return;
  }

  receiveError.value = "";
  showReceiveConfirmation.value = true;
};

const closeReceiveConfirmation = () => {
  if (receiving.value) {
    return;
  }

  showReceiveConfirmation.value = false;
  receiveError.value = "";
};

const confirmReceived = async () => {
  if (
    !order.value ||
    delivery.value?.status !== "delivered" ||
    receiving.value
  ) {
    return;
  }

  receiving.value = true;
  receiveError.value = "";
  receiveSuccess.value = "";

  const orderId = order.value.id;

  try {
    const { data } = await api.patch(`/api/orders/${orderId}/receive`);

    showReceiveConfirmation.value = false;

    receiveSuccess.value =
      data.message || "Order confirmed as received successfully.";

    // Update the current view immediately.
    order.value = {
      ...order.value,
      status: "received",
      delivery: {
        ...order.value.delivery,
        status: "received",
        received_at: data.received_at || new Date().toISOString(),
      },
    };

    // Reload the saved order information.
    await fetchOrder(false);
  } catch (err) {
    console.error("Failed to confirm order receipt:", err);

    receiveError.value =
      err.response?.data?.detail ||
      "Unable to confirm order receipt. Please try again.";
  } finally {
    receiving.value = false;
  }
};

// ==========================================
// LIFECYCLE
// ==========================================

onMounted(() => {
  fetchOrder();
});

watch(
  () => route.params.id,
  () => {
    receiveError.value = "";
    receiveSuccess.value = "";
    showReceiveConfirmation.value = false;

    fetchOrder();
  },
);
</script>

<template>
  <div class="pb-10">
    <!-- ======================================
         BACK LINK
    ======================================= -->

    <RouterLink
      to="/orders"
      class="mb-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
    >
      <span>←</span>
      <span>Back to My Orders</span>
    </RouterLink>

    <!-- ======================================
         ORDER PLACED MESSAGE
    ======================================= -->

    <div
      v-if="route.query.placed === '1'"
      class="mb-6 rounded-xl border border-emerald-100 bg-emerald-50 p-5 text-emerald-700"
    >
      <p class="font-semibold">Order placed successfully!</p>

      <p class="mt-1 text-sm">
        Your order has been recorded. No actual payment was charged.
      </p>
    </div>

    <!-- ======================================
         LOADING
    ======================================= -->

    <div v-if="loading" class="py-20 text-center text-muted-foreground">
      Loading order...
    </div>

    <!-- ======================================
         ERROR
    ======================================= -->

    <div
      v-else-if="error"
      class="rounded-xl border border-red-100 bg-red-50 p-5 text-red-600"
    >
      {{ error }}
    </div>

    <!-- ======================================
         ORDER CONTENT
    ======================================= -->

    <div v-else-if="order" class="space-y-6">
      <!-- RECEIVED SUCCESS MESSAGE -->

      <div
        v-if="receiveSuccess"
        class="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700"
        role="status"
      >
        <span class="text-lg">✓</span>

        <p>
          {{ receiveSuccess }}
        </p>
      </div>

      <!-- ====================================
           ORDER HEADER
      ===================================== -->

      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="text-sm text-muted-foreground">Order Details</p>

          <h1
            class="mt-1 break-all text-2xl font-bold text-foreground sm:text-3xl"
          >
            {{ order.order_number }}
          </h1>

          <p class="mt-2 text-sm text-muted-foreground">
            Placed {{ formatDate(order.created_at) }}
          </p>
        </div>

        <!-- Order Status Badge -->
        <div class="flex flex-wrap items-center gap-2">
          <span
            v-if="hasCancellationRequest"
            class="rounded-full bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700"
          >
            Cancellation Requested
          </span>
          <!-- Show refund/return status when a ticket exists -->
          <span
            v-else-if="refundReturnTicket"
            :class="getRefundReturnStatusClass(refundReturnTicket.status)"
            class="rounded-full px-4 py-2 text-sm font-semibold"
          >
            {{ getRefundReturnStatusLabel(refundReturnTicket.status) }}
          </span>

          <!-- Otherwise show normal order status -->
          <span
            v-else
            :class="orderStatusClass"
            class="rounded-full px-4 py-2 text-sm font-semibold"
          >
            {{ formatStatus(order.status) }}
          </span>
        </div>
      </div>

      <!-- ====================================
           SUPPORT TICKET DETAILS
      ===================================== -->
      <section
        v-if="supportTickets.length > 0"
        class="rounded-2xl border border-orange-200 bg-surface p-6"
      >
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 class="text-xl font-semibold text-foreground">
              Support Ticket Details
            </h2>
            <p class="mt-1 text-sm text-muted-foreground">
              Track the concerns reported for this order.
            </p>
          </div>
          <span
            class="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700"
          >
            {{ supportTickets.length }}
            {{ supportTickets.length === 1 ? "Ticket" : "Tickets" }}
          </span>
        </div>

        <div class="mt-6 space-y-4">
          <div
            v-for="ticket in supportTickets"
            :key="ticket.id"
            class="overflow-hidden rounded-xl border border-border"
          >
            <div
              class="flex flex-wrap items-start justify-between gap-3 bg-background px-5 py-4"
            >
              <div class="min-w-0">
                <p
                  class="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Ticket #{{ ticket.id }}
                </p>
                <h3 class="mt-1 break-words font-semibold text-foreground">
                  {{ ticket.subject }}
                </h3>
                <p class="mt-1 text-xs text-muted-foreground">
                  Submitted {{ formatDate(ticket.created_at) }}
                </p>
              </div>
              <div class="flex flex-wrap gap-2">
                <span
                  class="rounded-full bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary-hover"
                >
                  {{ formatStatus(ticket.category) }}
                </span>
                <span
                  :class="getTicketStatusClass(ticket.status)"
                  class="rounded-full px-3 py-1.5 text-xs font-semibold"
                >
                  {{ formatStatus(ticket.status) }}
                </span>
              </div>
            </div>

            <div class="px-5 py-5">
              <p
                class="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Description
              </p>
              <p
                class="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-foreground"
              >
                {{ ticket.description }}
              </p>
              <div
                class="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-3"
              >
                <div>
                  <p class="text-xs text-muted-foreground">Category</p>
                  <p class="mt-1 text-sm font-semibold text-foreground">
                    {{ formatStatus(ticket.category) }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-muted-foreground">Priority</p>
                  <p class="mt-1 text-sm font-semibold text-foreground">
                    {{ formatStatus(ticket.priority) }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-muted-foreground">Last Updated</p>
                  <p class="mt-1 text-sm font-semibold text-foreground">
                    {{ formatDate(ticket.updated_at) }}
                  </p>
                </div>
              </div>
            </div>

            <div
              v-if="ticket.status === 'open'"
              class="border-t border-amber-100 bg-amber-50 px-5 py-3"
            >
              <p class="text-xs font-medium text-amber-700">
                Your support request has been submitted and is awaiting review.
              </p>
            </div>
            <div
              v-else-if="ticket.status === 'resolved'"
              class="border-t border-emerald-100 bg-emerald-50 px-5 py-3"
            >
              <p class="text-xs font-medium text-emerald-700">
                This support ticket has been marked as resolved.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- ====================================
           DELIVERY STATUS
      ===================================== -->

      <section
        v-if="order.status !== 'cancelled'"
        class="rounded-2xl border border-border bg-surface p-6"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-xl font-semibold text-foreground">
              Delivery Status
            </h2>

            <p class="mt-1 text-sm text-muted-foreground">
              Track the progress of your order.
            </p>
          </div>

          <span
            v-if="delivery"
            :class="deliveryStatusClass"
            class="rounded-full px-4 py-2 text-sm font-semibold"
          >
            {{ deliveryStatusLabel }}
          </span>
        </div>

        <template v-if="delivery">
          <!-- FAILED DELIVERY -->

          <div
            v-if="delivery.status === 'failed'"
            class="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            Delivery was unsuccessful. Please contact support for assistance.
          </div>

          <!-- DELIVERY PROGRESS -->

          <div v-else class="mt-8">
            <div class="grid grid-cols-5 gap-1 sm:gap-3">
              <div
                v-for="(step, index) in deliverySteps"
                :key="step.value"
                class="min-w-0 text-center"
              >
                <!-- STEP CIRCLE -->

                <div
                  class="mx-auto flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold sm:h-11 sm:w-11"
                  :class="
                    index <= currentDeliveryStep
                      ? 'border-primary bg-primary text-surface'
                      : 'border-border bg-surface text-muted-foreground'
                  "
                >
                  <span v-if="index < currentDeliveryStep"> ✓ </span>

                  <span v-else>
                    {{ index + 1 }}
                  </span>
                </div>

                <!-- STEP LABEL -->

                <p
                  class="mt-3 break-words text-xs font-medium sm:text-sm"
                  :class="
                    index <= currentDeliveryStep
                      ? 'text-primary-hover'
                      : 'text-muted-foreground'
                  "
                >
                  {{ step.label }}
                </p>
              </div>
            </div>

            <!-- ==================================
                 DELIVERED NOTICE + BUTTON
            =================================== -->

            <div
              v-if="delivery.status === 'delivered'"
              class="mt-6 rounded-xl border border-primary-subtle bg-primary-soft p-5"
            >
              <div
                class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p class="font-semibold text-primary-hover">
                    Your package has been delivered!
                  </p>

                  <p class="mt-1 text-sm leading-6 text-primary-hover">
                    Please confirm that you have physically received your
                    package.
                  </p>
                </div>

                <button
                  type="button"
                  :disabled="receiving"
                  class="shrink-0 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-surface transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                  @click="openReceiveConfirmation"
                >
                  Confirm Order Received
                </button>
              </div>

              <p
                v-if="receiveError"
                class="mt-4 text-sm font-medium text-red-600"
              >
                {{ receiveError }}
              </p>
            </div>

            <!-- ==================================
                 RECEIVED NOTICE
            =================================== -->

            <div
              v-if="delivery.status === 'received'"
              class="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 p-5"
            >
              <div class="flex items-start gap-3">
                <span
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700"
                >
                  ✓
                </span>

                <div>
                  <p class="font-semibold text-emerald-900">Order Received</p>

                  <p class="mt-1 text-sm text-emerald-700">
                    You have successfully confirmed receipt of your order.
                  </p>

                  <p
                    v-if="delivery.received_at"
                    class="mt-2 text-xs text-emerald-600"
                  >
                    Confirmed on
                    {{ formatDate(delivery.received_at) }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- ==================================
               DELIVERY DATES
          =================================== -->

          <div
            class="mt-8 grid gap-4 border-t border-border pt-6 sm:grid-cols-3"
          >
            <div>
              <p class="text-xs text-muted-foreground">Shipped On</p>

              <p class="mt-1 text-sm font-semibold text-foreground">
                {{ formatDate(delivery.shipped_at) }}
              </p>
            </div>

            <div>
              <p class="text-xs text-muted-foreground">Delivered On</p>

              <p class="mt-1 text-sm font-semibold text-foreground">
                {{ formatDate(delivery.delivered_at) }}
              </p>
            </div>

            <div>
              <p class="text-xs text-muted-foreground">Received On</p>

              <p class="mt-1 text-sm font-semibold text-foreground">
                {{ formatDate(delivery.received_at) }}
              </p>
            </div>
          </div>
        </template>

        <!-- NO DELIVERY RECORD -->

        <div
          v-else
          class="mt-6 rounded-xl bg-background p-4 text-sm text-muted-foreground"
        >
          Delivery tracking information is not available for this order.
        </div>
      </section>

      <!-- ====================================
           DELIVERY INFORMATION
      ===================================== -->

      <section
        v-if="delivery"
        class="rounded-2xl border border-border bg-surface p-6"
      >
        <h2 class="text-xl font-semibold text-foreground">
          Delivery Information
        </h2>

        <p class="mt-1 text-sm text-muted-foreground">
          Shipping address and recipient details.
        </p>

        <div class="mt-6 grid gap-6 sm:grid-cols-2">
          <!-- RECIPIENT NAME -->

          <div>
            <p
              class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Recipient Name
            </p>

            <p class="mt-2 font-semibold text-foreground">
              {{ delivery.recipient_name }}
            </p>
          </div>

          <!-- CONTACT NUMBER -->

          <div>
            <p
              class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Contact Number
            </p>

            <p class="mt-2 font-semibold text-foreground">
              {{ delivery.contact_number }}
            </p>
          </div>

          <!-- SHIPPING ADDRESS -->

          <div class="sm:col-span-2">
            <p
              class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Shipping Address
            </p>

            <p class="mt-2 leading-7 text-foreground">
              {{ fullAddress }}
            </p>
          </div>

          <!-- DELIVERY NOTES -->

          <div v-if="delivery.delivery_notes" class="sm:col-span-2">
            <p
              class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Delivery Instructions
            </p>

            <p class="mt-2 whitespace-pre-line text-foreground">
              {{ delivery.delivery_notes }}
            </p>
          </div>
        </div>
      </section>

      <!-- ====================================
           SHIPPING & TRACKING
      ===================================== -->

      <section
        v-if="delivery"
        class="rounded-2xl border border-border bg-surface p-6"
      >
        <h2 class="text-xl font-semibold text-foreground">
          Shipping & Tracking
        </h2>

        <div class="mt-6 grid gap-6 sm:grid-cols-2">
          <!-- COURIER -->

          <div>
            <p
              class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Courier
            </p>

            <p class="mt-2 font-semibold text-foreground">
              {{ delivery.courier_name || "Not assigned yet" }}
            </p>
          </div>

          <!-- TRACKING NUMBER -->

          <div>
            <p
              class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Tracking Number
            </p>

            <p class="mt-2 break-all font-semibold text-foreground">
              {{ delivery.tracking_number || "Not available yet" }}
            </p>
          </div>
        </div>
      </section>

      <!-- ====================================
           PURCHASED ITEMS
      ===================================== -->

      <section class="rounded-2xl border border-border bg-surface p-6">
        <h2 class="text-xl font-semibold text-foreground">Purchased Items</h2>

        <!-- ORDER ITEMS -->

        <div
          v-for="item in order.items"
          :key="item.id"
          class="flex flex-wrap items-center justify-between gap-4 border-b border-border py-5 last:border-0"
        >
          <div class="flex min-w-0 items-center gap-4">
            <!-- PRODUCT IMAGE -->

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

              <!-- IMAGE FALLBACK -->

              <div
                v-else
                class="flex flex-col items-center justify-center gap-1 px-2 text-muted-foreground"
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

                <span class="text-center text-xs"> No image </span>
              </div>
            </RouterLink>

            <!-- PRODUCT DETAILS -->

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

          <!-- ITEM SUBTOTAL -->

          <span class="font-semibold text-foreground">
            {{ formatPrice(getItemSubtotal(item)) }}
          </span>
        </div>

        <!-- ORDER TOTAL -->

        <div
          class="mt-5 flex items-center justify-between gap-4 border-t border-border pt-5"
        >
          <span class="font-semibold text-foreground"> Order Total </span>

          <span class="text-2xl font-bold text-primary">
            {{ formatPrice(order.total_amount) }}
          </span>
        </div>
      </section>

      <!-- ====================================
           CUSTOMER SUPPORT
      ===================================== -->

      <section class="rounded-2xl border border-border bg-surface p-6">
        <h2 class="text-lg font-semibold text-foreground">
          Need help with this order?
        </h2>

        <p class="mt-2 text-sm text-muted-foreground">
          Our AI support assistant can help you with questions about your order,
          delivery status, and product information.
        </p>
      </section>
    </div>

    <!-- ======================================
         CONFIRM RECEIVED MODAL
    ======================================= -->

    <div
      v-if="showReceiveConfirmation"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-dark/50 p-4"
      @click.self="closeReceiveConfirmation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-received-title"
        class="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl"
      >
        <!-- MODAL HEADER -->

        <div class="flex items-start justify-between gap-4">
          <div>
            <h3
              id="confirm-received-title"
              class="text-xl font-bold text-foreground"
            >
              Confirm Order Received?
            </h3>

            <p class="mt-2 text-sm text-muted-foreground">
              {{ order?.order_number }}
            </p>
          </div>

          <button
            type="button"
            :disabled="receiving"
            class="text-2xl text-muted-foreground transition hover:text-foreground disabled:opacity-50"
            aria-label="Close confirmation"
            @click="closeReceiveConfirmation"
          >
            ×
          </button>
        </div>

        <!-- CONFIRMATION MESSAGE -->

        <div class="mt-5 rounded-xl border border-primary-subtle bg-primary-soft p-4">
          <p class="text-sm leading-6 text-primary-hover">
            Please confirm that you have physically received your package.
          </p>

          <p class="mt-2 text-sm leading-6 text-primary-hover">
            Once confirmed, your order will be marked as received.
          </p>
        </div>

        <!-- ERROR -->

        <div
          v-if="receiveError"
          class="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
          role="alert"
        >
          {{ receiveError }}
        </div>

        <!-- ACTION BUTTONS -->

        <div
          class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"
        >
          <button
            type="button"
            :disabled="receiving"
            class="rounded-xl border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-background disabled:opacity-50"
            @click="closeReceiveConfirmation"
          >
            Cancel
          </button>

          <button
            type="button"
            :disabled="receiving"
            class="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-surface transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            @click="confirmReceived"
          >
            {{ receiving ? "Confirming..." : "Yes, I've Received It" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
