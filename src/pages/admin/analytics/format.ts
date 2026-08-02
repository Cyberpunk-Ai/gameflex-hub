// @ts-nocheck
export const kes = (n: number) => `KES ${Math.round(n).toLocaleString()}`;
export const num = (n: number) => Math.round(n).toLocaleString();
export const ms = (n: number | null) => (n == null ? "—" : `${n} ms`);
