const encoder = new TextEncoder();
const keys = new Map<string, Promise<CryptoKey>>();

function key(secret: string) {
	let key = keys.get(secret);
	if (!key) {
		key = crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
		keys.set(secret, key);
	}
	return key;
}

const toBase64Url = (bytes: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

function fromBase64Url(value: string): Uint8Array | null {
	try {
		const binary = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
		return Uint8Array.from(binary, (character) => character.charCodeAt(0));
	}
	catch {
		return null;
	}
}

// Proxy URLs are signed so the worker only ever relays what /unfurl chose, rather than being an
// open proxy that serves anyone's content from our domain.
export async function sign(secret: string, purpose: string, value: string): Promise<string> {
	return toBase64Url(await crypto.subtle.sign("HMAC", await key(secret), encoder.encode(`${purpose}\n${value}`)));
}

export async function verify(secret: string, purpose: string, value: string, signature: string): Promise<boolean> {
	const bytes = fromBase64Url(signature);
	return !!bytes && crypto.subtle.verify("HMAC", await key(secret), bytes, encoder.encode(`${purpose}\n${value}`));
}
