import * as pulumi from "@pulumi/pulumi";

import { flyDelete, flyJson } from "../client.ts";

interface CertificateInputs {
  app: string;
  hostname: string;
}

export interface DnsRequirements {
  a: Array<string>;
  aaaa: Array<string>;
  cname: string;
  acmeChallenge: { name: string; target: string };
  ownership: { name: string; appValue: string; orgValue: string };
}

interface CertificateOutputs extends CertificateInputs {
  dnsRequirements: DnsRequirements;
}

interface CertificateDetail {
  hostname: string;
  configured: boolean;
  dns_requirements: {
    a: Array<string>;
    aaaa: Array<string>;
    cname: string;
    acme_challenge: { name: string; target: string };
    ownership: { name: string; app_value: string; org_value: string };
  };
}

function toOutputs(inputs: CertificateInputs, detail: CertificateDetail): CertificateOutputs {
  const { a, aaaa, cname, acme_challenge, ownership } = detail.dns_requirements;

  return {
    ...inputs,
    dnsRequirements: {
      a,
      aaaa,
      cname,
      acmeChallenge: acme_challenge,
      ownership: {
        name: ownership.name,
        appValue: ownership.app_value,
        orgValue: ownership.org_value,
      },
    },
  };
}

const provider: pulumi.dynamic.ResourceProvider<CertificateInputs, CertificateOutputs> = {
  async diff(_id, olds, news) {
    const replaces = ["app", "hostname"].filter(
      (key) => olds[key as keyof CertificateInputs] !== news[key as keyof CertificateInputs],
    );

    return { changes: replaces.length > 0, replaces };
  },

  async create(inputs) {
    const { app, hostname } = inputs;
    const detail = await flyJson<CertificateDetail>`certs add ${hostname} --app ${app}`;

    return { id: `${app}/${hostname}`, outs: toOutputs(inputs, detail) };
  },

  async read(id) {
    const [app, hostname] = id.split("/");
    if (!app || !hostname) throw new Error(`Fly certificate "${id}" must be "<app>/<hostname>".`);

    const detail = await flyJson<CertificateDetail>`certs check ${hostname} --app ${app}`;

    return { id, props: toOutputs({ app, hostname }, detail) };
  },

  async delete(_id, props) {
    await flyDelete`certs remove ${props.hostname} --app ${props.app} --yes`;
  },
};

export interface CertificateArgs {
  app: pulumi.Input<string>;
  hostname: pulumi.Input<string>;
}

export class Certificate extends pulumi.dynamic.Resource {
  declare public readonly hostname: pulumi.Output<string>;
  declare public readonly dnsRequirements: pulumi.Output<DnsRequirements>;

  constructor(name: string, args: CertificateArgs, options?: pulumi.CustomResourceOptions) {
    super(
      provider,
      name,
      {
        ...args,
        dnsRequirements: undefined,
      },
      options,
      "fly",
      "Certificate",
    );
  }
}
