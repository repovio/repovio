import type { DropdownMenuItem } from '#ui/types';

/** Expose the configured interface locales in the format used by layout controls. */
export const useLocales = () => {
  const { locale, locales, setLocale } = useI18n();

  const flagCountries: Record<string, string> = {
    en: 'gb',
    de: 'de',
    es: 'es',
    fr: 'fr',
    it: 'it',
    nl: 'nl',
    pl: 'pl',
    pt: 'pt',
  };

  const availableLocales = computed(() => locales.value as Array<{ code: typeof locale.value; name: string }>);

  /** Persist and activate the selected interface locale. */
  const handleSelectLocale = async (code: typeof locale.value): Promise<void> => {
    await setLocale(code);
  };

  const selectItems = computed(() =>
    availableLocales.value.map(({ code, name }) => ({
      avatar: {
        alt: '',
        src: `/flags/${flagCountries[code]}.svg`,
        class: 'h-[18px] w-6 rounded-xs bg-transparent',
        ui: { image: 'rounded-xs object-cover' },
      },
      label: name,
      value: code,
    })),
  );

  const dropdownMenuItems = computed<DropdownMenuItem[]>(() =>
    selectItems.value.map(({ avatar, label, value }) => ({
      avatar,
      checked: locale.value === value,
      label,
      onSelect: (event: Event) => {
        event.preventDefault();
        void handleSelectLocale(value);
      },
      type: 'checkbox',
    })),
  );

  return {
    availableLocales,
    dropdownMenuItems,
    handleSelectLocale,
    locale,
    selectItems,
  };
};
