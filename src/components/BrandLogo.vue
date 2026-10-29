<script setup>
import header from '../assets/logo/header.png'
import headerLight from '../assets/logo/header_light.png'
import logo from '../assets/logo/Voltech_logo.png'

defineProps({
  alt: { type: String, default: 'Voltech' },
  variant: { type: String, default: 'header' },
})
</script>

<template>
  <span class="inline-flex items-center">
    <img v-if="variant === 'logo'" :src="logo" :alt="alt" class="h-full w-auto" />
    <img v-else-if="variant === 'header-light'" :src="headerLight" :alt="alt" class="h-full w-auto" />
    <template v-else>
      <img :src="header" :alt="alt" class="brand-logo-day h-full w-auto" />
      <img :src="headerLight" :alt="alt" class="brand-logo-night h-full w-auto" />
    </template>
  </span>
</template>

<style>
.brand-logo-night { display: none; }
:root[data-theme="dark"] .brand-logo-day { display: none; }
:root[data-theme="dark"] .brand-logo-night { display: block; }
</style>
