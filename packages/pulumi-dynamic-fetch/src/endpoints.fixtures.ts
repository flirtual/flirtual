import { types } from "./endpoints.ts";

// Trimmed from what typed-openapi generates for Chargebee's and RevenueCat's specs: each operation
// has its method, path, request format, parameters and responses, keyed by method then path.

interface WebhookEndpoint {
	id: string;
	name: string;
	url: string;
	enabled_events?: Array<string>;
}

interface WebhookEndpointFields {
	name: string;
	url: string;
	basic_auth_username?: string;
	basic_auth_password?: string;
	enabled_events?: Array<string>;
}

type WrappedEndpoint = { webhook_endpoint: WebhookEndpoint };

export interface ChargebeeEndpoints {
	get: {
		"/webhook_endpoints": {
			method: "GET";
			path: "/webhook_endpoints";
			requestFormat: "json";
			responseFormat: "json";
			parameters: { header?: Partial<{ "chargebee-business-entity-id": string }> };
			responses: { 200: { list: Array<WrappedEndpoint> } };
		};
		"/webhook_endpoints/{webhook-endpoint-id}": {
			method: "GET";
			path: "/webhook_endpoints/{webhook-endpoint-id}";
			requestFormat: "json";
			responseFormat: "json";
			parameters: { path: { "webhook-endpoint-id": string } };
			responses: { 200: WrappedEndpoint };
		};
	};
	post: {
		"/webhook_endpoints": {
			method: "POST";
			path: "/webhook_endpoints";
			requestFormat: "form-url";
			responseFormat: "json";
			parameters: {
				header?: Partial<{ "chargebee-business-entity-id": string }>;
				body: WebhookEndpointFields;
			};
			responses: { 200: WrappedEndpoint };
		};
		"/webhook_endpoints/{webhook-endpoint-id}": {
			method: "POST";
			path: "/webhook_endpoints/{webhook-endpoint-id}";
			requestFormat: "form-url";
			responseFormat: "json";
			parameters: { path: { "webhook-endpoint-id": string }; body: Partial<WebhookEndpointFields> };
			responses: { 200: WrappedEndpoint };
		};
		"/webhook_endpoints/{webhook-endpoint-id}/delete": {
			method: "POST";
			path: "/webhook_endpoints/{webhook-endpoint-id}/delete";
			requestFormat: "json";
			responseFormat: "json";
			parameters: { path: { "webhook-endpoint-id": string } };
			responses: { 200: WrappedEndpoint };
		};
	};
}

interface WebhookIntegration {
	object: "webhook_integration";
	id: string;
	project_id: string;
	name: string;
	url: string;
	environment?: "production" | "sandbox" | null;
}

interface CreateWebhookIntegrationInput {
	name: string;
	url: string;
	authorization_header?: string | null;
	environment?: "production" | "sandbox" | null;
}

type ProjectPath = { project_id: string };
type WebhookPath = { project_id: string; webhook_integration_id: string };
type Errors = { 404: { type: "resource_missing" } };

export interface RevenueCatEndpoints {
	get: {
		"/projects/{project_id}/integrations/webhooks": {
			method: "GET";
			path: "/projects/{project_id}/integrations/webhooks";
			requestFormat: "json";
			responseFormat: "json";
			parameters: { path: ProjectPath };
			responses: { 200: { items: Array<WebhookIntegration> } } & Errors;
		};
		"/projects/{project_id}/integrations/webhooks/{webhook_integration_id}": {
			method: "GET";
			path: "/projects/{project_id}/integrations/webhooks/{webhook_integration_id}";
			requestFormat: "json";
			responseFormat: "json";
			parameters: { path: WebhookPath };
			responses: { 200: WebhookIntegration } & Errors;
		};
		// Made up: a route naming its parameters differently from the inputs that fill them.
		"/webhooks/{project}/{webhook}": {
			method: "GET";
			path: "/webhooks/{project}/{webhook}";
			requestFormat: "json";
			responseFormat: "json";
			parameters: { path: { project: string; webhook: string } };
			responses: { 200: WebhookIntegration } & Errors;
		};
	};
	post: {
		"/projects/{project_id}/integrations/webhooks": {
			method: "POST";
			path: "/projects/{project_id}/integrations/webhooks";
			requestFormat: "json";
			responseFormat: "json";
			parameters: { path: ProjectPath; body: CreateWebhookIntegrationInput };
			responses: { 201: WebhookIntegration } & Errors;
		};
		"/projects/{project_id}/integrations/webhooks/{webhook_integration_id}": {
			method: "POST";
			path: "/projects/{project_id}/integrations/webhooks/{webhook_integration_id}";
			requestFormat: "json";
			responseFormat: "json";
			parameters: { path: WebhookPath; body: Partial<CreateWebhookIntegrationInput> };
			responses: { 200: WebhookIntegration } & Errors;
		};
	};
	delete: {
		"/projects/{project_id}/integrations/webhooks/{webhook_integration_id}": {
			method: "DELETE";
			path: "/projects/{project_id}/integrations/webhooks/{webhook_integration_id}";
			requestFormat: "json";
			responseFormat: "json";
			parameters: { path: WebhookPath };
			responses: { 204: unknown } & Errors;
		};
	};
}

export const chargebeeTypes = types<ChargebeeEndpoints>();
export const revenuecatTypes = types<RevenueCatEndpoints>();
