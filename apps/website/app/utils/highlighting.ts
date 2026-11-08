import { createHighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';

let highlighter: ReturnType<typeof createHighlighterCore> | undefined;

/** Reuse one asynchronous Shiki highlighter for the supported code languages. */
export function getCodeHighlighter() {
  return (highlighter ??= createHighlighterCore({
    themes: [import('shiki/themes/github-light.mjs'), import('shiki/themes/github-dark.mjs')],
    langs: [
      import('shiki/langs/bash.mjs'),
      import('shiki/langs/json.mjs'),
      import('shiki/langs/yaml.mjs'),
      import('shiki/langs/dockerfile.mjs'),
      import('shiki/langs/dotenv.mjs'),
      import('shiki/langs/javascript.mjs'),
      import('shiki/langs/typescript.mjs'),
      import('shiki/langs/html.mjs'),
      import('shiki/langs/css.mjs'),
      import('shiki/langs/sql.mjs'),
      import('shiki/langs/markdown.mjs'),
    ],
    engine: createJavaScriptRegexEngine(),
  }));
}

/** Escape HTML-sensitive characters before rendering unhighlighted code. */
export function escapeCode(code: string) {
  return code.replace(
    /[&<>"']/g,
    /** Handle each code.replace callback invocation. */ (character) => {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]!;
    },
  );
}

/** Render escaped code when syntax highlighting is unavailable. */
export function plainCode(code: string) {
  return `<pre class="shiki"><code>${escapeCode(code)}</code></pre>`;
}

/** Highlight supported code safely, preserving a plain-code fallback on failure. */
export function highlightCode(
  highlighter: Awaited<ReturnType<typeof getCodeHighlighter>>,
  code: string,
  language = '',
) {
  const lang = language.trim().toLowerCase();
  if (!lang || !highlighter.getLoadedLanguages().includes(lang)) return plainCode(code);
  return highlighter.codeToHtml(code, {
    lang,
    themes: { light: 'github-light', dark: 'github-dark' },
    defaultColor: false,
  });
}
