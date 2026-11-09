/** Create a typed native Nuxt UI row handler without replacing link or embedded-control behavior. */
export function useTableRowNavigation<T>(
  destination: (item: T) => string,
): (event: Event, row: { original: T }) => Promise<void> {
  return /** Ignore custom interactive descendants that native Nuxt UI does not recognize itself. */ async (
    event: Event,
    row: { original: T },
  ): Promise<void> => {
    if (
      typeof Element !== 'undefined' &&
      event.target instanceof Element &&
      event.target.closest(
        '[data-row-navigation-ignore], [contenteditable]:not([contenteditable="false"]), [role="button"], [role="checkbox"], [role="radio"], [role="switch"], [role="link"], [role="textbox"], [role="combobox"], [role="menuitem"], [role="slider"], [role="tab"]',
      )
    )
      return;
    await navigateTo(destination(row.original));
  };
}
