/** Vue I18n options shared by every configured Repovio interface locale. */
export default defineI18nConfig(
  /** Evaluates `({ fallbackLocale: 'en', })` when defineI18nConfig invokes this callback. */ () => ({
    fallbackLocale: 'en',
  }),
);
