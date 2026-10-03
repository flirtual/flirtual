import type { ResolvedOutputWorkerConfig } from "@cloudflare/build-output-utils";
import type { ParsedOutputWorkerConfig } from "@cloudflare/config";
import type { DeepInput } from "@flirtual/pulumi-utils";

type Binding = NonNullable<ParsedOutputWorkerConfig["env"]>[string];

/** A binding as Cloudflare's schema defines it, except that a secret carries its value. */
export type DeployedBinding =
	| Exclude<Binding, { type: "secret" }>
	| { type: "secret"; value: string };

type DeployedBindingInput = DeployedBinding extends infer B
	? B extends DeployedBinding
		? { [K in keyof B]: K extends "type" ? B[K] : DeepInput<B[K]> }
		: never
	: never;

type Fields = Omit<ParsedOutputWorkerConfig, "env">;

/** The config to deploy: every field may be a Pulumi input, but each binding's `type` is plain so it can be checked before deploying. */
export type DeployedConfig = { [K in keyof Fields]: DeepInput<Fields[K]> } & {
	env: Record<string, DeployedBindingInput>;
};

/** The build's config without the fields that name resources, so none of their built values can reach a deployment. */
export type BuildSettings = Omit<
	ResolvedOutputWorkerConfig,
	"name" | "env" | "triggers" | "domains" | "tailConsumers"
>;

export function settingsOf(config: ResolvedOutputWorkerConfig): BuildSettings {
	const {
		name: _name,
		env: _env,
		triggers: _triggers,
		domains: _domains,
		tailConsumers: _tailConsumers,
		...settings
	} = config;

	return settings;
}

interface ProvidedBinding {
	type: unknown;
	value?: unknown;
}

/** What keeps the deployed bindings from matching the ones the build's code uses. */
export function bindingProblems(
	built: Record<string, Binding>,
	deployed: Record<string, ProvidedBinding>,
): Array<string> {
	const expected = Object.entries(built).flatMap(([name, { type }]) => {
		if (!(name in deployed))
			return [`env.${name}: the build uses it, but the deployment doesn't provide it`];

		const provided = deployed[name]!.type;
		if (provided !== type)
			return [
				`env.${name}: the build expects type ${type}, but the deployment provides ${String(provided)}`,
			];

		return [];
	});

	const unused = Object.keys(deployed)
		.filter((name) => !(name in built))
		.map((name) => `env.${name}: the deployment provides it, but the build doesn't use it`);

	const valueless = Object.entries(deployed)
		.filter(([, binding]) => binding.type === "secret" && binding.value === undefined)
		.map(([name]) => `env.${name}: the deployment provides this secret without a value`);

	return [...expected, ...unused, ...valueless];
}

/** Applies the deployed config to the build's settings, refusing it unless its bindings match the build's. */
export function deployedConfig<Config extends { env: Record<string, ProvidedBinding> }>(
	built: ResolvedOutputWorkerConfig,
	apply: (settings: BuildSettings) => Config,
): Config {
	const config = apply(settingsOf(built));
	const problems = bindingProblems(built.env ?? {}, config.env);

	if (problems.length > 0) {
		const lines = problems.map((problem) => `  ${problem}`);

		throw new Error(["The deployment's bindings don't match the build:", ...lines].join("\n"));
	}

	return config;
}

/** Takes secret values out of the config, for a secrets file, leaving each secret's binding behind. */
export function splitSecrets<Config extends { env: Record<string, ProvidedBinding> }>(
	config: Config,
) {
	const entries = Object.entries(config.env);

	const env = Object.fromEntries(
		entries.map(([name, binding]) => [
			name,
			binding.type === "secret" ? { type: "secret" } : binding,
		]),
	);

	const secrets = Object.fromEntries(
		entries
			.filter(([, binding]) => binding.type === "secret")
			.map(([name, binding]) => [name, binding.value]),
	) as Record<string, NonNullable<Config["env"][string]["value"]>>;

	return { config: { ...config, env }, secrets };
}
