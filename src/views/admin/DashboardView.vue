
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import api from "../../api/axios.js";
import { useAuthStore } from "../../stores/auth.js";

const auth = useAuthStore();

type Product = {
  id: number;
  name?: string;
  stock?: number;
  stock_quantity?: number;
  quantity?: number;
};

type SupportTicket = {
  id: number;
  status: string;
};

type DashboardStat = {
  label: string;
  value: string;
  description: string;
  path: string;
};

const LOW_STOCK_THRESHOLD = 5;

const loading = ref(true);
const error = ref("");

const totalProducts = ref<number | null>(null);
const totalOrders = ref<number | null>(null);
const openTickets = ref<number | null>(null);
const lowStockProducts = ref<number | null>(null);

const recentOrders = ref<any[]>([]);
const recentTickets = ref<SupportTicket[]>([]);

function headers() {
  return {
    Authorization: `Bearer ${auth.token}`,
  };
}

function formatNumber(value: number | null) {
  return value === null ? "—" : value.toLocaleString("en-PH");
}

function formatStatus(value?: string) {
  return String(value || "unknown")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value?: string) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPrice(value: unknown) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(value ?? 0));
}

function getProductStock(product: Product) {
  return Number(
    product.stock_quantity ??
    product.stock ??
    product.quantity ??
    0
  );
}

function getArray(data: any, keys: string[]) {
  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }

    if (Array.isArray(data?.data?.[key])) {
      return data.data[key];
    }
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

function getTotal(data: any, fallback: number) {
  const total =
    data?.total ??
    data?.total_count ??
    data?.pagination?.total ??
    data?.meta?.total ??
    data?.data?.total;

  return total !== undefined && total !== null
    ? Number(total)
    : fallback;
}

const stats = computed<DashboardStat[]>(() => [
  {
    label: "Total Products",
    value: formatNumber(totalProducts.value),
    description: "Products in your catalog",
    path: "/admin/products",
  },
  {
    label: "Total Orders",
    value: formatNumber(totalOrders.value),
    description: "Customer orders placed",
    path: "/admin/orders",
  },
  {
    label: "Open Tickets",
    value: formatNumber(openTickets.value),
    description: "Tickets requiring attention",
    path: "/admin/support-tickets",
  },
  {
    label: "Low Stock Products",
    value: formatNumber(lowStockProducts.value),
    description: `Products with ${LOW_STOCK_THRESHOLD} or fewer units`,
    path: "/admin/products",
  },
]);

async function loadProducts() {
  const response = await api.get("/api/products", {
    headers: headers(),
    params: {
      page: 1,
      per_page: 100,
    },
  });

  const data = response.data;
  const products: Product[] = getArray(data, ["products", "items"]);

  totalProducts.value = getTotal(data, products.length);

  // Only calculate this when the full product list is available.
  if (totalProducts.value <= products.length) {
    lowStockProducts.value = products.filter(
      (product) => getProductStock(product) <= LOW_STOCK_THRESHOLD
    ).length;
  }
}

async function loadOrders() {
  const response = await api.get("/api/admin/orders", {
    headers: headers(),
    params: {
      page: 1,
      per_page: 5,
    },
  });

  const data = response.data;
  const orders = getArray(data, ["orders", "items"]);

  totalOrders.value = getTotal(data, orders.length);
  recentOrders.value = orders.slice(0, 5);
}

async function loadTickets() {
  const response = await api.get("/api/admin/support-tickets", {
    headers: headers(),
  });

  const data = response.data;
  const tickets: SupportTicket[] = getArray(data, [
    "tickets",
    "support_tickets",
    "items",
  ]);

  // Count unresolved tickets.
  openTickets.value = tickets.filter((ticket) =>
    ["open", "in_process"].includes(
      String(ticket.status || "").toLowerCase()
    )
  ).length;

  recentTickets.value = [...tickets]
    .sort((a: any, b: any) =>
      new Date(b.created_at || 0).getTime() -
      new Date(a.created_at || 0).getTime()
    )
    .slice(0, 5);
}

async function fetchDashboard() {
  loading.value = true;
  error.value = "";

  const results = await Promise.allSettled([
    loadProducts(),
    loadOrders(),
    loadTickets(),
  ]);

  const failed = results
    .map((result, index) =>
      result.status === "rejected"
        ? ["products", "orders", "support tickets"][index]
        : null
    )
    .filter(Boolean);

  if (failed.length) {
    error.value = `Could not load ${failed.join(", ")}. Check the corresponding API endpoints.`;
  }

  loading.value = false;
}

onMounted(fetchDashboard);
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">Store overview</p>
        <h1 class="text-2xl font-semibold tracking-tight text-foreground">
          A look at your store
        </h1>

        <p class="mt-1 text-sm text-muted-foreground">
          Keep up with your products, orders, and customer requests.
        </p>
      </div>

      <button
        type="button"
        :disabled="loading"
        class="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-background disabled:opacity-50"
        @click="fetchDashboard"
      >
        {{ loading ? "Refreshing..." : "Refresh Dashboard" }}
      </button>
    </div>

    <!-- Error -->
    <div
      v-if="error"
      class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
    >
      {{ error }}
    </div>

    <!-- Stats -->
    <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <RouterLink
        v-for="stat in stats"
        :key="stat.label"
        :to="stat.path"
        class="rounded-2xl border border-border bg-surface p-6 transition hover:border-primary-border hover:shadow-sm"
      >
        <p class="text-sm font-medium text-muted-foreground">
          {{ stat.label }}
        </p>

        <h2 class="mt-3 text-3xl font-bold text-foreground">
          {{ loading && stat.value === "—" ? "..." : stat.value }}
        </h2>

        <p class="mt-2 text-xs text-muted-foreground">
          {{ stat.description }}
        </p>
      </RouterLink>
    </div>

    <!-- Overview -->
    <div class="grid gap-6 xl:grid-cols-2">
      <!-- Recent Orders -->
      <div
        class="overflow-hidden rounded-2xl border border-border bg-surface"
      >
        <div
          class="flex items-center justify-between border-b border-border px-6 py-5"
        >
          <div>
            <h2 class="font-semibold text-foreground">
              Recent Orders
            </h2>

            <p class="mt-1 text-xs text-muted-foreground">
              Latest customer purchases
            </p>
          </div>

          <RouterLink
            to="/admin/orders"
            class="text-sm font-semibold text-primary hover:text-primary-hover"
          >
            View All
          </RouterLink>
        </div>

        <div v-if="loading" class="p-6 text-sm text-muted-foreground">
          Loading orders...
        </div>

        <div
          v-else-if="!recentOrders.length"
          class="p-6 text-sm text-muted-foreground"
        >
          No orders available.
        </div>

        <div v-else class="divide-y divide-border">
          <div
            v-for="order in recentOrders"
            :key="order.id"
            class="flex items-center justify-between gap-4 px-6 py-4"
          >
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-foreground">
                {{ order.order_number }}
              </p>

              <p class="mt-1 text-xs text-muted-foreground">
                {{ order.customer?.name || "Customer" }}
                · {{ formatDate(order.created_at) }}
              </p>

              <span
                class="mt-2 inline-block rounded-full bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground"
              >
                {{
                  order.display_status?.label ||
                  formatStatus(order.status)
                }}
              </span>
            </div>

            <p class="shrink-0 text-sm font-semibold text-foreground">
              {{ formatPrice(order.total_amount) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Recent Support Tickets -->
      <div
        class="overflow-hidden rounded-2xl border border-border bg-surface"
      >
        <div
          class="flex items-center justify-between border-b border-border px-6 py-5"
        >
          <div>
            <h2 class="font-semibold text-foreground">
              Recent Support Tickets
            </h2>

            <p class="mt-1 text-xs text-muted-foreground">
              Customer support requests
            </p>
          </div>

          <RouterLink
            to="/admin/support-tickets"
            class="text-sm font-semibold text-primary hover:text-primary-hover"
          >
            View All
          </RouterLink>
        </div>

        <div v-if="loading" class="p-6 text-sm text-muted-foreground">
          Loading tickets...
        </div>

        <div
          v-else-if="!recentTickets.length"
          class="p-6 text-sm text-muted-foreground"
        >
          No support tickets available.
        </div>

        <div v-else class="divide-y divide-border">
          <div
            v-for="ticket in recentTickets"
            :key="ticket.id"
            class="flex items-center justify-between gap-4 px-6 py-4"
          >
            <div class="min-w-0">
              <p class="text-sm font-semibold text-foreground">
                Ticket #{{ ticket.id }}
              </p>

              <p class="mt-1 text-xs text-muted-foreground">
                {{ formatStatus((ticket as any).category) }}
              </p>
            </div>

            <span
              class="shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
              :class="
                ticket.status === 'open'
                  ? 'bg-amber-50 text-amber-700'
                  : ticket.status === 'in_process'
                    ? 'bg-primary-soft text-primary-hover'
                    : 'bg-background text-muted-foreground'
              "
            >
              {{ formatStatus(ticket.status) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="rounded-2xl border border-border bg-surface p-6">
      <h2 class="text-lg font-semibold text-foreground">
        Quick Actions
      </h2>

      <p class="mt-1 text-sm text-muted-foreground">
        Manage your store and customer support.
      </p>

      <div class="mt-5 flex flex-wrap gap-3">
        <RouterLink
          to="/admin/products"
          class="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary hover:bg-primary-hover"
        >
          Manage Products
        </RouterLink>

        <RouterLink
          to="/admin/orders"
          class="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-background"
        >
          Manage Orders
        </RouterLink>

        <RouterLink
          to="/admin/support-tickets"
          class="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-background"
        >
          Support Tickets
        </RouterLink>
      </div>
    </div>
  </div>
</template>
