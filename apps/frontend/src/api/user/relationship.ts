import type { ProspectKind, ProspectRespondType } from "../matchmaking";

export type Relationship = {
	blocked: boolean;
	likedMe?: ProspectKind;
	type?: ProspectRespondType;
	kind?: ProspectKind;
	timeDiff?: number;
	distance?: string;
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
