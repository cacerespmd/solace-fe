
<script setup>
import { computed, onMounted, ref } from "vue";
import { useAuthStore } from "../../stores/auth.js";

const auth = useAuthStore();

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const tickets = ref([]);
const loading = ref(false);
const saving = ref(false);
const error = ref("");
const search = ref("");
const statusFilter = ref("all");
const selectedTicket = ref(null);

const statusLabels = {
  cancellation_accepted: "Cancellation Approved",
  cancellation_declined: "Cancellation Rejected",
  open: "Open",
  in_process: "In Process",
  return_accepted: "Return Accepted",
  return_declined: "Return Declined",
  refund_accepted: "Refund Accepted",
  refund_declined: "Refund Declined",
  returned: "Returned",
  refunded: "Refunded",
};

const categoryLabels = {
  cancellation_request: "Cancellation Request",
  cancellation_requested: "Cancellation Request",
  general: "General",
  delivery_issue: "Delivery Issue",
  damaged_item: "Damaged Item",
  wrong_item: "Wrong Item",
  missing_item: "Missing Item",
  return_request: "Return Request",
  refund_request: "Refund Request",
};

const statusClasses = {
  cancellation_accepted: "bg-emerald-50 text-emerald-700",
  cancellation_declined: "bg-red-50 text-red-700",
  open: "bg-amber-50 text-amber-700",
  in_process: "bg-primary-soft text-primary-hover",
  return_accepted: "bg-emerald-50 text-emerald-700",
  refund_accepted: "bg-emerald-50 text-emerald-700",
  return_declined: "bg-red-50 text-red-700",
  refund_declined: "bg-red-50 text-red-700",
  returned: "bg-green-50 text-green-700",
  refunded: "bg-green-50 text-green-700",
};

const allStatuses = Object.keys(statusLabels);

const filteredTickets = computed(() => {
  const keyword = search.value.trim().toLowerCase();

  return tickets.value.filter((ticket) => {
    const matchesStatus =
      statusFilter.value === "all" ||
      ticket.status === statusFilter.value;

    const searchable = [
      ticket.id,
      ticket.customer_id,
      ticket.order_id,
      ticket.subject,
      ticket.description,
      ticket.category,
    ]
      .filter((value) => value !== null && value !== undefined)
      .join(" ")
      .toLowerCase();

    return matchesStatus && (!keyword || searchable.includes(keyword));
  });
});

const openCount = computed(
  () => tickets.value.filter((ticket) => ticket.status === "open").length
);

const inProcessCount = computed(
  () => tickets.value.filter((ticket) => ticket.status === "in_process").length
);

const completedCount = computed(
  () =>
    tickets.value.filter((ticket) =>
      ["returned", "refunded", "cancellation_accepted", "cancellation_declined"].includes(ticket.status)
    ).length
);

function nextStatuses(ticket) {
  if (!ticket) return [];

  if (["cancellation_request", "cancellation_requested"].includes(ticket.category)) {
    return ["open", "in_process", "cancellation_requested"].includes(ticket.status)
      ? ["cancellation_accepted", "cancellation_declined"]
      : [];
  }

  if (ticket.status === "open") {
    return ["in_process"];
  }

  if (ticket.status === "in_process") {
    const returnCategories = [
      "return_request",
      "damaged_item",
      "wrong_item",
      "missing_item",
    ];

    const refundCategories = [
      "refund_request",
      "damaged_item",
      "wrong_item",
      "missing_item",
    ];

    const options = [];

    if (returnCategories.includes(ticket.category)) {
      options.push("return_accepted", "return_declined");
    }

    if (refundCategories.includes(ticket.category)) {
      options.push("refund_accepted", "refund_declined");
    }

    return options;
  }

  if (ticket.status === "return_accepted") {
    return ["returned"];
  }

  if (ticket.status === "refund_accepted") {
    return ["refunded"];
  }

  return [];
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleString();
}

function getToken() {
  return auth.token;
}

async function fetchTickets() {
  loading.value = true;
  error.value = "";

  try {
    const response = await fetch(`${API_BASE}/api/admin/support-tickets`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Unable to load tickets (${response.status}).`);
    }

    tickets.value = await response.json();
  } catch (err) {
    error.value = err.message || "Unable to load support tickets.";
  } finally {
    loading.value = false;
  }
}

async function updateStatus(ticket, newStatus) {
  if (saving.value) return;

  const confirmed = window.confirm(
    `Change ticket #${ticket.id} to "${statusLabels[newStatus]}"?`
  );

  if (!confirmed) return;

  saving.value = true;
  error.value = "";

  try {
    const response = await fetch(
      `${API_BASE}/api/admin/support-tickets/${ticket.id}/status`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      }
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || "Unable to update ticket status.");
    }

    const updatedTicket = await response.json();

    tickets.value = tickets.value.map((item) =>
      item.id === updatedTicket.id ? updatedTicket : item
    );

    selectedTicket.value = updatedTicket;
  } catch (err) {
    error.value = err.message || "Unable to update ticket.";
  } finally {
    saving.value = false;
  }
}

onMounted(fetchTickets);
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-foreground">
          Support Tickets
        </h1>
        <p class="mt-1 text-sm text-muted-foreground">
          Review and manage customer concerns, returns, and refunds.
        </p>
      </div>

      <button
        class="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-background"
        :disabled="loading"
        @click="fetchTickets"
      >
        Refresh
      </button>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="stat in [
          { label: 'Total Tickets', value: tickets.length },
          { label: 'Open', value: openCount },
          { label: 'In Process', value: inProcessCount },
          { label: 'Completed', value: completedCount },
        ]"
        :key="stat.label"
        class="rounded-2xl border border-border bg-surface p-5"
      >
        <p class="text-sm text-muted-foreground">{{ stat.label }}</p>
        <p class="mt-2 text-3xl font-bold text-foreground">
          {{ stat.value }}
        </p>
      </div>
    </div>

    <div
      v-if="error"
      class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
    >
      {{ error }}
    </div>

    <div class="rounded-2xl border border-border bg-surface">
      <div class="flex flex-wrap gap-3 border-b border-border p-4">
        <input
          v-model="search"
          type="search"
          placeholder="Search tickets..."
          class="min-w-0 flex-1 rounded-xl border border-border px-4 py-2 text-sm outline-none focus:border-primary"
        />

        <select
          v-model="statusFilter"
          class="rounded-xl border border-border bg-surface px-4 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="all">All Statuses</option>
          <option
            v-for="status in allStatuses"
            :key="status"
            :value="status"
          >
            {{ statusLabels[status] }}
          </option>
        </select>
      </div>

      <div v-if="loading" class="p-10 text-center text-muted-foreground">
        Loading support tickets...
      </div>

      <div
        v-else-if="filteredTickets.length === 0"
        class="p-10 text-center text-muted-foreground"
      >
        No support tickets found.
      </div>

      <div v-else class="divide-y divide-border">
        <button
          v-for="ticket in filteredTickets"
          :key="ticket.id"
          type="button"
          class="flex w-full flex-wrap items-center justify-between gap-4 p-5 text-left transition hover:bg-background"
          @click="selectedTicket = ticket"
        >
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-xs font-semibold text-primary">
                #{{ ticket.id }}
              </span>

              <span
                class="rounded-full px-2.5 py-1 text-xs font-medium"
                :class="
                  statusClasses[ticket.status] ||
                  'bg-background text-muted-foreground'
                "
              >
                {{ statusLabels[ticket.status] || ticket.status }}
              </span>
            </div>

            <h3 class="mt-2 font-semibold text-foreground">
              {{ ticket.subject }}
            </h3>

            <p class="mt-1 text-sm text-muted-foreground">
              {{ categoryLabels[ticket.category] || ticket.category }}
              · Customer #{{ ticket.customer_id }}
              · Order #{{ ticket.order_id ?? 'N/A' }}
            </p>
          </div>

          <div class="text-right">
            <p class="text-xs text-muted-foreground">
              {{ formatDate(ticket.created_at) }}
            </p>
            <p class="mt-2 text-sm font-medium text-primary">
              View Details
            </p>
          </div>
        </button>
      </div>
    </div>

    <!-- Ticket details modal -->
    <div
      v-if="selectedTicket"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-dark/50 p-4"
      @click.self="selectedTicket = null"
    >
      <div
        class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-surface shadow-xl"
      >
        <div class="flex items-start justify-between border-b border-border p-6">
          <div>
            <p class="text-sm font-semibold text-primary">
              Ticket #{{ selectedTicket.id }}
            </p>
            <h2 class="mt-1 text-xl font-bold text-foreground">
              {{ selectedTicket.subject }}
            </h2>
          </div>

          <button
            class="rounded-lg p-2 text-muted-foreground hover:bg-background"
            aria-label="Close ticket details"
            @click="selectedTicket = null"
          >
            ✕
          </button>
        </div>

        <div class="space-y-6 p-6">
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <p class="text-xs text-muted-foreground">Customer</p>
              <p class="font-medium text-foreground">
                #{{ selectedTicket.customer_id }}
              </p>
            </div>

            <div>
              <p class="text-xs text-muted-foreground">Order</p>
              <p class="font-medium text-foreground">
                #{{ selectedTicket.order_id ?? 'N/A' }}
              </p>
            </div>

            <div>
              <p class="text-xs text-muted-foreground">Category</p>
              <p class="font-medium text-foreground">
                {{ categoryLabels[selectedTicket.category] || selectedTicket.category }}
              </p>
            </div>

            <div>
              <p class="text-xs text-muted-foreground">Priority</p>
              <p class="font-medium capitalize text-foreground">
                {{ selectedTicket.priority }}
              </p>
            </div>

            <div>
              <p class="text-xs text-muted-foreground">Status</p>
              <span
                class="mt-1 inline-block rounded-full px-3 py-1 text-xs font-medium"
                :class="
                  statusClasses[selectedTicket.status] ||
                  'bg-background text-muted-foreground'
                "
              >
                {{ statusLabels[selectedTicket.status] || selectedTicket.status }}
              </span>
            </div>

            <div>
              <p class="text-xs text-muted-foreground">Submitted</p>
              <p class="font-medium text-foreground">
                {{ formatDate(selectedTicket.created_at) }}
              </p>
            </div>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-semibold text-foreground">
              Customer Description
            </h3>

            <div class="whitespace-pre-wrap rounded-xl bg-background p-4 text-sm leading-6 text-foreground">
              {{ selectedTicket.description }}
            </div>
          </div>

          <div class="border-t border-border pt-5">
            <h3 class="mb-3 text-sm font-semibold text-foreground">
              Ticket Actions
            </h3>

            <div v-if="nextStatuses(selectedTicket).length" class="flex flex-wrap gap-2">
              <button
                v-for="nextStatus in nextStatuses(selectedTicket)"
                :key="nextStatus"
                type="button"
                :disabled="saving"
                class="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-surface hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                @click="updateStatus(selectedTicket, nextStatus)"
              >
                {{ saving ? 'Saving...' : nextStatus === 'cancellation_accepted' ? 'Cancel Order' : nextStatus === 'cancellation_declined' ? 'Reject Cancel Request' : statusLabels[nextStatus] }}
              </button>
            </div>

            <p v-else class="text-sm text-muted-foreground">
              No further status actions are available for this ticket.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
