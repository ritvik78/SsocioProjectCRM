export type VariableContext = Record<string, string>;

/**
 * Replaces {{variable_name}} tokens in text using the given context.
 * Usable on both server and client (pure function).
 */
export function substituteVariables(text: string, ctx: VariableContext) {
  return text.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (match, key: string) => {
    const lower = key.toLowerCase();
    return (
      ctx[lower] ??
      ctx[lower.replace(/-/g, "_")] ??
      ctx[lower.replace(/_/g, "-")] ??
      match
    );
  });
}