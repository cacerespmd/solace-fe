<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import { Check, Copy } from '@lucide/vue'

const props = defineProps<{ email: string }>()
const copied = ref(false)
const copying = ref(false)
const message = ref('')
let timer: ReturnType<typeof setTimeout> | undefined

async function copyEmail() {
  if (copying.value) return
  clearTimeout(timer)
  copying.value = true
  copied.value = false
  message.value = ''
  try {
    await navigator.clipboard.writeText(props.email)
    copied.value = true
    message.value = 'Email copied.'
    timer = setTimeout(() => { copied.value = false; message.value = '' }, 2500)
  } catch {
    message.value = 'Could not copy. Select and copy the email manually.'
  } finally {
    copying.value = false
  }
}

onUnmounted(() => clearTimeout(timer))
</script>

<template>
  <div>
    <div class="flex items-center gap-2">
      <a :href="`mailto:${email}`" class="min-w-0 break-all text-sm text-primary hover:underline">{{ email }}</a>
      <button
        type="button"
        :aria-label="`Copy email address ${email}`"
        :title="copied ? 'Copied!' : 'Copy email'"
        :disabled="copying"
        class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-primary-soft hover:text-primary disabled:opacity-60"
        @click="copyEmail"
      >
        <Check v-if="copied" :size="13" class="text-emerald-600" aria-hidden="true" />
        <Copy v-else :size="13" aria-hidden="true" />
      </button>
    </div>
    <p role="status" class="mt-1 text-xs text-muted-foreground">{{ message }}</p>
  </div>
</template>
