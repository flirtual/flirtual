import * as pulumi from "@pulumi/pulumi";

import { fly, flyDelete, flyJson } from "../client.ts";

interface FlycastInputs {
  app: string;
  network: string;
}

interface FlycastOutputs extends FlycastInputs {
  address: string;
}

interface FlyAddress {
  Address: string;
  Type: string;
  Network: { Name: string };
}

async function allocated(app: string, network: string) {
  const addresses = await flyJson<Array<FlyAddress>>`ips list --app ${app}`;

  const address = addresses.find(
    ({ Type, Network }) => Type === "private_v6" && Network.Name === network,
  );
  if (!address) throw new Error(`Fly app "${app}" has no address on network "${network}".`);

  return address.Address;
}

const provider: pulumi.dynamic.ResourceProvider<FlycastInputs, FlycastOutputs> = {
  async diff(_id, olds, news) {
    const replaces = ["app", "network"].filter(
      (key) => olds[key as keyof FlycastInputs] !== news[key as keyof FlycastInputs],
    );

    return { changes: replaces.length > 0, replaces };
  },

  async create({ app, network }) {
    await fly`ips allocate-v6 --private --network ${network} --app ${app}`;

    const address = await allocated(app, network);
    return { id: `${app}/${address}`, outs: { app, network, address } };
  },

  async read(id, props) {
    const [app, address] = id.split("/");
    if (!app || !address) throw new Error(`Fly address "${id}" must be "<app>/<address>".`);
    if (!props)
      throw new Error(`Fly address "${id}" cannot be imported; its network is unreadable.`);

    const addresses = await flyJson<Array<FlyAddress>>`ips list --app ${app}`;
    if (!addresses.some(({ Address }) => Address === address))
      throw new Error(`Fly address "${id}" not found.`);

    return { id, props: { ...props, app, address } };
  },

  async delete(id) {
    const [app, address] = id.split("/");
    if (!app || !address) throw new Error(`Fly address "${id}" must be "<app>/<address>".`);

    await flyDelete`ips release ${address} --app ${app}`;
  },
};

export interface FlycastArgs {
  app: pulumi.Input<string>;
  network: pulumi.Input<string>;
}

export class Flycast extends pulumi.dynamic.Resource {
  declare public readonly address: pulumi.Output<string>;

  constructor(name: string, args: FlycastArgs, options?: pulumi.CustomResourceOptions) {
    super(provider, name, { ...args, address: undefined }, options, "fly", "Flycast");
  }
}
