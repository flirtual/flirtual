export interface UuidModel {
	id: string;
}

export interface CreatedAtModel {
	createdAt: string;
}
export interface UpdatedAtModel {
	updatedAt: string;
}
export type DatedModel = CreatedAtModel & UpdatedAtModel;
