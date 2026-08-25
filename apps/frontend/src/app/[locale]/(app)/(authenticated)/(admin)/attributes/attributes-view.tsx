import { Plus, Save, Trash2, TriangleAlert } from "lucide-react";
import { Suspense, useState } from "react";
import type { FC } from "react";

import type { AttributeRow, AttributeType } from "~/api/attributes";
import { Attribute, editableAttributeTypes } from "~/api/attributes";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputSelect, InputText } from "~/components/inputs";
import { ModelCard } from "~/components/model-card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from "~/components/table";
import { TimeRelative } from "~/components/time-relative";
import { MinimalTooltip } from "~/components/tooltip";
import { useAttributeTranslation } from "~/hooks/use-attribute";
import { useToast } from "~/hooks/use-toast";
import { invalidate, useMutation, useQuery } from "~/query";

const attributeRowsKey = (type: AttributeType) => ["attribute-rows", type] as const;

function parseMetadata(value: string): Record<string, unknown> | null {
	const trimmed = value.trim();
	if (!trimmed) return null;

	const parsed: unknown = JSON.parse(trimmed);
	if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))
		throw new TypeError("Metadata must be a JSON object");

	return parsed as Record<string, unknown>;
}

const ColumnActions: FC<{ attribute: AttributeRow }> = ({ attribute }) => {
	const toasts = useToast();

	const deleteAttribute = useMutation({
		mutationFn: async (attributeId: string) => {
			await Attribute.delete(attributeId);
		},
		onSuccess: () => {
			toasts.add("Deleted attribute");
			invalidate({ queryKey: attributeRowsKey(attribute.type) });
			invalidate({ queryKey: ["config"] });
		},
		onError: () => {
			toasts.add("Couldn't delete attribute");
		}
	});

	return (
		<MinimalTooltip content="Delete attribute">
			<button
				className="text-red-500 hover:text-red-600 disabled:opacity-50"
				disabled={deleteAttribute.isPending}
				type="button"
				onClick={() => {
					// eslint-disable-next-line no-alert
					if (confirm(`Delete attribute "${attribute.id}"?`))
						deleteAttribute.mutate(attribute.id);
				}}
			>
				<Trash2 className="size-5" />
			</button>
		</MinimalTooltip>
	);
};

const AttributeRowView: FC<{ attribute: AttributeRow }> = ({ attribute }) => {
	const toasts = useToast();
	const tAttribute = useAttributeTranslation();

	const [order, setOrder] = useState(attribute.order?.toString() ?? "");
	const [metadata, setMetadata] = useState(
		attribute.metadata ? JSON.stringify(attribute.metadata) : ""
	);

	const name = tAttribute[attribute.id]?.name;
	const untranslated = name === attribute.id;

	const update = useMutation({
		mutationFn: () => Attribute.update(attribute.id, {
			order: order.trim() ? Number(order) : null,
			metadata: parseMetadata(metadata)
		}),
		onSuccess: () => {
			toasts.add("Updated attribute");
			invalidate({ queryKey: attributeRowsKey(attribute.type) });
			invalidate({ queryKey: ["config"] });
		},
		onError: (error) => {
			toasts.add(error instanceof SyntaxError || error instanceof TypeError
				? "Metadata must be valid JSON"
				: "Couldn't update attribute");
		}
	});

	const dirty = (attribute.order?.toString() ?? "") !== order
		|| (attribute.metadata ? JSON.stringify(attribute.metadata) : "") !== metadata;

	return (
		<TableRow>
			<TableCell className="select-children align-middle font-mono text-xs">
				{attribute.id}
			</TableCell>
			<TableCell className="select-children align-middle">
				{untranslated
					? (
							<span className="flex items-center gap-1 text-yellow-500">
								<TriangleAlert className="size-4" />
								Untranslated
							</span>
						)
					: name}
			</TableCell>
			<TableCell className="align-middle">
				<InputText
					className="w-16"
					inputMode="numeric"
					value={order}
					onChange={setOrder}
				/>
			</TableCell>
			<TableCell className="align-middle">
				<InputText
					className="font-mono text-xs"
					placeholder="null"
					value={metadata}
					onChange={setMetadata}
				/>
			</TableCell>
			<TableCell className="whitespace-nowrap align-middle">
				<TimeRelative value={attribute.updatedAt} />
			</TableCell>
			<TableCell className="align-middle">
				<div className="flex justify-end gap-2">
					{dirty && (
						<MinimalTooltip content="Save changes">
							<button
								className="text-green-500 hover:text-green-600 disabled:opacity-50"
								disabled={update.isPending}
								type="button"
								onClick={() => update.mutate()}
							>
								<Save className="size-5" />
							</button>
						</MinimalTooltip>
					)}
					<ColumnActions attribute={attribute} />
				</div>
			</TableCell>
		</TableRow>
	);
};

const AddAttributeForm: FC<{ type: AttributeType }> = ({ type }) => {
	const toasts = useToast();

	return (
		<div className="flex flex-col gap-2">
			<span className="text-lg font-semibold">
				Add new
				{" "}
				{type}
			</span>
			<Form
				fields={{
					id: "",
					order: "",
					metadata: ""
				}}
				className="flex w-full flex-col gap-2"
				onSubmit={async (body) => {
					await Attribute.create({
						type,
						...(body.id.trim() && { id: body.id.trim() }),
						...(body.order.trim() && { order: Number(body.order) }),
						metadata: parseMetadata(body.metadata)
					});

					toasts.add("Added attribute");
					invalidate({ queryKey: attributeRowsKey(type) });
					invalidate({ queryKey: ["config"] });
				}}
			>
				{({ FormField }) => (
					<>
						<div className="flex gap-2">
							<div className="flex-1">
								<FormField name="id">
									{(field) => (
										<InputText
											{...field.props}
											placeholder="id (optional)"
										/>
									)}
								</FormField>
							</div>
							<div className="w-24">
								<FormField name="order">
									{(field) => (
										<InputText {...field.props} inputMode="numeric" placeholder="order" />
									)}
								</FormField>
							</div>
						</div>
						<FormField name="metadata">
							{(field) => (
								<InputText
									{...field.props}
									className="font-mono text-xs"
									placeholder="metadata (optional)"
								/>
							)}
						</FormField>
						<FormButton className="self-start" Icon={Plus} size="sm">
							Add
						</FormButton>
					</>
				)}
			</Form>
		</div>
	);
};

const AttributeTable: FC<{ type: AttributeType }> = ({ type }) => {
	const attributes = useQuery({
		queryKey: attributeRowsKey(type),
		queryFn: ({ queryKey: [, type], signal }) => Attribute.listAll(type, { signal }),
		staleTime: 0,
		meta: { cacheTime: 0 }
	});

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className="w-48">Id</TableHead>
					<TableHead className="w-48">Name</TableHead>
					<TableHead className="w-24">Order</TableHead>
					<TableHead className="w-full">Metadata</TableHead>
					<TableHead className="w-28">Updated</TableHead>
					<TableHead className="w-16 text-right">Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody className="relative">
				{attributes.map((attribute) => (
					<AttributeRowView key={attribute.id} attribute={attribute} />
				))}
			</TableBody>
		</Table>
	);
};

export const AttributesView: FC = () => {
	const [type, setType] = useState<AttributeType>("game");

	return (
		<ModelCard
			data-block
			className="desktop:max-w-7xl"
			containerProps={{ className: "gap-8 min-h-screen" }}
			title="Attributes"
		>
			<div className="flex flex-col gap-4">
				<div className="flex flex-col gap-2">
					<span>Type</span>
					<InputSelect
						options={editableAttributeTypes.map((value) => ({ id: value, name: value }))}
						value={type}
						onChange={(value) => setType(value as AttributeType)}
					/>
				</div>

				<AddAttributeForm type={type} />

				<Suspense fallback={<span className="brightness-75">Loading...</span>}>
					<AttributeTable type={type} />
				</Suspense>
			</div>
		</ModelCard>
	);
};
