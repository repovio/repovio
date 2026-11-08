<template>
  <figure class="rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:p-10">
    <ol class="grid gap-6 md:grid-cols-3">
      <li v-for="(step, index) in steps" :key="step.icon" class="rounded-xl border border-default bg-default p-6">
        <div class="flex items-center justify-between text-primary">
          <UIcon class="size-7" :name="step.icon" />
          <span aria-hidden="true" class="text-sm font-mono">0{{ index + 1 }}</span>
        </div>
        <p class="mt-5 font-semibold">
          {{ t(step.key) }}
        </p>
      </li>
    </ol>
    <figcaption class="mt-6 text-sm leading-7 text-muted">
      {{ t('product_mcpFlowNote') }}
    </figcaption>
  </figure>
</template>

<script setup lang="ts">
const { t } = useI18n();
const steps = [
  { icon: 'i-lucide-terminal', key: 'product_mcpClient' },
  { icon: 'i-lucide-key-round', key: 'product_mcpAuth' },
  { icon: 'i-lucide-database', key: 'product_mcpData' },
];
</script>
