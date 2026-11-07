<template>
  <UCard :ui="{ body: 'space-y-4' }">
    <template #header>
      <div>
        <h2 class="font-semibold">
          {{ $t('repositoryDetails.members') }}
        </h2>
        <p class="text-sm text-muted">
          {{ $t('repositoryDetails.membersDescription') }}
        </p>
      </div>
    </template>

    <UAlert
      v-if="error"
      color="error"
      icon="i-lucide-circle-alert"
      variant="subtle"
      :title="$t('repositoryDetails.saveError')"
    />
    <UForm
      class="flex flex-col gap-2 sm:flex-row"
      :schema="localizeFormSchema(membershipFormSchema, $t('forms.invalidValue'))"
      :state="form"
      @submit="addMember"
    >
      <UFormField name="userId" class="flex-1" :label="$t('repositoryDetails.user')" :ui="{ label: 'sr-only' }">
        <USelectMenu
          v-model="form.userId"
          class="w-full"
          value-key="value"
          :items="availableUserOptions"
          :placeholder="$t('repositoryDetails.memberPlaceholder')"
          searchable
        >
          <template #item-leading="{ item }">
            <CommonUserAvatar
              size="2xs"
              :avatar-updated-at="item.avatarUpdatedAt"
              :first-name="item.firstName"
              :last-name="item.lastName"
              :user-id="item.userId"
              :username="item.username"
            />
          </template>
        </USelectMenu>
      </UFormField>
      <UFormField name="role" :label="$t('repositoryDetails.role')" :ui="{ label: 'sr-only' }">
        <USelect v-model="form.role" class="w-full sm:w-48" :items="membershipRoleOptions" />
      </UFormField>
      <UButton
        type="submit"
        icon="i-lucide-user-plus"
        :aria-label="$t('repositoryDetails.addMember')"
        :disabled="!form.userId"
        :loading="adding"
      />
    </UForm>

    <UTable
      sticky
      :column-pinning="{ right: ['actions'] }"
      :columns="columns"
      :data="memberships"
      :empty="$t('repositoryDetails.noMembers')"
      :loading="loading"
    >
      <template #user-cell="{ row }">
        <div class="flex items-center gap-2">
          <CommonUserAvatar
            size="xs"
            :avatar-updated-at="row.original.user.avatarUpdatedAt"
            :first-name="row.original.user.firstName"
            :last-name="row.original.user.lastName"
            :user-id="row.original.user.id"
            :username="row.original.user.username"
          />
          <div class="min-w-0">
            <p class="truncate">
              {{ getUserDisplayName(row.original.user) }}
            </p>
            <p
              v-if="getUserDisplayName(row.original.user) !== row.original.user.username"
              class="truncate text-xs text-muted"
            >
              @{{ row.original.user.username }}
            </p>
          </div>
        </div>
      </template>
      <template #role-cell="{ row }">
        <UFormField
          :name="`memberRole.${row.original.userId}`"
          :error="invalidRoleUserId === row.original.userId ? $t('forms.invalidValue') : undefined"
        >
          <USelect
            class="w-44"
            :items="membershipRoleOptions"
            :disabled="isMembershipPending(row.original.userId)"
            :loading="isPending(memberActionKey('role', row.original.userId))"
            :model-value="row.original.role"
            @update:model-value="updateMemberRole(row.original, $event as RepositoryRole)"
          />
        </UFormField>
      </template>
      <template #actions-header="{ column }">
        <span class="flex justify-end">{{ column.columnDef.header }}</span>
      </template>
      <template #actions-cell="{ row }">
        <div class="flex justify-end">
          <UTooltip :portal="false" :text="$t('repositoryDetails.removeMember')">
            <span class="inline-flex">
              <UButton
                color="error"
                icon="i-lucide-user-minus"
                variant="ghost"
                :aria-label="$t('repositoryDetails.removeMember')"
                :disabled="isMembershipPending(row.original.userId)"
                :loading="isPending(memberActionKey('remove', row.original.userId))"
                @click="removeMember(row.original.userId)"
              />
            </span>
          </UTooltip>
        </div>
      </template>
    </UTable>
  </UCard>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import { ApiUpsertRepositoryMembershipSchema, localizeFormSchema } from '@repovio/schemas';
import { computed, onMounted, reactive, ref } from 'vue';
import { z } from 'zod';
import { useDestructiveAction } from '~/composables/app/destructive-action';

import { defineProps } from 'vue';
import { useRepovioApi } from '~/composables/api/repovio-api';
import { usePendingActions } from '~/composables/use-pending-actions';
import type { RepositoryMembership, RepositoryRole, User } from '~/types/api/resources';
import { getUserDisplayName, getUserIdentityLabel } from '~/utils/user-identity';

const { confirmDestructiveAction } = useDestructiveAction();
const props = defineProps<{
  repositoryId: string;
}>();

const { t } = useI18n();
const api = useRepovioApi();
const { isPending, run: runPendingAction } = usePendingActions();
const memberships = ref<RepositoryMembership[]>([]);
const users = ref<User[]>([]);
const loading = ref(true);
const adding = ref(false);
const error = ref(false);
const invalidRoleUserId = ref<string>();
const membershipFormSchema = computed(
  /** Derives membership form schema from the current reactive dependencies. */ () =>
    ApiUpsertRepositoryMembershipSchema.extend({
      userId: z
        .string({ /** Returns the localized validation error for this field. */ error: () => t('forms.invalidValue') })
        .min(1, { /** Returns the localized validation error for this field. */ error: () => t('forms.invalidValue') }),
    }),
);
type MembershipForm = z.output<typeof membershipFormSchema.value>;
const form = reactive<{ role: RepositoryRole; userId: string | undefined }>({ role: 'VIEWER', userId: undefined });
const membershipRoleOptions = computed(
  /** Derives membership role options from the current reactive dependencies. */ () => [
    { label: t('roles.VIEWER'), value: 'VIEWER' },
    { label: t('roles.MANAGER'), value: 'MANAGER' },
  ],
);
const availableUserOptions = computed(
  /** Derives available user options from the current reactive dependencies. */ () => {
    const memberIds = new Set(
      memberships.value.map(/** Projects each entry using `membership.userId`. */ (membership) => membership.userId),
    );
    return users.value
      .filter(
        /** Keeps entries matching `user.role !== 'SYSTEM_ADMIN' && !memberIds.has(user.id)`. */ (user) =>
          user.role !== 'SYSTEM_ADMIN' && !memberIds.has(user.id),
      )
      .map(
        /** Projects each entry using the availableUserOptions mapping. */ (user) => ({
          avatarUpdatedAt: user.avatarUpdatedAt,
          firstName: user.firstName,
          label: getUserIdentityLabel(user),
          lastName: user.lastName,
          userId: user.id,
          username: user.username,
          value: user.id,
        }),
      );
  },
);
const columns = computed(
  /** Derives columns from the current reactive dependencies. */ () => [
    { accessorKey: 'user.username', header: t('repositoryDetails.user'), id: 'user' },
    { accessorKey: 'role', header: t('repositoryDetails.role') },
    { id: 'actions', header: t('repositoryDetails.actions') },
  ],
);

/** Build a unique pending-state key for one membership action. */
function memberActionKey(action: 'remove' | 'role', userId: string): string {
  return `${action}:${userId}`;
}

/** Return whether a membership mutation is active for a user row. */
function isMembershipPending(userId: string): boolean {
  return isPending(memberActionKey('remove', userId)) || isPending(memberActionKey('role', userId));
}

/** Load the user pool and explicit access records required by the member table. */
async function load(): Promise<void> {
  loading.value = true;
  error.value = false;
  try {
    const [membershipsResponse, usersResponse] = await Promise.all([
      api.repositories.listMemberships(props.repositoryId),
      api.users.list(),
    ]);
    memberships.value = membershipsResponse.data;
    users.value = usersResponse.data.items;
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
}

/** Grant the selected system user explicit repository access. */
async function addMember(event: FormSubmitEvent<MembershipForm>): Promise<void> {
  adding.value = true;
  error.value = false;
  try {
    const { data } = await api.repositories.upsertMembership(props.repositoryId, event.data.userId, {
      role: event.data.role,
    });
    memberships.value = [...memberships.value, data].sort(
      /** Orders entries using `left.user.username.localeCompare(right.user.username)`. */ (left, right) =>
        left.user.username.localeCompare(right.user.username),
    );
    form.userId = undefined;
    form.role = 'VIEWER';
  } catch {
    error.value = true;
  } finally {
    adding.value = false;
  }
}

/** Change a repository member's explicit access role. */
async function updateMemberRole(membership: RepositoryMembership, role: RepositoryRole): Promise<void> {
  const input = ApiUpsertRepositoryMembershipSchema.safeParse({ role });
  if (!input.success) {
    invalidRoleUserId.value = membership.userId;
    return;
  }
  invalidRoleUserId.value = undefined;
  await runPendingAction(
    memberActionKey('role', membership.userId),
    /** Performs update member role while retaining the initiating action’s pending state. */ async () => {
      error.value = false;
      try {
        const { data } = await api.repositories.upsertMembership(props.repositoryId, membership.userId, input.data);
        memberships.value = memberships.value.map(
          /** Projects each entry using `(current.id === membership.id ? data : current)`. */ (current) =>
            current.id === membership.id ? data : current,
        );
      } catch {
        error.value = true;
      }
    },
  );
}

/** Revoke explicit repository access from one user. */
async function removeMember(userId: string): Promise<void> {
  await confirmDestructiveAction(
    memberships.value.find(/** Find the affected member. */ (member) => member.userId === userId)?.user.username ??
      userId,
    /** Perform the confirmed action and await its dependent UI updates. */ async () => {
      await runPendingAction(
        memberActionKey('remove', userId),
        /** Performs remove member while retaining the initiating action’s pending state. */ async () => {
          error.value = false;
          try {
            await api.repositories.deleteMembership(props.repositoryId, userId);
            memberships.value = memberships.value.filter(
              /** Keeps entries matching `membership.userId !== userId`. */ (membership) =>
                membership.userId !== userId,
            );
          } catch (cause) {
            error.value = true;
            throw cause;
          }
        },
      );
    },
  );
}

onMounted(/** Initializes component subscriptions and data after mounting. */ () => void load());
</script>
