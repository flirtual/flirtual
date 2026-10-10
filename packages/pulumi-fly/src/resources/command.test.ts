import { afterEach, expect, it, vi } from "vitest";

import { execFileSync } from "node:child_process";

type Value = string | Array<string>;

const commands: Array<Array<string>> = [];
let sshResult: () => Promise<string> = async () => "";

const argumentsOf = (templates: TemplateStringsArray, values: Array<Value>) =>
	templates.flatMap((chunk, index) => [
		...chunk.split(/\s+/u).filter(Boolean),
		...(index < values.length ? [values[index]!].flat() : []),
	]);

vi.mock("../client.ts", () => ({
	fly: async (templates: TemplateStringsArray, ...values: Array<Value>) => {
		const command = argumentsOf(templates, values);
		commands.push(command);
		return command[0] === "ssh" ? sshResult() : "";
	},
	flyJson: async (templates: TemplateStringsArray, ...values: Array<Value>) => {
		commands.push(argumentsOf(templates, values));
		const name = commands[0]![commands[0]!.indexOf("--name") + 1];
		return [
			{ id: "other", name: "app-machine" },
			{ id: "m1", name },
		];
	},
}));

const { provider, shellQuote } = await import("./command.ts");

afterEach(() => {
	commands.length = 0;
	sshResult = async () => "";
});

const inputs = {
	app: "flirtual-latest-listmonk",
	image: "listmonk/listmonk:v6.2.0",
	region: "iad",
	command: "./listmonk --install --idempotent --yes 2>&1",
	environment: { LISTMONK_ADMIN_API_USER: "install", LISTMONK_DB__PASSWORD: "it's" },
};

it("runs the command in a one-off machine of the image, keeps its output, and removes the machine", async () => {
	sshResult = async () => "installed";

	const result = await provider.create(inputs);

	const name = commands[0]![commands[0]!.indexOf("--name") + 1]!;
	expect(name).toMatch(/^pulumi-command-[0-9a-f]{8}$/u);
	expect(commands).toEqual([
		[
			"machine",
			"run",
			"listmonk/listmonk:v6.2.0",
			"sleep",
			"3600",
			"--app",
			"flirtual-latest-listmonk",
			"--name",
			name,
			"--region",
			"iad",
			"--restart",
			"no",
			"--detach",
		],
		["machine", "list", "--app", "flirtual-latest-listmonk"],
		["machine", "wait", "m1", "--app", "flirtual-latest-listmonk", "--state", "started"],
		[
			"ssh",
			"console",
			"--app",
			"flirtual-latest-listmonk",
			"--machine",
			"m1",
			"--quiet",
			"--command",
			`sh -c ${shellQuote("env LISTMONK_ADMIN_API_USER='install' LISTMONK_DB__PASSWORD='it'\\''s' ./listmonk --install --idempotent --yes 2>&1")}`,
		],
		["machine", "destroy", "m1", "--app", "flirtual-latest-listmonk", "--force"],
	]);
	expect(result).toEqual({ id: name, outs: { ...inputs, output: "installed" } });
});

it("removes the machine when the command fails, and fails with it", async () => {
	sshResult = async () => {
		throw new Error("exit code 1");
	};

	await expect(provider.create(inputs)).rejects.toThrow("exit code 1");
	expect(commands.at(-1)).toEqual([
		"machine",
		"destroy",
		"m1",
		"--app",
		"flirtual-latest-listmonk",
		"--force",
	]);
});

it("runs again rather than updating, since a command can't be changed after it ran", async () => {
	const olds = { ...inputs, output: "installed" };

	expect(await provider.diff!("id", olds, inputs)).toEqual({ changes: false, replaces: [] });
	expect(await provider.diff!("id", olds, { ...inputs, command: "./listmonk --upgrade" })).toEqual({
		changes: true,
		replaces: ["command"],
	});
});

it("quotes a value so a shell reads it back unchanged", () => {
	for (const value of ["plain", "it's", "'", "two words", '$HOME \\ "quoted" `tick`', ""])
		expect(execFileSync("sh", ["-c", `printf %s ${shellQuote(value)}`]).toString()).toBe(value);
});
