import { Pencil, Plus, X } from "lucide-react";
import { type Dispatch, type FC, useEffect, useState } from "react";

import { InputLabel, InputSelect, InputTextArea } from "~/components/inputs";
import { Button } from "~/components/button";
import { useAttributeList } from "~/hooks/use-attribute-list";
import { DrawerOrDialog } from "~/components/drawer-or-dialog";
import { SortableGrid, SortableItem } from "~/components/forms/sortable";
import { groupBy, uniqueLast } from "~/utilities";

import { NewBadge } from "../badge";
import { DialogBody, DialogHeader, DialogTitle } from "../dialog/dialog";

import type { ProfilePrompt } from "~/api/user/profile/prompts";

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

	const availablePrompts = useAttributeList("prompt").filter(
		(prompt) => !excludedPrompts?.includes(prompt.id)
	);

	return (
		<DrawerOrDialog open={dialogOpen} onOpenChange={onDialogOpen}>
			<>
				<DialogHeader>
					<DialogTitle>{initialValue ? "Edit" : "Add a"} prompt</DialogTitle>
				</DialogHeader>
				<DialogBody className="grid w-full gap-4">
					<InputSelect
						options={availablePrompts}
						value={value?.prompt.id}
						placeholder="Select a prompt"
						onChange={(id) => {
							const prompt = availablePrompts.find(
								(prompt) => prompt.id === id
							);
							if (!prompt) return;

							setValue((value) => ({
								...(value || { response: "" }),
								prompt
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
										...(value || { prompt: { id: null } }),
										response
										// eslint-disable-next-line @typescript-eslint/no-explicit-any
									}) as any
							)
						}
					/>
					<Button
						disabled={!value || !value.prompt.id || !value.response}
						size="sm"
						className="ml-auto"
						onClick={() => {
							if (!value || !value.prompt.id || !value.response) return;

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
					const keyedValue = groupBy(props.value, ({ prompt }) => prompt.id);
					props.onChange(newOrder.map((id) => keyedValue[id]?.[0]).filter(Boolean));
				}}
				values={props.value.map(({ prompt }) => prompt.id)}
			>
				<div className="mt-2 grid gap-4">
					{props.value.map(({ prompt, response }) => {
						return (
							<SortableItem key={prompt.id} id={prompt.id}>
								<div className="flex select-none flex-col gap-2 rounded-xl bg-white-40 p-4 shadow-brand-1 vision:bg-white-40/70 vision:text-black-80 dark:bg-black-60">
									<div className="flex justify-between">
										<InputLabel className="text-base opacity-70">
											{prompt.name}
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
													setEditingPrompt(prompt.id);
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
															({ prompt: { id } }) => id !== prompt.id
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
					.map(({ prompt }) => prompt.id)
					.filter((id) => id !== editingPrompt)}
				dialogOpen={promptDialogOpen}
				onDialogOpen={setPromptDialogOpen}
				value={
					editingPrompt
						? props.value.find(({ prompt }) => prompt.id === editingPrompt) ||
							null
						: null
				}
				onChange={(value) => {
					const newPrompts = uniqueLast(
						editingPrompt
							? props.value.map((prompt) =>
									prompt.prompt.id === editingPrompt ? value : prompt
								)
							: [...props.value, value],
						({ prompt }) => prompt.id
					);
					props.onChange(newPrompts);
					setEditingPrompt(null);
				}}
			/>
		</>
	);
};
