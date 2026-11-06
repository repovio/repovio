import { describe, expect, it, vi } from 'vitest';

import { createShortcutBindings, globalShortcuts } from './shortcuts';

describe('global shortcuts', /** Groups scenarios for global shortcuts. */ () => {
  it('registers exactly the documented combinations and invokes their matching actions', /** Verifies registers exactly the documented combinations and invokes their matching actions. */ () => {
    expect(
      globalShortcuts
        .filter(/** Keeps entries matching `shortcut.id !== 'shortcuts'`. */ (shortcut) => shortcut.id !== 'shortcuts')
        .map(/** Projects each entry using `shortcut.action`. */ (shortcut) => shortcut.action),
    ).toEqual(['commandPalette.open', 'commandPalette.open']);
    const handlers = { search: vi.fn(), palette: vi.fn(), shortcuts: vi.fn() };
    const bindings = createShortcutBindings(handlers);
    expect(Object.keys(bindings)).toEqual(['/', 'meta_k', '?']);
    for (const shortcut of globalShortcuts) {
      bindings[shortcut.keys.join('_')]!();
      expect(handlers[shortcut.id]).toHaveBeenCalledTimes(1);
    }
  });
});
