import { z } from 'zod';

/** Keep field paths and parsed values while rendering validation errors in the current UI language. */
export function localizeFormSchema<T extends z.ZodType>(schema: T, invalidValueMessage: string) {
  return z.custom<z.input<T>>().transform((input, context): z.output<T> => {
    const result = schema.safeParse(input);
    if (result.success) return result.data;
    for (const issue of result.error.issues) {
      context.addIssue({
        code: 'custom',
        path: issue.path,
        message:
          issue.code === 'custom' && issue.path.at(-1) === 'confirmPassword' ? issue.message : invalidValueMessage,
      });
    }
    return z.NEVER;
  });
}
