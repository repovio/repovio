import type { DropdownMenuItem } from '#ui/types';
import { h } from 'vue';

import { getAppLocale } from '../../../shared/locales';

/**
 * Expose the configured interface locales in the format used by layout controls.
 * @param onError Close the initiating overlay before presenting accessible failure feedback.
 */
export const useLocales = (onError?: () => void) => {
  const { getLocaleMessage, locale, locales, setLocale, setLocaleCookie, t } = useI18n();
  const isChangingLocale = useState<boolean>(
    'repovio-changing-locale',
    /** Initialize the shared selection transaction as idle. */ () => false,
  );
  const toast = useToast();

  const availableLocales = computed(
    /** Derives available locales from the current reactive dependencies. */ () =>
      locales.value as Array<{ code: typeof locale.value; name: string }>,
  );

  /** Persist and activate the selected interface locale. */
  const handleSelectLocale = async (code: typeof locale.value): Promise<void> => {
    if (isChangingLocale.value || code === locale.value) return;
    const previous = locale.value;
    isChangingLocale.value = true;
    try {
      await setLocale(code);
      // Nuxt i18n logs download errors internally instead of rejecting its locale setter.
      if (!Object.keys(getLocaleMessage(code)).length) throw new Error('Locale messages are unavailable.');
    } catch {
      try {
        await setLocale(previous);
      } catch {
        // Retain a usable UI and cookie even if a navigation or locale hook also rejects rollback.
        locale.value = previous;
        setLocaleCookie(previous);
      }
      onError?.();
      toast.add({
        color: 'error',
        // Keep this error accessible even when the toast library's transient announcer is hidden.
        title: /** Render a persistent live message inside the visible error toast. */ () =>
          h('span', { role: 'alert' }, t('layout.localeChangeError')),
      });
    } finally {
      isChangingLocale.value = false;
    }
  };

  const selectItems = computed(
    /** Derives select items from the current reactive dependencies. */ () =>
      availableLocales.value.map(
        /** Projects each entry using the selectItems mapping. */ ({ code, name }) => ({
          avatar: {
            alt: '',
            src: `/flags/${getAppLocale(code).flagCountry}.svg`,
            class: 'h-[18px] w-6 rounded-xs bg-transparent',
            ui: { image: 'rounded-xs object-cover' },
          },
          label: name,
          value: code,
        }),
      ),
  );

  const dropdownMenuItems = computed<DropdownMenuItem[]>(
    /** Derives dropdown menu items from the current reactive dependencies. */ () =>
      selectItems.value.map(
        /** Projects each entry using `({ avatar, checked: locale.value === value, label, onSelect: (event: Event) => { event.preventDefault(); void handleSelectLocale(value); }, type: 'checkbox', })`. */ ({
          avatar,
          label,
          value,
        }) => ({
          avatar,
          checked: locale.value === value,
          disabled: isChangingLocale.value,
          label,
          /** Runs the selected menu action. */
          onSelect: (event: Event) => {
            event.preventDefault();
            void handleSelectLocale(value);
          },
          type: 'checkbox',
        }),
      ),
  );

  return {
    availableLocales,
    dropdownMenuItems,
    handleSelectLocale,
    isChangingLocale,
    locale,
    selectItems,
  };
};
