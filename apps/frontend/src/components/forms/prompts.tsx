import { Pencil, Plus, X } from "lucide-react";
import { type Dispatch, type FC, useEffect, useState } from "react";

import { InputLabel, InputSelect, InputTextArea } from "~/components/inputs";
import { Button } from "~/components/button";
import {
	useAttributeList,
	useAttributeTranslation
} from "~/hooks/use-attribute-list";
import { DrawerOrDialog } from "~/components/drawer-or-dialog";
import { SortableGrid, SortableItem } from "~/components/forms/sortable";
import { groupBy, uniqueLast } from "~/utilities";

import { NewBadge } from "../badge";
import {
	DialogBody,
	DialogDescription,
	DialogHeader,
	DialogTitle
} from "../dialog/dialog";

import type { ProfilePrompt } from "~/api/user/profile";

const EditPromptDialog: FC<{
	dialogOpen: boolean;
	onDialogOpen: Dispatch<boolean>;
	value: ProfilePrompt | null;
	onChange: Dispatch<ProfilePrompt>;
	excludedPrompts?: Array<string>;
}> = ({
	value: initialValue,
	dialogOpen,
	onChange,
	onDialogOpen,
	excludedPrompts
}) => {
	const [value, setValue] = useState(initialValue);
	useEffect(() => setValue(initialValue), [initialValue]);

	const filteredPrompts = useAttributeList("prompt").filter(
		(promptId) => !excludedPrompts?.includes(promptId)
	);
	const tAttribute = useAttributeTranslation();

	return (
		<DrawerOrDialog open={dialogOpen} onOpenChange={onDialogOpen}>
			<>
				<DialogHeader>
					<DialogTitle>{initialValue ? "Edit" : "Add a"} prompt</DialogTitle>
					<DialogDescription className="sr-only"></DialogDescription>
				</DialogHeader>
				<DialogBody className="grid w-full gap-4">
					<InputSelect
						options={filteredPrompts.map((promptId) => ({
							id: promptId,
							name: tAttribute[promptId]?.name ?? promptId
						}))}
						value={value?.promptId}
						placeholder="Select a prompt"
						onChange={(id) => {
							const promptId = filteredPrompts.find(
								(promptId) => promptId === id
							);
							if (!promptId) return;

							setValue((value) => ({
								...(value || { response: "" }),
								promptId
							}));
						}}
					/>
					<InputTextArea
						className="resize-none"
						maxLength={1500}
						rows={8}
						value={value?.response || ""}
						onChange={(response) =>
							setValue(
								(value) =>
									({
										...(value || { prompt: null }),
										response
										// eslint-disable-next-line @typescript-eslint/no-explicit-any
									}) as any
							)
						}
					/>
					<Button
						disabled={!value || !value.promptId || !value.response}
						size="sm"
						className="ml-auto"
						onClick={() => {
							if (!value || !value.promptId || !value.response) return;

							onDialogOpen(false);
							onChange(value);
							setValue(null);
						}}
					>
						Add
					</Button>
				</DialogBody>
			</>
		</DrawerOrDialog>
	);
};

interface InputPromptsProps {
	value: Array<ProfilePrompt>;
	onChange: Dispatch<Array<ProfilePrompt>>;
	labelId: string;
	newBadge?: boolean;
}

export const InputPrompts: FC<InputPromptsProps> = (props) => {
	const [promptDialogOpen, setPromptDialogOpen] = useState(false);
	const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
	const tAttribute = useAttributeTranslation();

	return (
		<>
			<InputLabel
				className="items-center"
				htmlFor={props.labelId}
				hint={
					<Button
						size="sm"
						className="ml-auto gap-2"
						disabled={props.value.length >= 5}
						onClick={() => {
							setEditingPrompt(null);
							setPromptDialogOpen(true);
						}}
					>
						<span className="text-sm">Add</span>
						<Plus className="size-5" />
					</Button>
				}
			>
				Prompts {props.newBadge && <NewBadge />}
			</InputLabel>
			<SortableGrid
				onChange={(newOrder) => {
					const keyedValue = groupBy(props.value, ({ promptId }) => promptId);
					props.onChange(
						newOrder.map((id) => keyedValue[id]?.[0]).filter(Boolean)
					);
				}}
				values={props.value.map(({ promptId }) => promptId)}
			>
				<div className="mt-2 grid gap-4">
					{props.value.map(({ promptId, response }) => {
						return (
							<SortableItem key={promptId} id={promptId}>
								<div className="flex select-none flex-col gap-2 rounded-xl bg-white-40 p-4 shadow-brand-1 vision:bg-white-40/70 vision:text-black-80 dark:bg-black-60">
									<div className="flex justify-between">
										<InputLabel className="text-base opacity-70">
											{tAttribute[promptId]?.name ?? promptId}
										</InputLabel>
										<div
											className="flex shrink-0 gap-2 px-2"
											onMouseDown={(event) => event.stopPropagation()}
											onTouchStart={(event) => event.stopPropagation()}
										>
											<Button
												kind="tertiary"
												size="sm"
												onClick={() => {
													setEditingPrompt(promptId);
													setPromptDialogOpen(true);
												}}
												className="p-0 opacity-75 transition-all hocus:text-pink hocus:opacity-100"
											>
												<Pencil className="size-5" />
											</Button>
											<Button
												kind="tertiary"
												size="sm"
												onClick={() =>
													props.onChange(
														props.value.filter(
															(value) => value.promptId !== promptId
														)
													)
												}
												className="p-0 opacity-75 transition-all hocus:text-red-500 hocus:opacity-100"
											>
												<X className="size-5" />
											</Button>
										</div>
									</div>
									<span className="whitespace-pre-wrap break-all">
										{response}
									</span>
								</div>
							</SortableItem>
						);
					})}
				</div>
			</SortableGrid>
			<EditPromptDialog
				excludedPrompts={props.value
					.map(({ promptId }) => promptId)
					.filter((id) => id !== editingPrompt)}
				dialogOpen={promptDialogOpen}
				onDialogOpen={setPromptDialogOpen}
				value={
					editingPrompt
						? props.value.find(({ promptId }) => promptId === editingPrompt) ||
							null
						: null
				}
				onChange={(value) => {
					const newPrompts = uniqueLast(
						editingPrompt
							? props.value.map((prompt) =>
									prompt.promptId === editingPrompt ? value : prompt
								)
							: [...props.value, value],
						({ promptId }) => promptId
					);
					props.onChange(newPrompts);
					setEditingPrompt(null);
				}}
			/>
		</>
	);
};
