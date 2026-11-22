<template>
  <Transition
    enter-active-class="transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none"
    leave-active-class="transition-[grid-template-rows,opacity] duration-200 ease-in motion-reduce:transition-none"
    enter-from-class="grid-rows-[0fr] opacity-0"
    leave-to-class="grid-rows-[0fr] opacity-0"
    enter-to-class="grid-rows-[1fr] opacity-100"
    leave-from-class="grid-rows-[1fr] opacity-100"
    @after-leave="emit('collapsed')"
  >
    <div v-show="expanded" :id="id" class="grid min-h-0" data-page-summary :inert="!expanded">
      <div class="min-h-0 overflow-auto">
        <slot />
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{ expanded: boolean; id: string }>();
const emit = defineEmits<{ collapsed: [] }>();
</script>
