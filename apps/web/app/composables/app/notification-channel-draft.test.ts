import { describe, expect, it, vi } from 'vitest';
import { nextTick, reactive, ref } from 'vue';
import { useNotificationChannelDraft } from './notification-channel-draft';

/** Creates a local channel draft without a mounted form or network. */
function fixture() {
  const open = ref(false);
  const props = reactive({
    channel: null,
    browserPushAvailable: true,
    repositories: [],
    users: [],
    onSaved: vi.fn().mockResolvedValue(undefined),
  });
  const api = {
    notificationChannels: {
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      preview: vi.fn().mockResolvedValue({ data: { matches: [], status: 'NO_RESULTS' } }),
    },
  };
  const draft = useNotificationChannelDraft(
    props,
    open,
    /** Return stable untranslated keys. */ (key: string) => key,
    api as never,
  );
  return { draft, open, props, api };
}

describe('channel wizard', /** Groups step-validation and privacy regressions. */ () => {
  it('blocks invalid identity and destination but does not validate future steps', /** Tests step-local validation. */ async () => {
    const { draft, open } = fixture();
    open.value = true;
    await nextTick();
    expect(draft.nextStep()).toBe(false);
    draft.form.value.name = 'Operations';
    expect(draft.nextStep()).toBe(true);
    expect(draft.step.value).toBe(1);
    expect(draft.nextStep()).toBe(false);
    draft.form.value.type = 'GOTIFY';
    await nextTick();
    draft.form.value.serverUrl = 'https://gotify.example.test';
    draft.form.value.token = 'secret';
    expect(draft.nextStep()).toBe(true);
    expect(draft.nextStep()).toBe(false);
    draft.eventStates.value.ISSUE_OPENED.selected = true;
    expect(draft.nextStep()).toBe(true);
  });
  it('retains values on Back but clears incompatible destinations and closed secrets', /** Tests draft secret lifetime. */ async () => {
    const { draft, open } = fixture();
    open.value = true;
    await nextTick();
    draft.form.value.name = 'Operations';
    draft.form.value.token = 'secret';
    draft.step.value = 2;
    draft.back();
    expect(draft.form.value.name).toBe('Operations');
    draft.form.value.type = 'NTFY';
    await nextTick();
    expect(draft.form.value.token).toBe('');
    draft.form.value.password = 'secret';
    open.value = false;
    await nextTick();
    expect(draft.form.value.password).toBe('');
  });
});

it('invalidates in-flight preview without retaining pending or stale results', /** Checks revision-bound preview state. */ async () => {
  const { draft, open, api } = fixture();
  open.value = true;
  await nextTick();
  draft.form.value.name = 'Operations';
  draft.form.value.type = 'GOTIFY';
  await nextTick();
  draft.form.value.serverUrl = 'https://gotify.example.test';
  draft.form.value.token = 'hidden';
  draft.eventStates.value.WORKFLOW_RUN_FAILED.selected = true;
  await nextTick();
  let release!: (value: { data: { matches: never[]; status: string } }) => void;
  api.notificationChannels.preview.mockImplementationOnce(
    /** Retain a response from old rules. */ () =>
      new Promise(
        /** Capture obsolete preview completion. */ (resolve) => {
          release = resolve;
        },
      ),
  );
  const pending = draft.runPreview();
  expect(draft.previewing.value).toBe(true);
  draft.eventStates.value.WORKFLOW_RUN_FAILED.workflowPatterns = 'changed-*';
  await nextTick();
  expect(draft.previewing.value).toBe(false);
  release({ data: { matches: [], status: 'MATCHES' } });
  await pending;
  expect(draft.preview.value).toBeNull();
  expect(draft.previewStatus.value).toBeNull();
});

it('awaits the parent refresh and blocks duplicate final saves', /** Checks complete request lifetime. */ async () => {
  const { draft, open, api, props } = fixture();
  open.value = true;
  await nextTick();
  draft.form.value.name = 'Operations';
  draft.form.value.type = 'GOTIFY';
  await nextTick();
  draft.form.value.serverUrl = 'https://gotify.example.test';
  draft.form.value.token = 'hidden';
  draft.eventStates.value.ISSUE_OPENED.selected = true;
  let release!: () => void;
  props.onSaved.mockImplementationOnce(
    /** Hold the table refresh after persistence. */ () =>
      new Promise<void>(
        /** Release the complete save lifecycle. */ (resolve) => {
          release = resolve;
        },
      ),
  );
  draft.step.value = 3;
  const pending = draft.submit({ data: draft.form.value } as never);
  await Promise.resolve();
  await draft.submit({ data: draft.form.value } as never);
  expect(api.notificationChannels.create).toHaveBeenCalledOnce();
  expect(draft.submitting.value).toBe(true);
  expect(open.value).toBe(true);
  release();
  await pending;
  expect(draft.submitting.value).toBe(false);
  expect(open.value).toBe(false);
});

it('retries a failed parent refresh without creating the channel twice', /** Separates persistence from dependent UI refresh. */ async () => {
  const { draft, open, api, props } = fixture();
  open.value = true;
  await nextTick();
  draft.form.value.name = 'Operations';
  draft.form.value.type = 'GOTIFY';
  await nextTick();
  draft.form.value.serverUrl = 'https://gotify.example.test';
  draft.form.value.token = 'hidden';
  draft.eventStates.value.ISSUE_OPENED.selected = true;
  props.onSaved.mockRejectedValueOnce(new Error('refresh failed'));
  draft.step.value = 3;
  await draft.submit({ data: draft.form.value } as never);
  expect(draft.persisted.value).toBe(true);
  expect(draft.saveError.value).toBe(true);
  expect(open.value).toBe(true);
  await draft.submit({ data: draft.form.value } as never);
  expect(api.notificationChannels.create).toHaveBeenCalledOnce();
  expect(open.value).toBe(false);
});

it('resets hidden numeric destination errors when channel type changes', /** Avoids an invisible EMAIL port error on another transport. */ async () => {
  const { draft, open } = fixture();
  open.value = true;
  await nextTick();
  draft.form.value.name = 'Operations';
  draft.form.value.port = '' as never;
  draft.form.value.type = 'GOTIFY';
  await nextTick();
  draft.form.value.serverUrl = 'https://gotify.example.test';
  draft.form.value.token = 'hidden';
  expect(draft.nextStep()).toBe(true);
  expect(draft.nextStep()).toBe(true);
});

it('preserves stored credentials when editing without explicit replacement', /** Checks the write-only edit contract after extraction. */ async () => {
  const { draft, open, api, props } = fixture();
  props.channel = {
    id: 'existing-channel',
    name: 'Operations',
    type: 'GOTIFY',
    enabled: true,
    browserRecipients: [],
    eventSubscriptions: [{ eventType: 'ISSUE_OPENED', repositoryIds: [], workflowPatterns: [] }],
  } as never;
  open.value = true;
  await nextTick();
  expect(draft.form.value.type).toBe('GOTIFY');
  expect(draft.form.value.replaceConfiguration).toBe(false);
  expect(draft.nextStep()).toBe(true);
  expect(draft.nextStep()).toBe(true);
  expect(draft.nextStep()).toBe(true);
  await draft.submit({ data: draft.form.value } as never);
  expect(api.notificationChannels.create).not.toHaveBeenCalled();
  expect(api.notificationChannels.update).toHaveBeenCalledWith(
    'existing-channel',
    expect.objectContaining({ configuration: undefined }),
  );
});
