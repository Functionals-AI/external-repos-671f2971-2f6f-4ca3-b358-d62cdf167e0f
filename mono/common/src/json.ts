export type JsonValue = string | number | boolean | JsonObject | JsonValue[]
export type JsonObject = { [k: string]: JsonValue }