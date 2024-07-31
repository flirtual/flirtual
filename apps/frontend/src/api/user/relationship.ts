import type { ProspectKind, ProspectRespondType } from "../matchmaking";

export type Relationship = {
	blocked: boolean;
	likedMe?: ProspectKind;
	type?: ProspectRespondType;
	kind?: ProspectKind;
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
