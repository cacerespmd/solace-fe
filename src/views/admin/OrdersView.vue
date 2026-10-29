
<script setup>
import { computed, onMounted, ref, watch } from "vue";
import api from "../../api/axios.js";
import { useAuthStore } from "../../stores/auth.js";

const auth = useAuthStore();

const orders = ref([]);
const loading = ref(false);
const saving = ref(false);
const error = ref("");
const success = ref("");

const search = ref("");
const deliveryStatus = ref("");
const page = ref(1);
const total = ref(0);
const perPage = 10;

const selectedOrder = ref(null);
const courierName = ref("");
const trackingNumber = ref("");

const pendingCancellationTicket = computed(() =>
  (selectedOrder.value?.support_tickets || []).find(
    (ticket) =>
      ["cancellation_request", "cancellation_requested"].includes(ticket.category?.toLowerCase()) &&
      ["open", "in_process", "cancellation_requested"].includes(ticket.status),
  ),
);

async function decideCancellation(status) {
  if (!pendingCancellationTicket.value || saving.value) return;
  const ticketId = pendingCancellationTicket.value.id;
  const approved = status === "cancellation_accepted";
  if (!window.confirm(approved ? "Cancel this order?" : "Reject this cancellation request?")) return;

  saving.value = true;
  error.value = "";
  success.value = "";
  try {
    await api.patch(`/api/admin/support-tickets/${ticketId}/status`, { status }, { headers: headers() });
    await refreshSelectedOrder();
    await fetchOrders();
    success.value = approved ? "Order cancelled successfully." : "Cancellation request rejected. Order status preserved.";
  } catch (err) {
    error.value = err.response?.data?.detail || "Unable to update cancellation request.";
  } finally {
    saving.value = false;
  }
}

const totalPages = computed(() =>
  Math.max(1, Math.ceil(total.value / perPage))
);

const refundReturnCategories = [
  "refund_request",
  "return_request",
  "damaged_item",
  "wrong_item",
  "missing_item",
];

const refundReturnLabels = {
  open: "Refund/Return Requested",
  in_process: "Refund/Return In Process",
  return_accepted: "Return Accepted",
  return_declined: "Return Declined",
  refund_accepted: "Refund Accepted",
  refund_declined: "Refund Declined",
  returned: "Returned",
  refunded: "Refunded",
};

function headers() {
  return {
    Authorization: `Bearer ${auth.token}`,
  };
}

function formatPrice(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(value ?? 0));
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatStatus(value) {
  return String(value || "unknown")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(value) {
  const classes = {
    cancellation_requested: "bg-orange-50 text-orange-700",
    cancelled: "bg-red-50 text-red-700",
    pending: "bg-amber-50 text-amber-700",
    shipped: "bg-primary-soft text-primary-hover",
    out_for_delivery: "bg-primary-soft text-primary-hover",
    delivered: "bg-emerald-50 text-emerald-700",
    received: "bg-green-50 text-green-700",
    failed: "bg-red-50 text-red-700",
    open: "bg-orange-50 text-orange-700",
    in_process: "bg-primary-soft text-primary-hover",
    return_accepted: "bg-emerald-50 text-emerald-700",
    return_declined: "bg-red-50 text-red-700",
    refund_accepted: "bg-emerald-50 text-emerald-700",
    refund_declined: "bg-red-50 text-red-700",
    returned: "bg-green-50 text-green-700",
    refunded: "bg-green-50 text-green-700",
  };

  return classes[value] || "bg-background text-muted-foreground";
}

function getRefundReturnTicket(order) {
  return (
    [...(order?.support_tickets || [])]
      .filter((ticket) =>
        refundReturnCategories.includes(
          ticket.category?.toLowerCase()
        )
      )
      .sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
      )[0] || null
  );
}

function getDisplayStatus(order) {
  if (!order) {
    return {
      status: "unknown",
      label: "Unknown",
      source: "order",
    };
  }

  if (order.status === "cancelled") {
    return { status: "cancelled", label: "Cancelled", source: "order", ticket_id: null };
  }

  const cancellationTicket = (order.support_tickets || []).find(
    (ticket) =>
      ["cancellation_request", "cancellation_requested"].includes(ticket.category?.toLowerCase()) &&
      ["open", "in_process", "cancellation_requested"].includes(ticket.status),
  );

  if (cancellationTicket) {
    return {
      status: "cancellation_requested",
      label: "Cancellation Requested",
      source: "support_ticket",
      ticket_id: cancellationTicket.id,
    };
  }

  // Prefer the display status provided by the backend.
  if (order.display_status?.status) {
    return order.display_status;
  }

  // Fallback if the API includes tickets but not display_status.
  const ticket = getRefundReturnTicket(order);

  if (ticket) {
    return {
      status: ticket.status,
      label:
        refundReturnLabels[ticket.status] ||
        formatStatus(ticket.status),
      source: "support_ticket",
      ticket_id: ticket.id,
    };
  }

  const status = order.delivery?.status || order.status;

  return {
    status,
    label: formatStatus(status),
    source: "order",
    ticket_id: null,
  };
}

const selectedOrderStatus = computed(() =>
  getDisplayStatus(selectedOrder.value)
);

async function fetchOrders() {
  loading.value = true;
  error.value = "";

  try {
    const { data } = await api.get("/api/admin/orders", {
      headers: headers(),
      params: {
        search: search.value || undefined,
        delivery_status: deliveryStatus.value || undefined,
        page: page.value,
        per_page: perPage,
      },
    });

    orders.value = data.orders ?? [];
    total.value = data.total ?? 0;
  } catch (err) {
    error.value =
      err.response?.data?.detail ||
      "Failed to load orders.";
  } finally {
    loading.value = false;
  }
}

async function openOrder(order) {
  selectedOrder.value = order;
  courierName.value = order.delivery?.courier_name || "";
  trackingNumber.value = order.delivery?.tracking_number || "";
  error.value = "";
  success.value = "";

  try {
    await refreshSelectedOrder();
  } catch (err) {
    error.value =
      err.response?.data?.detail ||
      "Failed to load order details.";
  }
}

function closeOrder() {
  selectedOrder.value = null;
}

async function refreshSelectedOrder() {
  if (!selectedOrder.value) return;

  const orderId = selectedOrder.value.id;

  const { data } = await api.get(
    `/api/admin/orders/${orderId}`,
    { headers: headers() }
  );

  if (selectedOrder.value?.id === orderId) {
    selectedOrder.value = data;
  }
}

async function shipOrder() {
  if (!selectedOrder.value || saving.value) return;

  saving.value = true;
  error.value = "";
  success.value = "";

  try {
    await api.patch(
      `/api/admin/orders/${selectedOrder.value.id}/ship`,
      {
        courier_name: courierName.value.trim() || null,
        tracking_number: trackingNumber.value.trim() || null,
      },
      { headers: headers() }
    );

    success.value = "Order shipped successfully.";

    await refreshSelectedOrder();
    await fetchOrders();
  } catch (err) {
    error.value =
      err.response?.data?.detail ||
      "Failed to ship order.";
  } finally {
    saving.value = false;
  }
}

async function updateDeliveryStatus(status) {
  if (!selectedOrder.value || saving.value) return;

  saving.value = true;
  error.value = "";
  success.value = "";

  try {
    await api.patch(
      `/api/admin/orders/${selectedOrder.value.id}/delivery-status`,
      { status },
      { headers: headers() }
    );

    success.value = `Delivery marked as ${formatStatus(status)}.`;

    await refreshSelectedOrder();
    await fetchOrders();
  } catch (err) {
    error.value =
      err.response?.data?.detail ||
      "Failed to update delivery status.";
  } finally {
    saving.value = false;
  }
}

function nextStatus(status) {
  const transitions = {
    shipped: "out_for_delivery",
    out_for_delivery: "delivered",
  };

  return transitions[status] || null;
}

watch([search, deliveryStatus], () => {
  page.value = 1;
  fetchOrders();
});

watch(page, fetchOrders);

onMounted(fetchOrders);
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-foreground">
        Orders
      </h1>

      <p class="mt-1 text-sm text-muted-foreground">
        Manage customer purchases, deliveries, and refund or return requests.
      </p>
    </div>

    <!-- Alerts -->
    <div
      v-if="error"
      class="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
    >
      {{ error }}
    </div>

    <div
      v-if="success"
      class="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700"
    >
      {{ success }}
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3">
      <input
        v-model="search"
        type="text"
        placeholder="Search order or customer..."
        class="w-full max-w-sm rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
      />

      <select
        v-model="deliveryStatus"
        class="rounded-xl border border-border bg-surface px-4 py-3 text-sm"
      >
        <option value="">All deliveries</option>
        <option value="pending">Pending</option>
        <option value="shipped">Shipped</option>
        <option value="out_for_delivery">Out for Delivery</option>
        <option value="delivered">Delivered</option>
        <option value="received">Received</option>
        <option value="failed">Failed</option>
      </select>
    </div>

    <!-- Orders table -->
    <div
      class="overflow-hidden rounded-2xl border border-border bg-surface"
    >
      <div class="overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="bg-background text-xs uppercase text-muted-foreground">
            <tr>
              <th class="px-5 py-4">Order</th>
              <th class="px-5 py-4">Customer</th>
              <th class="px-5 py-4">Total</th>
              <th class="px-5 py-4">Status</th>
              <th class="px-5 py-4">Date</th>
              <th class="px-5 py-4">Action</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-border">
            <tr v-if="loading">
              <td
                colspan="6"
                class="px-5 py-10 text-center text-muted-foreground"
              >
                Loading orders...
              </td>
            </tr>

            <tr v-else-if="!orders.length">
              <td
                colspan="6"
                class="px-5 py-10 text-center text-muted-foreground"
              >
                No orders found.
              </td>
            </tr>

            <tr
              v-for="order in orders"
              :key="order.id"
              class="hover:bg-background"
            >
              <td class="px-5 py-4 font-semibold text-foreground">
                {{ order.order_number }}
              </td>

              <td class="px-5 py-4">
                <p class="font-medium text-foreground">
                  {{ order.customer.name }}
                </p>
                <p class="text-xs text-muted-foreground">
                  {{ order.customer.email }}
                </p>
              </td>

              <td class="px-5 py-4 font-medium">
                {{ formatPrice(order.total_amount) }}
              </td>

              <!-- Only one displayed status -->
              <td class="px-5 py-4">
                <span
                  class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                  :class="statusClass(getDisplayStatus(order).status)"
                >
                  {{ getDisplayStatus(order).label }}
                </span>
              </td>

              <td class="px-5 py-4 text-muted-foreground">
                {{ formatDate(order.created_at) }}
              </td>

              <td class="px-5 py-4">
                <button
                  class="font-semibold text-primary hover:text-primary-hover"
                  @click="openOrder(order)"
                >
                  View details
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        class="flex items-center justify-between border-t border-border px-5 py-4 text-sm"
      >
        <span class="text-muted-foreground">
          {{ total }} total orders
        </span>

        <div class="flex items-center gap-3">
          <button
            :disabled="page <= 1"
            class="rounded-lg border px-3 py-2 disabled:opacity-40"
            @click="page--"
          >
            Previous
          </button>

          <span>{{ page }} / {{ totalPages }}</span>

          <button
            :disabled="page >= totalPages"
            class="rounded-lg border px-3 py-2 disabled:opacity-40"
            @click="page++"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- Order details modal -->
    <div
      v-if="selectedOrder"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-dark/50 p-4"
      @click.self="closeOrder"
    >
      <div
        class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-surface p-6 shadow-xl"
      >
        <div class="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 class="text-xl font-bold text-foreground">
              {{ selectedOrder.order_number }}
            </h2>

            <p class="text-sm text-muted-foreground">
              {{ selectedOrder.customer.name }}
            </p>

            <!-- Effective order status -->
            <span
              class="mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold"
              :class="statusClass(selectedOrderStatus.status)"
            >
              {{ selectedOrderStatus.label }}
            </span>
          </div>

          <button
            class="text-2xl text-muted-foreground hover:text-foreground"
            @click="closeOrder"
          >
            ×
          </button>
        </div>

        <!-- Items -->
        <h3 class="mb-3 font-semibold text-foreground">
          Order Items
        </h3>

        <div class="space-y-3">
          <div
            v-for="item in selectedOrder.items"
            :key="item.id"
            class="flex items-center gap-3 rounded-xl border border-border p-3"
          >
            <img
              v-if="item.image_url"
              :src="item.image_url"
              :alt="item.product_name"
              class="h-14 w-14 rounded-lg object-contain"
            />

            <div class="flex-1">
              <p class="text-sm font-medium">
                {{ item.product_name }}
              </p>

              <p class="text-xs text-muted-foreground">
                Qty: {{ item.quantity }}
              </p>
            </div>

            <span class="text-sm font-semibold">
              {{ formatPrice(item.unit_price * item.quantity) }}
            </span>
          </div>
        </div>

        <div class="mt-4 text-right font-bold">
          Total: {{ formatPrice(selectedOrder.total_amount) }}
        </div>

        <!-- Support tickets -->
        <div
          v-if="selectedOrder.support_tickets?.length"
          class="mt-6 border-t pt-5"
        >
          <h3 class="mb-3 font-semibold text-foreground">
            Support Tickets
          </h3>

          <div class="space-y-3">
            <div
              v-for="ticket in selectedOrder.support_tickets"
              :key="ticket.id"
              class="rounded-xl border border-border p-4"
            >
              <div
                class="flex flex-wrap items-start justify-between gap-3"
              >
                <div>
                  <p class="text-sm font-semibold text-foreground">
                    {{ ticket.subject }}
                  </p>

                  <p class="mt-1 text-xs text-muted-foreground">
                    {{ formatStatus(ticket.category) }}
                    · Ticket #{{ ticket.id }}
                  </p>
                </div>

                <span
                  class="rounded-full px-3 py-1 text-xs font-semibold"
                  :class="statusClass(ticket.status)"
                >
                  {{
                    refundReturnCategories.includes(
                      ticket.category?.toLowerCase()
                    )
                      ? refundReturnLabels[ticket.status] ||
                        formatStatus(ticket.status)
                      : formatStatus(ticket.status)
                  }}
                </span>
              </div>

              <p
                v-if="ticket.description"
                class="mt-3 whitespace-pre-line text-sm text-muted-foreground"
              >
                {{ ticket.description }}
              </p>

              <p class="mt-3 text-xs text-muted-foreground">
                Created {{ formatDate(ticket.created_at) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Delivery details -->
        <div v-if="selectedOrder.status !== 'cancelled'" class="mt-6 border-t pt-5">
          <h3 class="mb-3 font-semibold text-foreground">
            Delivery Details
          </h3>

          <template v-if="selectedOrder.delivery">
            <p class="text-sm text-foreground">
              {{ selectedOrder.delivery.recipient_name }}
            </p>

            <p class="text-sm text-muted-foreground">
              {{ selectedOrder.delivery.contact_number }}
            </p>

            <p class="mt-2 text-sm text-muted-foreground">
              {{ selectedOrder.delivery.address_line_1 }}
              {{ selectedOrder.delivery.address_line_2 }},
              {{ selectedOrder.delivery.barangay }},
              {{ selectedOrder.delivery.city }},
              {{ selectedOrder.delivery.province }}
              {{ selectedOrder.delivery.postal_code }}
            </p>

            <!-- Actual delivery status, kept separate -->
            <div class="mt-4">
              <p class="mb-2 text-xs font-medium text-muted-foreground">
                Delivery Progress
              </p>

              <span
                class="rounded-full px-3 py-1 text-xs font-semibold"
                :class="statusClass(selectedOrder.delivery.status)"
              >
                {{ formatStatus(selectedOrder.delivery.status) }}
              </span>
            </div>

            <!-- Ship order -->
            <div
              v-if="pendingCancellationTicket && selectedOrder.status !== 'cancelled'"
              class="mt-5 space-y-3 rounded-xl border border-orange-200 bg-orange-50 p-4"
            >
              <h4 class="font-semibold text-foreground">Cancellation Request</h4>
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  :disabled="saving"
                  class="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-on-primary hover:bg-red-700 disabled:opacity-50"
                  @click="decideCancellation('cancellation_accepted')"
                >
                  {{ saving ? 'Saving...' : 'Cancel Order' }}
                </button>
                <button
                  type="button"
                  :disabled="saving"
                  class="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground hover:bg-background disabled:opacity-50"
                  @click="decideCancellation('cancellation_declined')"
                >
                  {{ saving ? 'Saving...' : 'Reject Cancel Request' }}
                </button>
              </div>
            </div>

            <div
              v-else-if="selectedOrder.delivery.status === 'pending' && selectedOrder.status !== 'cancelled'"
              class="mt-5 space-y-3 rounded-xl bg-background p-4"
            >
              <h4 class="font-semibold">
                Ship Order
              </h4>

              <input
                v-model="courierName"
                placeholder="Courier name (optional)"
                class="w-full rounded-lg border border-border px-3 py-2 text-sm"
              />

              <input
                v-model="trackingNumber"
                placeholder="Tracking number (optional)"
                class="w-full rounded-lg border border-border px-3 py-2 text-sm"
              />

              <button
                :disabled="saving"
                class="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-50"
                @click="shipOrder"
              >
                {{ saving ? "Shipping..." : "Mark as Shipped" }}
              </button>
            </div>

            <!-- Advance delivery -->
            <div
              v-if="!pendingCancellationTicket && selectedOrder.status !== 'cancelled' && nextStatus(selectedOrder.delivery.status)"
              class="mt-5 rounded-xl bg-background p-4"
            >
              <button
                :disabled="saving"
                class="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-50"
                @click="
                  updateDeliveryStatus(
                    nextStatus(selectedOrder.delivery.status)
                  )
                "
              >
                {{
                  saving
                    ? "Updating..."
                    : `Mark as ${formatStatus(
                        nextStatus(selectedOrder.delivery.status)
                      )}`
                }}
              </button>
            </div>

            <p
              v-if="selectedOrder.delivery.status === 'delivered'"
              class="mt-4 text-sm text-muted-foreground"
            >
              Delivered. Waiting for customer receipt confirmation.
            </p>

            <p
              v-if="selectedOrder.delivery.status === 'received'"
              class="mt-4 text-sm font-medium text-green-700"
            >
              Customer confirmed receipt.
            </p>
          </template>

          <p v-else class="text-sm text-muted-foreground">
            No delivery record found for this order.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
