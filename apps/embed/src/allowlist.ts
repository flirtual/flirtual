import defaultHosts from "../../api/priv/chat/allowed-hosts.json";
import defaultMatches from "../../api/priv/chat/allowed-matches.json";

const escape = (value: string) => value.replace(/[.+?^${}()|[\]\\/]/g, "\\$&");

// TalkJS's "Allowed hostnames" semantics: an entry matches the whole hostname, and "*" matches any
// run of hostname characters, so "*.example.com" covers every subdomain but not the apex.
function compile(pattern: string, wildcard: string) {
	return new RegExp(`^${pattern.toLowerCase().split("*").map(escape).join(wildcard)}$`);
}

export function list(value: string | undefined): Array<string> {
	return value?.split(/[\s,]+/).filter(Boolean) ?? [];
}

// TalkJS's "Suppression exceptions" are JavaScript regexp literals, matched against the link.
function literal(value: string) {
	const [, source, flags] = /^\/(.*)\/([a-z]*)$/s.exec(value) ?? [];
	if (source === undefined) throw new TypeError(`Not a regexp literal: ${value}`);
	return new RegExp(source, flags);
}

export class Allowlist {
	readonly #patterns: Array<RegExp>;
	readonly #matches: Array<RegExp>;

	constructor(readonly hosts: Array<string> = defaultHosts, matches: Array<string> = []) {
		this.#patterns = hosts.map((host) => compile(host, "[a-z0-9.-]*"));
		this.#matches = matches.map(literal);
	}

	// Each replaces its committed list.
	static fromEnv(hostsValue: string | undefined, matchesValue: string | undefined) {
		const hosts = list(hostsValue);
		const matches = matchesValue ? JSON.parse(matchesValue) as Array<string> : defaultMatches;
		return new Allowlist(hosts.length > 0 ? hosts : defaultHosts, matches);
	}

	allows(url: URL | string): boolean {
		return this.allowsHost(url) || this.excepts(url);
	}

	allowsHost(url: URL | string): boolean {
		const { protocol, hostname } = typeof url === "string" ? new URL(url) : url;
		if (protocol !== "https:" && protocol !== "http:") return false;

		const host = hostname.toLowerCase().replace(/\.$/, "");
		return this.#patterns.some((pattern) => pattern.test(host));
	}

	/** Whether the link itself is one of the exceptions, whatever its host. */
	excepts(url: URL | string): boolean {
		const { href } = typeof url === "string" ? new URL(url) : url;
		return this.#matches.some((pattern) => {
			pattern.lastIndex = 0;
			return pattern.test(href);
		});
	}

	// CSP host-sources: "*." is the only wildcard CSP understands, so other globs are left out.
	sources(): Array<string> {
		return this.hosts
			.filter((host) => !host.slice(1).includes("*") && (!host.startsWith("*") || host.startsWith("*.")))
			.map((host) => `https://${host}`);
	}
}

export class OriginList {
	readonly #patterns: Array<RegExp>;

	constructor(readonly origins: Array<string>) {
		this.#patterns = origins.map((origin) => compile(origin, "[a-z0-9-]+"));
	}

	allows(origin: string | null): origin is string {
		return !!origin && this.#patterns.some((pattern) => pattern.test(origin.toLowerCase()));
	}

	// Hostnames without wildcards, for providers that need to be told where they're embedded.
	hostnames(): Array<string> {
		return this.origins.filter((origin) => !origin.includes("*")).map((origin) => new URL(origin).hostname);
	}

	// The domains these origins sit on: "https://www.example.com" and "https://*.example.com" are
	// both example.com.
	domains(): Array<string> {
		return [...new Set(this.origins.map((origin) => origin.replace(/^https?:\/\//, "").replace(/:\d+$/, "").replace(/^(?:\*|www)\./, "").toLowerCase()))];
	}
}
