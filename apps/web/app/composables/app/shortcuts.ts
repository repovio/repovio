/** Share shortcut-dialog visibility without registering additional keyboard listeners. */
export function useShortcuts() {
  const open = useState<boolean>('repovio.shortcuts.open', () => false);
  return { open };
}
