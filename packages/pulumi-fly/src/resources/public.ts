import * as pulumi from "@pulumi/pulumi";

import { fly, flyDelete, flyJson } from "../client.ts";

interface PublicInputs {
	app: string;
}

interface PublicOutputs extends PublicInputs {
	ipv4: string;
	ipv6: string;
}

interface FlyAddress {
	Address: string;
	Type: string;
}

const addressOf = (addresses: Array<FlyAddress>, type: string) =>
	addresses.find(({ Type }) => Type === type)?.Address;

// A free shared IPv4 and an IPv6, allocating only what's missing.
export const provider: pulumi.dynamic.ResourceProvider<PublicInputs, PublicOutputs> = {
	async diff(_id, olds, news) {
		const replaces = olds.app === news.app ? [] : ["app"];
		return { changes: replaces.length > 0, replaces };
	},

	async create({ app }) {
		const before = await flyJson<Array<FlyAddress>>`ips list --app ${app}`;

		if (!addressOf(before, "shared_v4")) await fly`ips allocate-v4 --shared --app ${app}`;
		if (!addressOf(before, "v6")) await fly`ips allocate-v6 --app ${app}`;

		const after = await flyJson<Array<FlyAddress>>`ips list --app ${app}`;
		const ipv4 = addressOf(after, "shared_v4");
		const ipv6 = addressOf(after, "v6");
		if (!ipv4 || !ipv6) throw new Error(`Fly app "${app}" has no public IPv4 or IPv6 address.`);

		return { id: app, outs: { app, ipv4, ipv6 } };
	},

	async read(id, props) {
		const addresses = await flyJson<Array<FlyAddress>>`ips list --app ${id}`;
		const ipv4 = addressOf(addresses, "shared_v4");
		const ipv6 = addressOf(addresses, "v6");
		if (!ipv4 || !ipv6) return {};

		return { id, props: { ...props, app: id, ipv4, ipv6 } };
	},

	async delete(_id, { app, ipv4, ipv6 }) {
		await flyDelete`ips release ${ipv4} --app ${app}`;
		await flyDelete`ips release ${ipv6} --app ${app}`;
	},
};

export interface PublicAddressesArgs {
	app: pulumi.Input<string>;
}

export class PublicAddresses extends pulumi.dynamic.Resource {
	declare public readonly ipv4: pulumi.Output<string>;
	declare public readonly ipv6: pulumi.Output<string>;

	constructor(name: string, args: PublicAddressesArgs, options?: pulumi.CustomResourceOptions) {
		super(
			provider,
			name,
			{ ...args, ipv4: undefined, ipv6: undefined },
			options,
			"fly",
			"PublicAddresses",
		);
	}
}
