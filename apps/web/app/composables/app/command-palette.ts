/** Share command-palette visibility between the global modal and navbar trigger. */
export function useCommandPalette() {
  const open = useState<boolean>(
    'repovio.command-palette.open',
    /** Evaluates `false` when useState invokes this callback. */ () => false,
  );

  return {
    /** Closes close. */
    close: () => {
      open.value = false;
    },
    open,
    /** Opens the command palette with the requested initial search. */
    show: () => {
      open.value = true;
    },
  };
}
