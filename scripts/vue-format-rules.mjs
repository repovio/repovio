/** Check delimiter-line content that the standard span inline exception deliberately leaves alone. */
export const vueLayoutPlugin = {
  rules: {
    'multiline-tag-content-newline': {
      meta: {
        type: 'layout',
        schema: [],
        messages: {
          newline: 'End multiline tag delimiters on their own line; preserve significant inline text explicitly.',
        },
      },
      /** Report unsafe inline continuations without automatically changing significant whitespace. */
      create(context) {
        return context.sourceCode.parserServices.defineTemplateBodyVisitor({
          /** Require a standalone delimiter even for multiline spans and self-closing tags. */
          VStartTag(node) {
            if (node.loc.start.line === node.loc.end.line) return;
            const text = context.sourceCode.text;
            const end = text.indexOf('\n', node.range[1]);
            if (text.slice(node.range[1], end < 0 ? text.length : end).trim()) {
              context.report({ node, messageId: 'newline' });
            }
          },
        });
      },
    },
  },
};

/** Shared Vue layout rules used by lint and the canonical formatting pipeline. */
export const vueFormatRules = {
  'repovio/multiline-tag-content-newline': 'error',
  'vue/block-order': ['error', { order: ['template', 'script', 'style'] }],
  'vue/padding-line-between-blocks': ['error', 'always'],
  'vue/html-indent': [
    'error',
    2,
    { attribute: 1, baseIndent: 1, closeBracket: 0, alignAttributesVertically: true, ignores: [] },
  ],
  'vue/html-closing-bracket-newline': ['error', { singleline: 'never', multiline: 'always' }],
  'vue/multiline-html-element-content-newline': [
    'error',
    { ignoreWhenEmpty: true, ignores: ['span', 'pre', 'textarea'], allowEmptyLines: false },
  ],
  'vue/singleline-html-element-content-newline': [
    'error',
    { ignoreWhenNoAttributes: false, ignoreWhenEmpty: true, ignores: ['span', 'pre', 'textarea'] },
  ],
};
