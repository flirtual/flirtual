import * as pulumi from "@pulumi/pulumi";

import { flyDelete, flyJson } from "../client.ts";

interface AppInputs {
  name: string;
  organization: string;
  network?: string;
}

interface FlyApp {
  Name: string;
  Organization: { Slug: string };
}

const provider: pulumi.dynamic.ResourceProvider<AppInputs, AppInputs> = {
  async diff(_id, olds, news) {
    const replaces = ["name", "organization", "network"].filter(
      (key) => olds[key as keyof AppInputs] !== news[key as keyof AppInputs],
    );

    return { changes: replaces.length > 0, replaces };
  },

  async create(inputs) {
    const { name, organization, network } = inputs;

    const app = await flyJson<FlyApp>`apps create ${name} --org ${organization} ${
      network ? ["--network", network] : []
    }`;

    return { id: app.Name, outs: inputs };
  },

  async read(id, props) {
    const app = await flyJson<FlyApp>`status --app ${id}`;

    return {
      id,
      props: {
        ...props,
        name: app.Name,
        organization: app.Organization.Slug,
      },
    };
  },

  async delete(id) {
    await flyDelete`apps destroy ${id} --yes`;
  },
};

export interface AppArgs {
  name: pulumi.Input<string>;
  organization: pulumi.Input<string>;
  network?: pulumi.Input<string>;
}

export interface AppKind {
  provider: pulumi.dynamic.ResourceProvider;
  type: string;
}

export class App extends pulumi.dynamic.Resource {
  declare public readonly name: pulumi.Output<string>;
  declare public readonly organization: pulumi.Output<string>;

  constructor(
    name: string,
    args: AppArgs,
    options?: pulumi.CustomResourceOptions,
    kind: AppKind = { provider, type: "App" },
  ) {
    super(
      kind.provider,
      name,
      args,
      {
        ...options,
        deleteBeforeReplace: true,
      },
      "fly",
      kind.type,
    );
  }

  public get internalHost(): pulumi.Output<string> {
    return pulumi.interpolate`${this.name}.internal`;
  }

  public get flycastHost(): pulumi.Output<string> {
    return pulumi.interpolate`${this.name}.flycast`;
  }
}
