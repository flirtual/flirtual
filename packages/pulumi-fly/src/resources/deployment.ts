import * as pulumi from "@pulumi/pulumi";

import { fly } from "../client.ts";
import type { FlyIoConfigSchemaFlyToml as Config } from "../config.ts";
import { digests, drifted, importStaged, record, unsetStaged } from "./secret.ts";

interface DeploymentInputs {
  app: string;
  configuration: string;
  secrets: Record<string, string>;
}

interface DeploymentOutputs extends DeploymentInputs {
  digests: Record<string, string>;
}

async function deploy(
  { app, configuration, secrets }: DeploymentInputs,
  removed: Array<string> = [],
): Promise<DeploymentOutputs> {
  const { mkdtemp, rm, writeFile } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");

  await unsetStaged(app, removed);
  await importStaged(app, secrets);

  // `fly deploy --config` picks its parser from the file extension.
  const directory = await mkdtemp(join(tmpdir(), "fly-"));
  try {
    const file = join(directory, "fly.json");
    await writeFile(file, configuration);

    await fly`deploy --config ${file} --yes`;
  } finally {
    await rm(directory, { recursive: true, force: true });
  }

  return { app, configuration, secrets, digests: await record(app, Object.keys(secrets)) };
}

const provider: pulumi.dynamic.ResourceProvider<DeploymentInputs, DeploymentOutputs> = {
  async diff(_id, olds, news) {
    if (olds.app !== news.app) return { changes: true, replaces: ["app"] };
    if (olds.configuration !== news.configuration) return { changes: true };

    const names = new Set([...Object.keys(olds.secrets), ...Object.keys(news.secrets)]);
    if ([...names].some((name) => olds.secrets[name] !== news.secrets[name]))
      return { changes: true };

    return { changes: await drifted(news.app, olds.digests) };
  },

  async create(inputs) {
    return { id: inputs.app, outs: await deploy(inputs) };
  },

  async update(_id, olds, news) {
    const removed = Object.keys(olds.secrets).filter((name) => !(name in news.secrets));
    return { outs: await deploy(news, removed) };
  },

  async read(id, props) {
    if (!props)
      throw new Error(`Fly deployment "${id}" cannot be imported; its secrets are unreadable.`);

    const live = await digests(id);
    const kept = Object.keys(props.secrets).filter((name) => live[name]);

    return {
      id,
      props: {
        ...props,
        app: id,
        secrets: Object.fromEntries(kept.map((name) => [name, props.secrets[name]!])),
        digests: Object.fromEntries(kept.map((name) => [name, live[name]!])),
      },
    };
  },
};

export interface DeploymentArgs extends Omit<Config, "app" | "build" | "env"> {
  app: pulumi.Input<string>;
  build?: Omit<NonNullable<Config["build"]>, "image"> & { image?: pulumi.Input<string> };
  env?: Record<string, pulumi.Input<string>>;
}

function partition(environment: Record<string, pulumi.Input<string>>) {
  const secretNames = pulumi
    .all(
      Object.entries(environment).map(([name, value]) =>
        pulumi.isSecret(pulumi.output(value)).then((secret) => (secret ? name : null)),
      ),
    )
    .apply((names) => names.filter((name) => name !== null));

  return pulumi.all([secretNames, pulumi.output(environment)]).apply(([names, values]) => {
    const secret = new Set(names);
    const entries = Object.entries(values);

    return {
      env: Object.fromEntries(entries.filter(([name]) => !secret.has(name))),
      secrets: Object.fromEntries(entries.filter(([name]) => secret.has(name))),
    };
  });
}

export class Deployment extends pulumi.dynamic.Resource {
  constructor(name: string, args: DeploymentArgs, options?: pulumi.CustomResourceOptions) {
    const { env = {}, ...configuration } = args;
    const split = partition(env);

    super(
      provider,
      name,
      {
        app: args.app,
        configuration: pulumi
          .all([pulumi.output(configuration), split])
          .apply(([configuration, { env }]) =>
            JSON.stringify({ ...configuration, env } satisfies Config),
          ),
        secrets: split.apply(({ secrets }) => secrets),
        digests: undefined,
      },
      { ...options, additionalSecretOutputs: ["secrets"] },
      "fly",
      "Deployment",
    );
  }
}
