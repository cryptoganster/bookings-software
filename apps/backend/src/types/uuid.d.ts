// Custom type declaration for uuid package
// This ensures TypeScript can find types even if @types/uuid is not hoisted properly in pnpm monorepo

declare module 'uuid' {
  export function v4(): string;
  export function v1(): string;
  export function v3(name: string | Uint8Array, namespace: string | Uint8Array): string;
  export function v5(name: string | Uint8Array, namespace: string | Uint8Array): string;
  export function validate(uuid: string): boolean;
  export function version(uuid: string): number;
  export function parse(uuid: string): Uint8Array;
  export function stringify(arr: Uint8Array, offset?: number): string;
  export const NIL: string;
  export const MAX: string;
}
