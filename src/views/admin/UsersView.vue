<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight, LoaderCircle, RefreshCw, Search, Users, X } from '@lucide/vue'
import api from '../../api/axios'
import EmailCopy from '../../components/EmailCopy.vue'

interface Customer {
  id: number
  name: string
  email: string
  created_at: string
  orders_count: number
}

const customers = ref<Customer[]>([])
const search = ref('')
const page = ref(1)
const perPage = ref(10)
const total = ref(0)
const loading = ref(true)
const error = ref('')
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / perPage.value)))
let controller: AbortController | undefined
let timer: ReturnType<typeof setTimeout> | undefined
let requestId = 0

async function loadUsers(targetPage = page.value) {
  clearTimeout(timer)
  controller?.abort()
  controller = new AbortController()
  const id = ++requestId
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/api/admin/customers', {
      params: { search: search.value.trim() || undefined, page: targetPage, per_page: perPage.value },
      signal: controller.signal,
    })
    if (id !== requestId) return
    customers.value = data.customers
    total.value = data.total
    page.value = data.page
  } catch (err: any) {
    if (id !== requestId || err.code === 'ERR_CANCELED') return
    const detail = err.response?.data?.detail
    error.value = typeof detail === 'string' ? detail : 'Unable to load users. Please try again.'
  } finally {
    if (id === requestId) loading.value = false
  }
}

watch(search, () => {
  clearTimeout(timer)
  controller?.abort()
  requestId++
  loading.value = true
  error.value = ''
  timer = setTimeout(() => loadUsers(1), 300)
})

function formatDate(value: string) {
  if (!value) return 'Not available'
  const date = new Date(value.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(value) ? value : `${value}Z`)
  return Number.isNaN(date.getTime()) ? 'Not available' : new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium' }).format(date)
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join('').toUpperCase() || '?'
}

onMounted(() => loadUsers())
onUnmounted(() => {
  clearTimeout(timer)
  requestId++
  controller?.abort()
})
</script>

<template>
  <div>
    <div class="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">Customer directory</p>
        <h1 class="text-3xl font-semibold tracking-tight text-foreground">Users</h1>
        <p class="mt-2 text-sm text-muted-foreground">View registered customers and their account information.</p>
      </div>
      <button type="button" :disabled="loading" class="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-60" @click="loadUsers()">
        <RefreshCw :size="16" aria-hidden="true" /> Refresh
      </button>
    </div>

    <section aria-label="Registered users" :aria-busy="loading" class="overflow-hidden rounded-2xl border border-border bg-surface">
      <div class="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div class="relative w-full sm:max-w-md">
          <label for="user-search" class="sr-only">Search users by name or email</label>
          <Search :size="18" class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input id="user-search" v-model="search" type="search" placeholder="Search by name or email..." class="min-h-11 w-full border border-border bg-background/60 py-3 pl-11 pr-12 text-sm text-foreground outline-none [&::-webkit-search-cancel-button]:appearance-none" />
          <button v-if="search" type="button" aria-label="Clear user search" class="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-muted-foreground hover:text-primary" @click="search = ''"><X :size="17" aria-hidden="true" /></button>
        </div>
        <p role="status" class="text-xs text-muted-foreground">{{ loading ? 'Loading users…' : error ? 'Users unavailable' : `${total} ${total === 1 ? 'user' : 'users'}${search.trim() ? ' found' : ' registered'}` }}</p>
      </div>

      <div v-if="loading" class="flex items-center justify-center gap-3 px-6 py-20 text-sm text-muted-foreground">
        <LoaderCircle :size="22" class="animate-spin motion-reduce:animate-none" aria-hidden="true" /> Loading customer accounts…
      </div>
      <div v-else-if="error" role="alert" class="m-6 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-600">
        {{ error }}
        <button type="button" class="ml-2 rounded font-semibold underline" @click="loadUsers()">Try again</button>
      </div>
      <div v-else-if="!customers.length" class="px-6 py-20 text-center">
        <Users :size="32" class="mx-auto mb-4 text-primary" aria-hidden="true" />
        <h2 class="text-lg font-semibold text-foreground">{{ search.trim() ? 'No matching users' : 'No users yet' }}</h2>
        <p class="mt-2 text-sm text-muted-foreground">{{ search.trim() ? 'Try a different name or email address.' : 'Customer accounts will appear here after registration.' }}</p>
        <button v-if="search" type="button" class="mt-4 rounded-lg px-4 py-2 text-sm font-semibold text-primary hover:bg-primary-soft" @click="search = ''">Clear search</button>
      </div>
      <template v-else>
        <div class="hidden overflow-x-auto md:block">
          <table class="w-full text-left text-sm">
            <thead class="bg-background text-muted-foreground"><tr><th scope="col" class="px-6 py-4">Customer</th><th scope="col" class="px-6 py-4">Email address</th><th scope="col" class="px-6 py-4">User ID</th><th scope="col" class="px-6 py-4">Orders</th><th scope="col" class="px-6 py-4">Joined</th></tr></thead>
            <tbody class="divide-y divide-border">
              <tr v-for="customer in customers" :key="customer.id">
                <td class="px-6 py-5"><div class="flex items-center gap-3"><span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-xs font-semibold text-primary" aria-hidden="true">{{ initials(customer.name) }}</span><span class="max-w-xs break-words font-semibold text-foreground">{{ customer.name }}</span></div></td>
                <td class="px-6 py-5"><EmailCopy :email="customer.email" /></td>
                <td class="px-6 py-5 text-muted-foreground">#{{ customer.id }}</td>
                <td class="px-6 py-5"><span class="inline-flex min-w-9 items-center justify-center rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold tabular-nums text-primary">{{ customer.orders_count ?? '—' }}</span></td>
                <td class="whitespace-nowrap px-6 py-5 text-muted-foreground">{{ formatDate(customer.created_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="divide-y divide-border md:hidden">
          <article v-for="customer in customers" :key="customer.id" class="p-5">
            <div class="flex items-center gap-3"><span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-xs font-semibold text-primary" aria-hidden="true">{{ initials(customer.name) }}</span><div class="min-w-0"><h2 class="break-words text-sm font-semibold text-foreground">{{ customer.name }}</h2><p class="mt-1 text-xs text-muted-foreground">User #{{ customer.id }}</p></div></div>
            <EmailCopy :email="customer.email" class="mt-4" />
            <p class="mt-3 text-sm font-medium text-foreground">{{ customer.orders_count ?? '—' }} {{ customer.orders_count === 1 ? 'order' : 'orders' }}</p>
            <p class="mt-2 text-xs text-muted-foreground">Joined {{ formatDate(customer.created_at) }}</p>
          </article>
        </div>
      </template>

      <div v-if="!error" class="flex flex-wrap items-center justify-between gap-4 border-t border-border px-4 py-4 sm:px-6">
        <label class="flex items-center gap-2 text-xs text-muted-foreground">Users per page
          <select v-model.number="perPage" :disabled="loading" class="min-h-11 border border-border bg-background px-3 text-sm text-foreground disabled:opacity-60" @change="loadUsers(1)"><option :value="10">10</option><option :value="25">25</option><option :value="50">50</option></select>
        </label>
        <div class="flex items-center gap-2">
          <button type="button" aria-label="Previous page" :disabled="loading || page <= 1" class="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-foreground hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-40" @click="loadUsers(page - 1)"><ChevronLeft :size="18" aria-hidden="true" /></button>
          <span class="px-2 text-xs text-muted-foreground">Page {{ page }} of {{ totalPages }}</span>
          <button type="button" aria-label="Next page" :disabled="loading || page >= totalPages" class="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-foreground hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-40" @click="loadUsers(page + 1)"><ChevronRight :size="18" aria-hidden="true" /></button>
        </div>
      </div>
    </section>
  </div>
</template>
