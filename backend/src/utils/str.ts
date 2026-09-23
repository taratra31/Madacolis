/** Coerce une valeur de requête (string | string[] | ParsedQs | undefined) en string. */
export const str = (value: unknown): string => (typeof value === "string" ? value : "");

/** Comme str() mais renvoie undefined pour une valeur absente. */
export const optStr = (value: unknown): string | undefined => (typeof value === "string" ? value : undefined);