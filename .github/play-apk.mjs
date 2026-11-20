// Usage: node play-apk.mjs                         → writes version_code to $GITHUB_OUTPUT
//        node play-apk.mjs <versionCode> <file>    → downloads that version's universal APK
import { createSign } from "node:crypto";
import { appendFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const { PLAY_SERVICE_ACCOUNT_JSON, PACKAGE_NAME, GITHUB_OUTPUT } = process.env;
const account = JSON.parse(PLAY_SERVICE_ACCOUNT_JSON);

async function accessToken() {
	const now = Math.floor(Date.now() / 1000);
	const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
	const unsigned = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({
		iss: account.client_email,
		scope: "https://www.googleapis.com/auth/androidpublisher",
		aud: account.token_uri,
		iat: now,
		exp: now + 600
	})}`;
	const signature = createSign("RSA-SHA256").update(unsigned).sign(account.private_key, "base64url");

	const response = await fetch(account.token_uri, {
		method: "POST",
		body: new URLSearchParams({
			grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
			assertion: `${unsigned}.${signature}`
		})
	});
	if (!response.ok) throw new Error(`Token exchange failed: ${response.status} ${await response.text()}`);
	return (await response.json()).access_token;
}

const token = await accessToken();

async function play(path, { method = "GET" } = {}) {
	const response = await fetch(
		`https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}/${path}`,
		{
			method,
			headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
			body: method === "POST" ? "{}" : undefined
		}
	);
	if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${await response.text()}`);
	return response;
}

// Tracks are only readable through an edit; this one is never committed.
async function productionVersionCode() {
	const { id } = await (await play("edits", { method: "POST" })).json();
	try {
		const { releases = [] } = await (await play(`edits/${id}/tracks/production`)).json();
		const versionCodes = releases
			.filter(({ status }) => status === "completed")
			.flatMap(({ versionCodes = [] }) => versionCodes.map(Number));
		if (versionCodes.length === 0) throw new Error("No completed release on the production track");
		return Math.max(...versionCodes);
	}
	finally {
		await play(`edits/${id}`, { method: "DELETE" });
	}
}

async function download(versionCode, file) {
	const { generatedApks = [] } = await (await play(`generatedApks/${versionCode}`)).json();
	const universal = generatedApks.filter(({ generatedUniversalApk }) => generatedUniversalApk);
	if (universal.length !== 1)
		throw new Error(`Expected one universal APK for ${versionCode}, found ${universal.length}`);

	const [{ certificateSha256Hash, generatedUniversalApk: { downloadId } }] = universal;
	const response = await play(`generatedApks/${versionCode}/downloads/${encodeURIComponent(downloadId)}:download?alt=media`);
	await pipeline(Readable.fromWeb(response.body), createWriteStream(file));
	console.log(`Downloaded ${versionCode}, signed by ${certificateSha256Hash}`);
}

const [versionCode, file] = process.argv.slice(2);

if (versionCode) {
	await download(versionCode, file);
}
else {
	const latest = await productionVersionCode();
	console.log(`Production track is at ${latest}`);
	await appendFile(GITHUB_OUTPUT, `version_code=${latest}\n`);
}
