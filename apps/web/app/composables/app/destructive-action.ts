import { CommonDialogsDestructiveAction } from '#components';

/** Optional context and safe error presentation for a destructive confirmation. */
export interface DestructiveActionOptions {
  description?: string;
  errorMessage?: (error: unknown) => string;
}

/** Open an accessible confirmation and retain the initiating element for focus restoration. */
export function useDestructiveAction() {
  const overlay = useOverlay();
  let active = false;

  /** Run only the confirmed operation, keeping errors inside the dialog for retry. */
  async function confirmDestructiveAction(
    target: string,
    action: () => Promise<unknown>,
    options: DestructiveActionOptions = {},
  ): Promise<void> {
    if (active) return;
    active = true;
    const trigger = document.activeElement;
    try {
      const dialog = overlay.create(CommonDialogsDestructiveAction, { destroyOnClose: true });
      await dialog.open({ target, action, ...options }).result;
    } finally {
      active = false;
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
    }
  }

  return { confirmDestructiveAction };
}
