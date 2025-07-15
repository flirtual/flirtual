import { basename, normalize, relative } from "node:path";

const pwd = process.cwd();

const editor = process.env.EDITOR || "code";

const wslDistro = process.env.WSL_DISTRO_NAME;
const wsl = !!wslDistro;

const fileLineRegex = /:(?<line>\d+)(:(?<column>\d+))?$/;

function link(url: string, label: string) {
	return `\x1B]8;;${url}\x1B\\${label}\x1B]8;;\x1B\\`;
}

function italic(text: string) {
	return `\x1B[3m${text}\x1B[23m`;
}

function getPackageName(pathname: string): string | null {
	// pnpm stores packages in node_modules/.pnpm/<package>@<version>/node_modules/<package>.
	pathname = pathname.replace(/node_modules\/.+\/node_modules\//i, "node_modules/");

	const packageName = pathname.match(/node_modules\/([^/]+)/)?.[1];
	if (!packageName) return null;

	return packageName;
}

function fileLocation(pathname: string): { line?: string; column?: string } {
	const { groups = {} } = pathname.match(fileLineRegex) || { groups: {} };
	return groups;
}

function fileLabel(pathname: string) {
	const filename = basename(pathname);

	const { line, column } = fileLocation(pathname);
	if (line === "1" && (!column || column === "0")) pathname = pathname.replace(fileLineRegex, "");

	const packageName = getPackageName(pathname);
	if (packageName) return `${italic(packageName)}/${filename}`;

	if (pathname.startsWith(pwd)) return `./${relative(pwd, pathname)}`;

	return pathname;
}

const fileProtocol = editor === "code"
	? wsl
		? `vscode://vscode-remote/wsl+${wslDistro}`
		: `vscode://file`
	: `file://`;

function file(pathname: string) {
	if (pathname.startsWith("file://")) pathname = pathname.replace("file://", "");

	pathname = normalize(pathname);
	// if (pathname.startsWith("/")) pathname = pathname.slice(1);

	const { line } = fileLocation(pathname);
	if (!line) pathname += `:1`;

	return link(`${fileProtocol}${pathname}`, fileLabel(pathname));
}

function prettyPaths(data: string) {
	return data
		.replace(/\((file:\/\/\S+)\)/gi, (match, pathname) => `(${file(pathname)})`)
		.replace(new RegExp(`'(${pwd}/([^']+))'`, "g"), (match, pathname) => `'${file(pathname)}'`);
}

for await (const chunk of Bun.stdin.stream()) {
	const chunkText = Buffer.from(chunk).toString();
	// eslint-disable-next-line no-console
	console.log(prettyPaths(chunkText));
}

export {};
