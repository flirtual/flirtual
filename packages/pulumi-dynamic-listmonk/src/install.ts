// `listmonk --install` with LISTMONK_ADMIN_API_USER prints the API user's generated token as
// this line, and only when it installs (listmonk cmd/install.go).
const tokenLine = 'export LISTMONK_ADMIN_API_TOKEN="';

export function installedApiToken(output: string) {
	const line = output.split("\n").find((line) => line.trim().startsWith(tokenLine));
	if (!line)
		throw new Error(
			"Listmonk printed no API token: its database was already installed. Recreate the database to install it again.",
		);

	return line.trim().slice(tokenLine.length, -1);
}
