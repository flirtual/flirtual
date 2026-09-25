import * as pulumi from "@pulumi/pulumi";

import { fly, flyDelete, flyJson } from "../client.ts";

interface FlySecret {
  name: string;
  digest: string;
  status: string;
}

// `fly secrets import` rejects values containing a newline, so those go through `set`.
export async function importStaged(app: string, values: Record<string, string>) {
  const entries = Object.entries(values);

  const batched = entries.filter(([, value]) => !value.includes("\n"));
  const individual = entries.filter(([, value]) => value.includes("\n"));

  if (batched.length > 0)
    await fly({
      input: batched.map(([name, value]) => `${name}=${value}`).join("\n"),
    })`secrets import --app ${app} --stage`;

  for (const [name, value] of individual)
    await fly`secrets set ${`${name}=${value}`} --app ${app} --stage`;
}

export async function unsetStaged(app: string, names: Array<string>) {
  if (names.length === 0) return;
  await flyDelete`secrets unset ${names} --app ${app} --stage`;
}

export async function digests(app: string) {
  const secrets = await flyJson<Array<FlySecret>>`secrets list --app ${app}`;
  return Object.fromEntries(secrets.map(({ name, digest }) => [name, digest]));
}

export async function drifted(app: string, recorded: Record<string, string>) {
  if (Object.keys(recorded).length === 0) return false;

  const live = await digests(app);
  return Object.entries(recorded).some(([name, digest]) => live[name] !== digest);
}

export async function record(app: string, names: Array<string>) {
  if (names.length === 0) return {};

  const live = await digests(app);

  const missing = names.filter((name) => !live[name]);
  if (missing.length > 0)
    throw new Error(`Fly secrets were not set on "${app}": ${missing.join(", ")}.`);

  return Object.fromEntries(names.map((name) => [name, live[name]!]));
}

interface SecretInputs {
  app: string;
  name: string;
  value: string;
}

interface SecretOutputs extends SecretInputs {
  digest: string;
}

async function setOne({ app, name, value }: SecretInputs): Promise<SecretOutputs> {
  await importStaged(app, { [name]: value });
  return { app, name, value, digest: (await record(app, [name]))[name]! };
}

function parse(id: string) {
  const [app, name] = id.split("/");
  if (!app || !name) throw new Error(`Fly secret "${id}" must be "<app>/<name>".`);

  return { app, name };
}

const secretProvider: pulumi.dynamic.ResourceProvider<SecretInputs, SecretOutputs> = {
  async diff(_id, olds, news) {
    const replaces = ["app", "name"].filter(
      (key) => olds[key as keyof SecretInputs] !== news[key as keyof SecretInputs],
    );

    if (replaces.length > 0) return { changes: true, replaces };
    if (olds.value !== news.value) return { changes: true };

    return { changes: await drifted(news.app, { [news.name]: olds.digest }) };
  },

  async create(inputs) {
    return { id: `${inputs.app}/${inputs.name}`, outs: await setOne(inputs) };
  },

  async update(_id, _olds, news) {
    return { outs: await setOne(news) };
  },

  async read(id, props) {
    if (!props) throw new Error(`Fly secret "${id}" cannot be imported; its value is unreadable.`);

    const { app, name } = parse(id);

    const digest = (await digests(app))[name];
    if (!digest) throw new Error(`Fly secret "${id}" not found.`);

    return { id, props: { ...props, app, name, digest } };
  },

  async delete(id) {
    const { app, name } = parse(id);
    await unsetStaged(app, [name]);
  },
};

export interface SecretArgs {
  app: pulumi.Input<string>;
  name: pulumi.Input<string>;
  value: pulumi.Input<string>;
}

export class Secret extends pulumi.dynamic.Resource {
  declare public readonly app: pulumi.Output<string>;
  declare public readonly name: pulumi.Output<string>;
  declare public readonly digest: pulumi.Output<string>;

  constructor(name: string, args: SecretArgs, options?: pulumi.CustomResourceOptions) {
    super(
      secretProvider,
      name,
      { ...args, digest: undefined },
      { ...options, additionalSecretOutputs: ["value"] },
      "fly",
      "Secret",
    );
  }
}

interface SecretsInputs {
  app: string;
  values: Record<string, string>;
}

interface SecretsOutputs extends SecretsInputs {
  digests: Record<string, string>;
}

async function setMany(app: string, values: Record<string, string>): Promise<SecretsOutputs> {
  await importStaged(app, values);
  return { app, values, digests: await record(app, Object.keys(values)) };
}

const secretsProvider: pulumi.dynamic.ResourceProvider<SecretsInputs, SecretsOutputs> = {
  async diff(_id, olds, news) {
    if (olds.app !== news.app) return { changes: true, replaces: ["app"] };

    const names = new Set([...Object.keys(olds.values), ...Object.keys(news.values)]);
    if ([...names].some((name) => olds.values[name] !== news.values[name]))
      return { changes: true };

    return { changes: await drifted(news.app, olds.digests) };
  },

  async create({ app, values }) {
    return { id: app, outs: await setMany(app, values) };
  },

  async update(app, olds, news) {
    await unsetStaged(
      app,
      Object.keys(olds.values).filter((name) => !(name in news.values)),
    );

    return { outs: await setMany(app, news.values) };
  },

  async read(id, props) {
    if (!props)
      throw new Error(`Fly secrets for "${id}" cannot be imported; their values are unreadable.`);

    const live = await digests(id);
    const kept = Object.keys(props.values).filter((name) => live[name]);

    return {
      id,
      props: {
        app: id,
        values: Object.fromEntries(kept.map((name) => [name, props.values[name]!])),
        digests: Object.fromEntries(kept.map((name) => [name, live[name]!])),
      },
    };
  },

  async delete(app, { values }) {
    await unsetStaged(app, Object.keys(values));
  },
};

export interface SecretsArgs {
  app: pulumi.Input<string>;
  values: pulumi.Input<Record<string, pulumi.Input<string>>>;
}

export class Secrets extends pulumi.dynamic.Resource {
  declare public readonly app: pulumi.Output<string>;
  declare public readonly values: pulumi.Output<Record<string, string>>;
  declare public readonly digests: pulumi.Output<Record<string, string>>;

  constructor(name: string, args: SecretsArgs, options?: pulumi.CustomResourceOptions) {
    super(
      secretsProvider,
      name,
      { ...args, digests: undefined },
      { ...options, additionalSecretOutputs: ["values"] },
      "fly",
      "Secrets",
    );
  }
}
