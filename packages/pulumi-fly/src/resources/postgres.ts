import * as pulumi from "@pulumi/pulumi";

import { fly, flyDelete, flyJson } from "../client.ts";
import { App, type AppArgs } from "./app.ts";

interface PostgresInputs {
  name: string;
  organization: string;
  network: string;
  region: string;
  password: string;
  clusterSize: number;
  volumeSize: number;
  memory: number;
}

interface FlyApp {
  Name: string;
}

const provider: pulumi.dynamic.ResourceProvider<PostgresInputs, PostgresInputs> = {
  async check(_olds, news) {
    const help = await fly`pg create --help`.catch(() => "");

    return {
      inputs: news,
      failures: help.includes("--network")
        ? []
        : [
            {
              property: "network",
              reason:
                "`fly pg create` has no --network. Put the flyctl fork first on PATH (packages/pulumi-fly/flyctl.md).",
            },
          ],
    };
  },

  async diff(_id, olds, news) {
    const replaces = (
      [
        "name",
        "organization",
        "network",
        "region",
        "password",
        "clusterSize",
        "volumeSize",
        "memory",
      ] as const
    ).filter((key) => olds[key] !== news[key]);

    return { changes: replaces.length > 0, replaces };
  },

  async create(inputs) {
    const { name, organization, network, region, password, clusterSize, volumeSize, memory } =
      inputs;

    await fly`pg create --flex --name ${name} --org ${organization} --network ${network}
      --region ${region} --password ${password}
      --initial-cluster-size ${String(clusterSize)} --volume-size ${String(volumeSize)}
      --vm-cpu-kind shared --vm-cpus 1 --vm-memory ${String(memory)}`;

    return { id: name, outs: inputs };
  },

  async read(id, props) {
    if (!props)
      throw new Error(`Fly Postgres "${id}" cannot be imported; its password is unreadable.`);

    const app = await flyJson<FlyApp>`status --app ${id}`;
    return { id, props: { ...props, name: app.Name } };
  },

  async delete(id) {
    await flyDelete`apps destroy ${id} --yes`;
  },
};

export interface PostgresArgs extends AppArgs {
  network: pulumi.Input<string>;
  region: pulumi.Input<string>;
  password: pulumi.Input<string>;
  clusterSize: pulumi.Input<number>;
  volumeSize: pulumi.Input<number>;
  memory: pulumi.Input<number>;
}

export class Postgres extends App {
  declare public readonly password: pulumi.Output<string>;

  constructor(name: string, args: PostgresArgs, options?: pulumi.CustomResourceOptions) {
    super(
      name,
      args,
      { ...options, additionalSecretOutputs: ["password"] },
      { provider, type: "Postgres" },
    );
  }

  public get superuser() {
    return {
      host: this.flycastHost,
      port: 5432,
      username: "postgres",
      database: "postgres",
      password: this.password,
    };
  }
}
