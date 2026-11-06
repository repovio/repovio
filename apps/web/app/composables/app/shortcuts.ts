/** Share shortcut-dialog visibility without registering additional keyboard listeners. */
export function useShortcuts() {
  const open = useState<boolean>(
    'repovio.shortcuts.open',
    /** Evaluates `false` when useState invokes this callback. */ () => false,
  );
  return { open };
}
