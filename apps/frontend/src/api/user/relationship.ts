import type { ProspectKind, ProspectRespondType } from "../matchmaking";

export type Relationship = {
	blocked: boolean;
	likedMe?: ProspectKind;
	type?: ProspectRespondType;
	kind?: ProspectKind;
	timeDiff?: number;
} & (
	| {
		matched: false;
		conversationId?: undefined;
	}
	| {
		matched: true;
		conversationId: string;
	}
);
