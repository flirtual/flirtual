import type { Channel } from "phoenix";

import { chatSocket } from "~/hooks/use-chat";
import { toCamelObject } from "~/utilities";

import type { LinkSpan } from "./markup";

export const maxMessageLength = 10_000;

export interface ChatReply {
	id: string;
	seq: number;
	senderId: string | null;
	text: string;
	links: Array<LinkSpan>;
}

export interface ChatReaction {
	emoji: string;
	userIds: Array<string>;
}

export interface ChatMessage {
	id: string;
	seq: number;
	version: number;
	system: boolean;
	kind: "match" | null;
	senderId: string | null;
	clientId: string | null;
	text: string;
	links: Array<LinkSpan>;
	replyTo: ChatReply | null;
	gif: { width: number; height: number; preview?: string } | null;
	reactions: Array<ChatReaction>;
	editedAt: string | null;
	createdAt: string;
	status?: "failed" | "sending";
}

interface Tombstone {
	id: string;
	seq: number;
	version: number;
	deleted: true;
}

type Incoming = ChatMessage | Tombstone;

interface Snapshot {
	seq?: number;
	readOnly?: boolean;
	messages?: Array<Incoming>;
	changes?: Array<Incoming>;
	more?: boolean;
}

export interface ChatState {
	status: "closed" | "connecting" | "ready";
	messages: Array<ChatMessage>;
	more: boolean;
	loadingOlder: boolean;
	readOnly: boolean;
}

export interface Draft {
	text: string;
	replyTo?: ChatMessage | null;
	gif?: { width: number; height: number; preview?: string };
}

const pushTimeout = 15_000;
const retryDelay = 5000;
const sendWindow = 30_000;
const readDelay = 300;
const revealPages = 3;

const isTombstone = (message: Incoming): message is Tombstone => "deleted" in message;

export class ChatStore {
	public state: ChatState = { status: "connecting", messages: [], more: false, loadingOlder: false, readOnly: false };

	private channel: Channel | null = null;
	private confirmed: Array<ChatMessage> = [];
	private pending: Array<ChatMessage> = [];
	private sending = new Set<string>();
	private seq = 0;
	private more = false;
	private loadingOlder = false;
	private loaded = false;
	private readOnly = false;
	private closed = false;
	private subscribers = new Set<() => void>();
	private readTimer: ReturnType<typeof setTimeout> | undefined;
	private retryTimer: ReturnType<typeof setTimeout> | undefined;
	private deadlines = new Map<string, ReturnType<typeof setTimeout>>();

	public constructor(public readonly conversationId: string, public readonly userId: string) {}

	public subscribe = (subscriber: () => void) => {
		this.subscribers.add(subscriber);
		return () => this.subscribers.delete(subscriber);
	};

	public getState = () => this.state;

	private publish() {
		this.state = {
			status: this.closed ? "closed" : this.loaded ? "ready" : "connecting",
			messages: [...this.confirmed, ...this.pending],
			more: this.more,
			loadingOlder: this.loadingOlder,
			readOnly: this.readOnly
		};
		for (const subscriber of this.subscribers) subscriber();
	}

	public join() {
		if (this.channel || this.closed) return;

		const channel = chatSocket(this.userId).channel(`conversation:${this.conversationId}`, () => this.loaded ? { after: this.seq } : {});
		this.channel = channel;

		channel.on("message", ({ message }: { message: unknown }) => this.receive(toCamelObject<Incoming>(message)));
		channel.on("closed", () => this.close());

		channel.join()
			.receive("ok", (reply: unknown) => {
				this.apply(toCamelObject<Snapshot>(reply));
				this.flush();
				this.read();
			})
			.receive("error", ({ reason }: { reason?: string }) => {
				if (reason === "not_found") this.close();
			});
	}

	public leave() {
		clearTimeout(this.readTimer);
		clearTimeout(this.retryTimer);
		for (const timer of this.deadlines.values()) clearTimeout(timer);
		this.deadlines.clear();
		this.channel?.leave();
		this.channel = null;
		this.sending.clear();
	}

	private close() {
		this.closed = true;
		this.leave();
		this.publish();
	}

	private apply({ seq, readOnly, messages, changes, more }: Snapshot) {
		if (readOnly !== undefined) this.readOnly = readOnly;

		if (messages) {
			this.confirmed = messages.filter((message): message is ChatMessage => !isTombstone(message));
			this.more = !!more;
		}
		for (const change of changes ?? []) this.merge(change);

		this.seq = Math.max(seq ?? 0, this.seq, ...[...messages ?? [], ...changes ?? []].map(({ version }) => version));
		this.loaded = true;
		this.settle();
		this.publish();
	}

	private settle() {
		const confirmed = new Set(this.confirmed.map(({ clientId }) => clientId));
		this.pending = this.pending.filter(({ clientId }) => !confirmed.has(clientId));
	}

	private merge(message: Incoming) {
		const index = this.confirmed.findIndex(({ id }) => id === message.id);

		if (isTombstone(message)) {
			if (index !== -1) this.confirmed.splice(index, 1);
			this.confirmed = this.confirmed.map((other) => other.replyTo?.id === message.id ? { ...other, replyTo: null } : other);
			return;
		}

		if (index !== -1) {
			if (this.confirmed[index]!.version < message.version) this.confirmed[index] = message;
			this.confirmed = [...this.confirmed];
			return;
		}

		const oldest = this.confirmed[0];
		if (oldest && message.seq < oldest.seq && this.more) return;

		this.confirmed = [...this.confirmed, message].sort((a, b) => a.seq - b.seq);
	}

	private receive(message: Incoming) {
		if (!this.loaded) return;

		if (message.version > this.seq + 1) this.catchUp();
		else this.seq = Math.max(this.seq, message.version);

		this.merge(message);
		this.settle();
		this.publish();

		if (!isTombstone(message) && message.senderId !== this.userId) this.read();
	}

	private catchUp() {
		this.channel?.push("changes", { after: this.seq }).receive("ok", (reply: unknown) => this.apply(toCamelObject<Snapshot>(reply)));
	}

	private read() {
		if (this.readOnly) return;

		clearTimeout(this.readTimer);
		this.readTimer = setTimeout(() => {
			if (document.visibilityState === "visible") this.channel?.push("read", { seq: this.seq });
		}, readDelay);
	}

	private request(event: string, payload: object): Promise<ChatMessage | null> {
		return new Promise((resolve, reject) => {
			if (!this.channel) return reject(new Error("offline"));

			this.channel.push(event, payload, pushTimeout)
				.receive("ok", ({ message }: { message?: unknown }) => {
					if (!message) return resolve(null);

					const received = toCamelObject<Incoming>(message);
					this.merge(received);
					this.settle();
					this.publish();
					resolve(isTombstone(received) ? null : received);
				})
				.receive("error", ({ reason }: { reason?: string }) => reject(new Error(reason ?? "internal_server_error")))
				.receive("timeout", () => reject(new Error("timeout")));
		});
	}

	public send({ text, replyTo, gif }: Draft) {
		const clientId = crypto.randomUUID();

		this.pending = [...this.pending, {
			id: clientId,
			seq: Number.MAX_SAFE_INTEGER,
			version: 0,
			system: false,
			kind: null,
			senderId: this.userId,
			clientId,
			text,
			links: gif ? [{ start: 0, length: text.length }] : [],
			replyTo: replyTo ? { id: replyTo.id, seq: replyTo.seq, senderId: replyTo.senderId, text: replyTo.text, links: replyTo.links } : null,
			gif: gif ?? null,
			reactions: [],
			editedAt: null,
			createdAt: new Date().toISOString(),
			status: "sending"
		}];
		this.expireLater(clientId);
		this.publish();
		this.flush();

		return clientId;
	}

	public retry(clientId: string) {
		this.pending = this.pending.map((message) => message.clientId === clientId ? { ...message, status: "sending" } : message);
		this.expireLater(clientId);
		this.publish();
		this.flush();
	}

	private clearDeadline(clientId: string) {
		clearTimeout(this.deadlines.get(clientId));
		this.deadlines.delete(clientId);
	}

	private expireLater(clientId: string) {
		this.clearDeadline(clientId);
		this.deadlines.set(clientId, setTimeout(() => this.fail(clientId), sendWindow));
	}

	private fail(clientId: string) {
		this.clearDeadline(clientId);
		if (!this.pending.some((message) => message.clientId === clientId && message.status === "sending")) return;

		this.pending = this.pending.map((message) => message.clientId === clientId ? { ...message, status: "failed" } : message);
		this.publish();
	}

	public discard(clientId: string) {
		this.pending = this.pending.filter((message) => message.clientId !== clientId);
		this.clearDeadline(clientId);
		this.publish();
	}

	private flush() {
		if (!this.channel || !this.loaded) return;

		for (const message of this.pending) {
			const { clientId } = message;
			if (message.status !== "sending" || !clientId || this.sending.has(clientId)) continue;

			this.sending.add(clientId);
			this.request("send", { text: message.text, client_id: clientId, reply_to_id: message.replyTo?.id, gif: message.gif })
				.then(() => {
					this.sending.delete(clientId);
					this.clearDeadline(clientId);
				})
				.catch((reason: Error) => {
					this.sending.delete(clientId);

					if (reason.message === "timeout" || reason.message === "offline" || reason.message === "busy") {
						clearTimeout(this.retryTimer);
						this.retryTimer = setTimeout(() => this.flush(), retryDelay);
						return;
					}

					this.fail(clientId);
					this.onError?.(reason.message);
				});
		}
	}

	private onError?: (reason: string) => void;

	public handleErrors(handler: (reason: string) => void) {
		this.onError = handler;
	}

	private change(event: string, payload: object): Promise<boolean> {
		return this.request(event, payload).then(() => true, (reason: Error) => {
			this.onError?.(reason.message);
			return false;
		});
	}

	public edit(id: string, text: string) {
		return this.change("edit", { id, text });
	}

	public remove(id: string) {
		return this.change("delete", { id });
	}

	public react(id: string, emoji: string, add: boolean) {
		return this.change("react", { id, emoji, add });
	}

	public loadOlder(from?: number): Promise<void> {
		const oldest = this.confirmed[0];
		if (!this.channel || !oldest || !this.more || this.loadingOlder) return Promise.resolve();

		this.loadingOlder = true;
		this.publish();

		return new Promise((resolve) => {
			const finish = () => {
				this.loadingOlder = false;
				this.publish();
				resolve();
			};

			this.channel!.push("history", { before: oldest.seq, from }, pushTimeout)
				.receive("ok", (reply: unknown) => {
					const { messages = [], more } = toCamelObject<Snapshot>(reply);
					const known = new Set(this.confirmed.map(({ id }) => id));
					this.confirmed = [...messages.filter((message): message is ChatMessage => !isTombstone(message) && !known.has(message.id)), ...this.confirmed];
					this.more = !!more;
					finish();
				})
				.receive("error", finish)
				.receive("timeout", finish);
		});
	}

	public async reveal(seq: number): Promise<boolean> {
		const loaded = () => this.confirmed.some((message) => message.seq === seq);

		for (let page = 0; page < revealPages && !loaded() && this.more; page++)
			await this.loadOlder(Math.max(seq - 5, 0));

		return loaded();
	}
}
