import { DatedModel } from "./common";

export type Session = DatedModel & {
	userId: string;
};
