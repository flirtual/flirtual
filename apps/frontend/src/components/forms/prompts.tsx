import { useSuspenseQuery } from "@tanstack/react-query";
import { Pencil, Plus, X } from "lucide-react";
import { useState } from "react";
import type { Dispatch, FC } from "react";
import { useTranslation } from "react-i18next";
import { groupBy, prop, uniqueBy } from "remeda";

import { byId, promptsOptions } from "~/api/data";
import type { ProfilePrompt } from "~/api/user/profile";
import { Button } from "~/components/button";
import { DrawerOrDialog } from "~/components/drawer-or-dialog";
import { SortableGrid, SortableItem } from "~/components/forms/sortable";
import { InputLabel, InputSelect, InputTextArea } from "~/components/inputs";
import { useLocale } from "~/i18n";

import {
	DialogBody,
	DialogDescription,
	DialogHeader,
	DialogTitle
} from "../dialog/dialog";

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
	const [editing, setEditing] = useState(initialValue);
	if (editing !== initialValue) {
		setEditing(initialValue);
		setValue(initialValue);
	}

	const [locale] = useLocale();
	const { data: prompts } = useSuspenseQuery(promptsOptions({ locale }));
	const promptsById = byId(prompts);

	const filteredPrompts = prompts
		.map(({ id }) => id)
		.filter((prompt) => !excludedPrompts?.includes(prompt));
	const { t } = useTranslation();

	return (
		<DrawerOrDialog open={dialogOpen} onOpenChange={onDialogOpen}>
			<>
				<DialogHeader>
					<DialogTitle>
						{t(initialValue ? "edit_prompt" : "add_a_prompt")}
					</DialogTitle>
					<DialogDescription className="sr-only" />
				</DialogHeader>
				<DialogBody className="grid gap-4">
					<InputSelect
						options={filteredPrompts.map((prompt) => ({
							id: prompt,
							name: promptsById[prompt]?.name ?? prompt
						}))}
						placeholder={t("select_a_prompt")}
						value={value?.prompt}
						onChange={(id) => {
							const prompt = filteredPrompts.find(
								(prompt) => prompt === id
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
										...(value || { prompt: null }),
										response
									}) as any
							)}
					/>
					<Button
						className="ml-auto"
						disabled={!value || !value.prompt || !value.response}
						onClick={() => {
							if (!value || !value.prompt || !value.response) return;

							onDialogOpen(false);
							onChange(value);
							setValue(null);
						}}
					>
						{t("add")}
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
}

export const InputPrompts: FC<InputPromptsProps> = (props) => {
	const [promptDialogOpen, setPromptDialogOpen] = useState(false);
	const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
	const { t } = useTranslation();
	const [locale] = useLocale();
	const { data: prompts } = useSuspenseQuery({ ...promptsOptions({ locale }), select: byId });

	return (
		<>
			<InputLabel
				hint={(
					<Button
						className="ml-auto gap-2"
						disabled={props.value.length >= 5}
						onClick={() => {
							setEditingPrompt(null);
							setPromptDialogOpen(true);
						}}
					>
						<span className="text-sm">{t("add")}</span>
						<Plus className="size-5" />
					</Button>
				)}
				htmlFor={props.labelId}
			>
				{t("prompts")}
			</InputLabel>
			<SortableGrid
				values={props.value.map(({ prompt }) => prompt)}
				onChange={(newOrder) => {
					const keyedValue = groupBy(props.value, ({ prompt }) => prompt);
					props.onChange(
						newOrder.map((id) => keyedValue[id]?.[0]).filter(Boolean)
					);
				}}
			>
				<div className="mt-2 grid gap-4">
					{props.value.map(({ prompt, response }) => {
						return (
							<SortableItem id={prompt} key={prompt}>
								<div className="flex flex-col gap-2 rounded-xl bg-white-40 p-4 shadow-brand-1 dark:bg-black-60 vision:bg-white-40/70 vision:text-black-80">
									<div className="flex justify-between">
										<InputLabel className="text-base opacity-70">
											{prompts[prompt]?.name ?? prompt}
										</InputLabel>
										<div
											className="flex shrink-0 gap-2 px-2"
											onMouseDown={(event) => event.stopPropagation()}
											onTouchStart={(event) => event.stopPropagation()}
										>
											<Button
												className="opacity-75 transition-all hocus:text-pink hocus:opacity-100"
												kind="tertiary"
												size={false}
												onClick={() => {
													setEditingPrompt(prompt);
													setPromptDialogOpen(true);
												}}
											>
												<Pencil className="size-5" />
											</Button>
											<Button
												className="opacity-75 transition-all hocus:text-red-500 hocus:opacity-100"
												kind="tertiary"
												size={false}
												onClick={() =>
													props.onChange(
														props.value.filter(
															(value) => value.prompt !== prompt
														)
													)}
											>
												<X className="size-5" />
											</Button>
										</div>
									</div>
									<span className="break-all whitespace-pre-wrap">
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
					.map(({ prompt }) => prompt)
					.filter((id) => id !== editingPrompt)}
				value={
					editingPrompt
						? props.value.find(({ prompt }) => prompt === editingPrompt)
						|| null
						: null
				}
				dialogOpen={promptDialogOpen}
				onChange={(value) => {
					const newPrompts = uniqueBy(
						editingPrompt
							? props.value.map((existing) =>
									existing.prompt === editingPrompt ? value : existing
								)
							: [...props.value, value].reverse(),
						prop("prompt")
					);
					props.onChange(newPrompts);
					setEditingPrompt(null);
				}}
				onDialogOpen={setPromptDialogOpen}
			/>
		</>
	);
};
