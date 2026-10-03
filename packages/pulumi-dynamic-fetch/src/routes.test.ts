import { Api, FetchError } from "./api.ts";
import { afterEach, describe, expect, it, vi } from "vitest";

interface WebhookEndpoint {
	id: string;
	name: string;
	url: string;
	enabled_events?: Array<string>;
}

type WebhookEndpointInputs = Pick<WebhookEndpoint, "name" | "url" | "enabled_events">;

interface WebhookIntegration {
	id: string;
	project_id: string;
	name: string;
	url: string;
}

type WebhookIntegrationInputs = Pick<WebhookIntegration, "project_id" | "name" | "url">;

import { operationsFor } from "./routes.ts";

function respond(status: number, body?: unknown) {
	return new Response(body === undefined ? null : JSON.stringify(body), {
		status,
		headers: { "content-type": "application/json" },
	});
}

// Recorded as sent, whether fetch was called with a URL and init or with a Request.
interface Sent {
	method: string;
	url: string;
	body: string | undefined;
}

function stubFetch(...responses: Array<Response>) {
	const sent: Array<Sent> = [];
	vi.stubGlobal("fetch", async (input: URL | Request, init?: RequestInit) => {
		const request = new Request(input, init);
		const body = await request.text();
		sent.push({ method: request.method, url: request.url, body: body === "" ? undefined : body });
		return responses.shift()!;
	});
	return sent;
}

afterEach(() => {
	vi.unstubAllGlobals();
});

const endpoint = { id: "we_1", name: "api", url: "https://api.example/v1/chargebee" };

const chargebee = operationsFor<WebhookEndpointInputs, WebhookEndpoint>({
	create: "post /webhook_endpoints",
	read: "get /webhook_endpoints/{webhook-endpoint-id}",
	update: "post /webhook_endpoints/{webhook-endpoint-id}",
	delete: "post /webhook_endpoints/{webhook-endpoint-id}/delete",
	model: "webhook_endpoint",
	inputs: ["name", "url", "enabled_events"],
});

const chargebeeApi = new Api({
	baseUrl: "https://site.chargebee.com/api/v2",
	headers: {},
	encoding: "form",
});

describe("a resource whose responses wrap the object in a model key", () => {
	const inputs = { name: "api", url: "https://api.example/v1/chargebee", enabled_events: ["a"] };

	it("creates through the create route, unwrapping the model and taking its id", async () => {
		const fetch = stubFetch(respond(200, { webhook_endpoint: endpoint }));

		const live = await chargebee.create(chargebeeApi, inputs);

		expect(live).toEqual(endpoint);
		expect(chargebee.id(live)).toBe("we_1");
		expect(fetch).toEqual([
			{
				method: "POST",
				url: "https://site.chargebee.com/api/v2/webhook_endpoints",
				body: "name=api&url=https%3A%2F%2Fapi.example%2Fv1%2Fchargebee&enabled_events%5B0%5D=a",
			},
		]);
	});

	it("labels a form body with the form content type", async () => {
		const types: Array<string | null> = [];
		vi.stubGlobal("fetch", async (input: URL | Request, init?: RequestInit) => {
			types.push(new Request(input, init).headers.get("content-type"));
			return respond(200, { webhook_endpoint: endpoint });
		});

		await chargebee.create(chargebeeApi, inputs);

		expect(types).toEqual(["application/x-www-form-urlencoded"]);
	});

	it("reads through the read route with the id in its path parameter", async () => {
		const fetch = stubFetch(respond(200, { webhook_endpoint: endpoint }));

		expect(await chargebee.read(chargebeeApi, "we_1", inputs)).toEqual(endpoint);
		expect(fetch).toEqual([
			{
				method: "GET",
				url: "https://site.chargebee.com/api/v2/webhook_endpoints/we_1",
				body: undefined,
			},
		]);
	});

	it("reads the listed inputs back off the live object", () => {
		expect(
			chargebee.inputs!(
				{ ...endpoint, enabled_events: ["a"] },
				{ name: "stored", url: "https://stored.example" },
			),
		).toEqual({
			name: "api",
			url: "https://api.example/v1/chargebee",
			enabled_events: ["a"],
		});
	});

	it("reads a missing resource as gone", async () => {
		stubFetch(respond(404, { message: "not found" }));

		expect(await chargebee.read(chargebeeApi, "we_1", inputs)).toBeUndefined();
	});

	it("updates through the update route with the inputs as its body", async () => {
		const fetch = stubFetch(respond(200, { webhook_endpoint: endpoint }));

		expect(
			await chargebee.update!(chargebeeApi, "we_1", inputs, { ...inputs, output: endpoint }),
		).toEqual(endpoint);
		expect(fetch).toEqual([
			{
				method: "POST",
				url: "https://site.chargebee.com/api/v2/webhook_endpoints/we_1",
				body: "name=api&url=https%3A%2F%2Fapi.example%2Fv1%2Fchargebee&enabled_events%5B0%5D=a",
			},
		]);
	});

	it("deletes through the delete route, with no body", async () => {
		const fetch = stubFetch(respond(200, { webhook_endpoint: endpoint }));

		await chargebee.delete(chargebeeApi, "we_1", inputs);

		expect(fetch).toEqual([
			{
				method: "POST",
				url: "https://site.chargebee.com/api/v2/webhook_endpoints/we_1/delete",
				body: undefined,
			},
		]);
	});
});

const integration = {
	object: "webhook_integration" as const,
	id: "wh 1",
	project_id: "proj_1",
	name: "api",
	url: "https://api.example/v1/revenuecat",
};

const revenuecat = operationsFor<WebhookIntegrationInputs, WebhookIntegration>({
	create: "post /projects/{project_id}/integrations/webhooks",
	read: "get /projects/{project_id}/integrations/webhooks/{webhook_integration_id}",
	update: "post /projects/{project_id}/integrations/webhooks/{webhook_integration_id}",
	delete: "delete /projects/{project_id}/integrations/webhooks/{webhook_integration_id}",
});

const revenuecatApi = new Api({
	baseUrl: "https://api.revenuecat.com/v2",
	headers: {},
	encoding: "json",
});

describe("a resource with another path parameter besides its id", () => {
	const inputs = { project_id: "proj_1", name: "api", url: "https://api.example/v1/revenuecat" };

	it("fills other path parameters from the inputs and leaves them out of the body", async () => {
		const fetch = stubFetch(respond(201, integration));

		const live = await revenuecat.create(revenuecatApi, inputs);

		expect(live).toEqual(integration);
		expect(fetch).toEqual([
			{
				method: "POST",
				url: "https://api.revenuecat.com/v2/projects/proj_1/integrations/webhooks",
				body: '{"name":"api","url":"https://api.example/v1/revenuecat"}',
			},
		]);
	});

	it("encodes path parameters, and fills the id into its own parameter", async () => {
		const fetch = stubFetch(respond(200, integration), respond(200, integration), respond(204));

		await revenuecat.read(revenuecatApi, "wh 1", inputs);
		await revenuecat.update!(revenuecatApi, "wh 1", inputs, { ...inputs, output: integration });
		await revenuecat.delete(revenuecatApi, "wh 1", inputs);

		expect(fetch).toEqual([
			{
				method: "GET",
				url: "https://api.revenuecat.com/v2/projects/proj_1/integrations/webhooks/wh%201",
				body: undefined,
			},
			{
				method: "POST",
				url: "https://api.revenuecat.com/v2/projects/proj_1/integrations/webhooks/wh%201",
				body: '{"name":"api","url":"https://api.example/v1/revenuecat"}',
			},
			{
				method: "DELETE",
				url: "https://api.revenuecat.com/v2/projects/proj_1/integrations/webhooks/wh%201",
				body: undefined,
			},
		]);
	});

	it("throws a FetchError with the status and body when the API refuses", async () => {
		stubFetch(respond(422, { message: "url is invalid" }));

		const error = await revenuecat.create(revenuecatApi, inputs).catch((error: unknown) => error);

		expect(error).toBeInstanceOf(FetchError);
		expect(error).toMatchObject({
			status: 422,
			method: "POST",
			url: "https://api.revenuecat.com/v2/projects/proj_1/integrations/webhooks",
			body: '{"message":"url is invalid"}',
		});
	});

	it("fails loudly when a path parameter has no value", async () => {
		stubFetch(respond(201, integration));

		await expect(
			revenuecat.create(revenuecatApi, { name: "api", url: "https://x" } as typeof inputs),
		).rejects.toThrow('No value for path parameter "project_id"');
	});
});

describe("routes written out as objects", () => {
	const inputs = { project_id: "proj_1", name: "api", url: "https://api.example/v1/revenuecat" };

	const renamed = operationsFor<WebhookIntegrationInputs, WebhookIntegration>({
		create: { method: "post", path: "/projects/{project_id}/integrations/webhooks" },
		read: {
			method: "get",
			path: "/webhooks/{project}/{webhook}",
			pathParams: { project: "project_id" },
		},
		delete: "delete /projects/{project_id}/integrations/webhooks/{webhook_integration_id}",
	});

	it("calls the same route as the short form", async () => {
		const fetch = stubFetch(respond(201, integration));

		await renamed.create(revenuecatApi, inputs);

		expect(fetch).toEqual([
			{
				method: "POST",
				url: "https://api.revenuecat.com/v2/projects/proj_1/integrations/webhooks",
				body: '{"name":"api","url":"https://api.example/v1/revenuecat"}',
			},
		]);
	});

	it("fails rather than guess when more than one parameter could take the id", async () => {
		const ambiguous = operationsFor<WebhookIntegrationInputs, WebhookIntegration>({
			create: "post /projects/{project_id}/integrations/webhooks",
			read: "get /webhooks/{project}/{webhook}",
			delete: "delete /projects/{project_id}/integrations/webhooks/{webhook_integration_id}",
		});

		await expect(ambiguous.read(revenuecatApi, "wh_1", inputs)).rejects.toThrow(
			"No input fills {project} or {webhook} in /webhooks/{project}/{webhook}, so either could take the id.",
		);
	});

	it("fills a renamed parameter from the input `pathParams` names", async () => {
		const fetch = stubFetch(respond(200, integration));

		await renamed.read(revenuecatApi, "wh_1", inputs);

		expect(fetch).toEqual([
			{ method: "GET", url: "https://api.revenuecat.com/v2/webhooks/proj_1/wh_1", body: undefined },
		]);
	});
});
