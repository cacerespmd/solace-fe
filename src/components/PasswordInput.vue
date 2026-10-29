<script setup>
import { ref } from 'vue'
import { Eye, EyeOff } from '@lucide/vue'

defineOptions({ inheritAttrs: false })
const model = defineModel({ type: String, default: '' })
const visible = ref(false)
</script>

<template>
  <div class="relative">
    <input
      v-bind="$attrs"
      v-model="model"
      :type="visible ? 'text' : 'password'"
      style="padding-right: 3rem"
    />
    <button
      type="button"
      :aria-label="visible ? 'Hide password' : 'Show password'"
      :aria-pressed="visible"
      :aria-controls="$attrs.id"
      class="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-lg text-muted-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
      @click="visible = !visible"
    >
      <component
        :is="visible ? EyeOff : Eye"
        :size="20"
        :stroke-width="1.75"
        aria-hidden="true"
      />
    </button>
  </div>
</template>
