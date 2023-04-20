import { CreatedAtModel } from "./common";
import { fetch, NarrowFetchOptions } from "./exports";
import { ProspectKind } from "./matchmaking";

export type Message = CreatedAtModel & {
	id: string;
	content: ProspectKind;
	viewed: boolean;
	system: boolean;
	senderId: string;
};

export type Conversation = CreatedAtModel & {
	id: string;
	kind: ProspectKind;
	lastMessage: Message;
	userId: string;
};

export async function list(options: NarrowFetchOptions = {}): Promise<Array<Conversation>> {
	return fetch<Array<Conversation>>("get", "conversations", options);
}
