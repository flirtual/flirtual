import { ProspectKind, ProspectRespondType } from "../matchmaking";

export interface Relationship {
	blocked: boolean;
	matched: boolean;
	likedMe?: ProspectKind;
	type?: ProspectRespondType;
	kind?: ProspectKind;
}
