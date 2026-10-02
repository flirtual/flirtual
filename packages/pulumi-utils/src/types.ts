import type * as pulumi from "@pulumi/pulumi";

/** A generic type passed without its argument: `type` reads the argument as `this["argument"]`. */
export interface TypeConstructor {
  readonly argument: unknown;
  readonly type: unknown;
}

type Apply<Constructor extends TypeConstructor, T> = (Constructor & { readonly argument: T })["type"];

/** `T`, with every level wrapped in `Into`, to a depth of 4. */
export type Deeply<T, Into extends TypeConstructor, Depth extends Array<unknown> = []> = Depth["length"] extends 4
  ? Apply<Into, T>
  : Apply<Into, T extends object ? { [K in keyof T]: Deeply<T[K], Into, [...Depth, unknown]> } : T>;

export interface InputOf extends TypeConstructor {
  readonly type: pulumi.Input<this["argument"]>;
}

export type DeepInput<T> = Deeply<T, InputOf>;

export interface OutputOf extends TypeConstructor {
  readonly type: pulumi.Output<this["argument"]>;
}

export type DeepOutput<T> = Deeply<T, OutputOf>;
