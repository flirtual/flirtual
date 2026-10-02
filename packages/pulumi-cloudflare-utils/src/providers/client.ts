import { fileURLToPath } from "node:url";

import { execa } from "execa";

/** This package's directory, whose `node_modules/.bin` holds the `cf` it depends on. */
const packageDirectory = fileURLToPath(new URL("../..", import.meta.url));

interface Options {
	cwd?: string;
	accountId: string;
}

const describeFailure = (command: string, error: unknown, output: string | undefined) => {
	const { exitCode, message } = error as { exitCode?: number; message: string };
	const reason = exitCode === undefined ? message.split("\n")[0] : `exit code ${exitCode}`;

	return output?.trim() ? `\`${command}\` failed with ${reason}.\n${output.trim()}` : `\`${command}\` failed with ${reason}.`;
};

export async function cf(argumentList: Array<string>, { cwd, accountId }: Options): Promise<string> {
	try {
		const { stdout } = await execa("cf", argumentList, {
			cwd,
			preferLocal: true,
			localDir: packageDirectory,
			env: { CLOUDFLARE_ACCOUNT_ID: accountId },
		});

		return stdout;
	} catch (error) {
		throw new Error(describeFailure(`cf ${argumentList.join(" ")}`, error, (error as { stderr?: string }).stderr));
	}
}

const reportedLines = 50;

/** Runs a shell command, failing with the end of its combined output. */
export async function run(command: string, { cwd, environment }: { cwd: string; environment: Record<string, string> }) {
	try {
		await execa(command, { shell: true, cwd, env: environment, all: true });
	} catch (error) {
		const output = (error as { all?: string }).all;

		throw new Error(describeFailure(command, error, output?.split("\n").slice(-reportedLines).join("\n")));
	}
}
