<template>
  <UAvatar :alt="identityLabel" :size="size" :src="source" :text="initials" />
</template>

<script setup lang="ts">
import type { AvatarProps } from '#ui/components/Avatar.vue';
import { computed, ref, watch } from 'vue';

import { defineProps, withDefaults } from 'vue';
import { useAvatarImages } from '~/composables/app/avatar-images';
import { getUserIdentityLabel, getUserInitials } from '~/utils/user-identity';

const props = withDefaults(
  defineProps<{
    avatarSource?: 'LOCAL' | 'OIDC' | null;
    avatarUpdatedAt?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    size?: AvatarProps['size'];
    userId: string;
    username: string;
  }>(),
  { size: 'md' },
);

const { load } = useAvatarImages();
const source = ref<string>();
const identityLabel = computed(
  /** Derives identity label from the current reactive dependencies. */ () => getUserIdentityLabel(props),
);
const initials = computed(/** Derives initials from the current reactive dependencies. */ () => getUserInitials(props));
let loadSequence = 0;

watch(
  /** Reads the reactive dependencies observed by this watcher. */
  () => [props.userId, props.avatarUpdatedAt, props.avatarSource] as const,
  /** Synchronizes user avatar when the observed state changes. */
  async ([userId, avatarUpdatedAt, avatarSource]) => {
    const sequence = ++loadSequence;
    const loadedSource = await load(userId, avatarUpdatedAt, avatarSource);
    if (sequence === loadSequence) source.value = loadedSource;
  },
  { immediate: true },
);
</script>
