/**
 * Some useful utility types.
 */

/**
 * @typedef UnionToIntersection - Transforms a union type to an intersection.
 * 
 * For attribution: https://stackoverflow.com/questions/50374908/transform-union-type-to-intersection-type/50375286#50375286
 */
export type UnionToIntersection<U> = 
  (U extends any ? (x: U)=>void : never) extends ((x: infer I)=>void) ? I : never
/**
 * @typedef IsUnion - Test whether a type is a union.
 * 
 * For attribution: https://stackoverflow.com/questions/53953814/typescript-check-if-a-type-is-a-union/53955431#53955431
 */
export type IsUnion<T> = [T] extends [UnionToIntersection<T>] ? false : true
/**
 * @typedef SingleKey - Restrict an object to a single attribute of any name with a specific type.
 * 
 * For Attribution: https://stackoverflow.com/questions/39190154/typescript-restrict-count-of-objects-properties
 */
export type SingleKey<T> = IsUnion<keyof T> extends true ? never : {} extends T ? never : T;
/**
 * @typedef RequireAtLeastOne - Require that a type have at least one attribute.
 * 
 * For attribution: https://learn.microsoft.com/en-us/javascript/api/@azure/keyvault-certificates/requireatleastone?view=azure-node-latest
 */
export type RequireAtLeastOne<T> = {
  [K in keyof T]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<keyof T, K>>>
}[keyof T]
