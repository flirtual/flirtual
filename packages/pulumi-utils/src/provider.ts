import type * as pulumi from "@pulumi/pulumi";

type Provider<Inputs, Outputs> = pulumi.dynamic.ResourceProvider<Inputs, Outputs>;

/**
 * A dynamic provider whose implementation is the default export of the module `load` imports.
 *
 * Pulumi serializes a dynamic provider and rebuilds it in another process (pulumi/docs/gotchas.md); this one
 * serializes only `load`. Its bare specifier resolves against the program, which depends on the package
 * holding the module, and that module then imports its own dependencies as any module does.
 *
 * A method the module's provider leaves out behaves as Pulumi's host treats a missing one.
 */
export function moduleProvider<Inputs, Outputs>(
  load: () => Promise<{ default: Provider<Inputs, Outputs> }>,
): Provider<Inputs, Outputs> {
  const provider = async () => (await load()).default;

  return {
    check: async (olds, news) => (await provider()).check?.(olds, news) ?? { inputs: news },
    diff: async (id, olds, news) => (await provider()).diff?.(id, olds, news) ?? {},
    create: async (inputs) => (await provider()).create(inputs),
    read: async (id, props) => (await provider()).read?.(id, props) ?? { id, props },
    update: async (id, olds, news) => (await provider()).update?.(id, olds, news) ?? {},
    delete: async (id, props) => (await provider()).delete?.(id, props),
  };
}
