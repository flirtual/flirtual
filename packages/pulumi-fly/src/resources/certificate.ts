import * as pulumi from "@pulumi/pulumi";

import { flyDelete, flyJson } from "../client.ts";

interface CertificateInputs {
	app: string;
	hostname: string;
	fullchain: string;
	privateKey: string;
}

export interface DnsRequirements {
	cname: string;
	ownership: { name: string; appValue: string; orgValue: string };
}

interface CertificateOutputs extends CertificateInputs {
	dnsRequirements: DnsRequirements;
}

interface CertificateDetail {
	dns_requirements: {
		cname: string;
		ownership: { name: string; app_value: string; org_value: string };
	};
}

function toOutputs(inputs: CertificateInputs, detail: CertificateDetail): CertificateOutputs {
	const { cname, ownership } = detail.dns_requirements;

	return {
		...inputs,
		dnsRequirements: {
			cname,
			ownership: {
				name: ownership.name,
				appValue: ownership.app_value,
				orgValue: ownership.org_value,
			},
		},
	};
}

async function importCertificate({ app, hostname, fullchain, privateKey }: CertificateInputs) {
	const { mkdtemp, rm, writeFile } = await import("node:fs/promises");
	const { tmpdir } = await import("node:os");
	const { join } = await import("node:path");

	const directory = await mkdtemp(join(tmpdir(), "fly-certificate-"));
	try {
		const fullchainFile = join(directory, "fullchain.pem");
		const keyFile = join(directory, "key.pem");
		await writeFile(fullchainFile, fullchain, { mode: 0o600 });
		await writeFile(keyFile, privateKey, { mode: 0o600 });

		return await flyJson<CertificateDetail>`certs import ${hostname} --app ${app}
      --fullchain ${fullchainFile} --private-key ${keyFile}`;
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
}

const replacing = ["app", "hostname"] as const;
const updating = ["fullchain", "privateKey"] as const;

export const provider: pulumi.dynamic.ResourceProvider<CertificateInputs, CertificateOutputs> = {
	async diff(_id, olds, news) {
		const replaces = replacing.filter((key) => olds[key] !== news[key]);
		const updates = updating.filter((key) => olds[key] !== news[key]);

		return { changes: replaces.length + updates.length > 0, replaces: [...replaces] };
	},

	async create(inputs) {
		const detail = await importCertificate(inputs);
		return { id: `${inputs.app}/${inputs.hostname}`, outs: toOutputs(inputs, detail) };
	},

	async update(_id, _olds, news) {
		return { outs: toOutputs(news, await importCertificate(news)) };
	},

	async read(id, props) {
		const [app, hostname] = id.split("/");
		if (!app || !hostname) throw new Error(`Fly certificate "${id}" must be "<app>/<hostname>".`);
		if (!props) throw new Error(`Fly certificate "${id}" can't be imported; its key is unknown.`);

		const detail = await flyJson<CertificateDetail>`certs show ${hostname} --app ${app}`;
		return { id, props: toOutputs(props, detail) };
	},

	async delete(_id, props) {
		await flyDelete`certs remove ${props.hostname} --app ${props.app} --yes`;
	},
};

export interface CertificateArgs {
	app: pulumi.Input<string>;
	hostname: pulumi.Input<string>;
	fullchain: pulumi.Input<string>;
	privateKey: pulumi.Input<string>;
}

// A certificate we bring, so Fly never asks Let's Encrypt for one.
export class Certificate extends pulumi.dynamic.Resource {
	declare public readonly hostname: pulumi.Output<string>;
	declare public readonly dnsRequirements: pulumi.Output<DnsRequirements>;

	constructor(name: string, args: CertificateArgs, options?: pulumi.CustomResourceOptions) {
		super(
			provider,
			name,
			{ ...args, dnsRequirements: undefined },
			{
				...options,
				additionalSecretOutputs: [...(options?.additionalSecretOutputs ?? []), "privateKey"],
			},
			"fly",
			"Certificate",
		);
	}
}
