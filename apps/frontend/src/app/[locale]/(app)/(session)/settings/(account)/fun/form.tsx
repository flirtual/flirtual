"use client";

import { useTranslations } from "next-intl";

import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import {
	InputLabel,
	InputSwitch
} from "~/components/inputs";
import { usePreferences } from "~/hooks/use-preferences";
import { useToast } from "~/hooks/use-toast";

export const FunForm: React.FC = () => {
	const toasts = useToast();
	const t = useTranslations();

	const [assistantVisible, setAssistantVisible] = usePreferences(
		"assistant_visible",
		false
	);
	const [, setAssistantPosition] = usePreferences(
		"assistant_position",
		{
			top: "auto",
			right: 20,
			bottom: 20,
			left: "auto"
		} as {
			top: number | string;
			right: number | string;
			bottom: number | string;
			left: number | string;
		}
	);
	const [, setAssistantDialogueIndex] = usePreferences(
		"assistant_dialogue_index",
		0
	);

	const [rankedMode, setRankedMode] = usePreferences(
		"ranked_mode",
		false
	);

	return (
		<Form
			fields={{
				assistant: assistantVisible === true,
				ranked: rankedMode === true
			}}
			className="flex flex-col gap-8"
			onSubmit={async ({ assistant, ranked }) => {
				if (assistant && !assistantVisible) {
					setAssistantVisible(true);
					setAssistantPosition(null);
				}
				else if (!assistant && assistantVisible) {
					setAssistantVisible(null);
					setAssistantPosition(null);
					setAssistantDialogueIndex(null);
				}

				setRankedMode(ranked);

				toasts.add(t("have_fun"));
			}}
		>
			{({ FormField }) => (
				<>
					<FormField name="assistant">
						{(field) => (
							<>
								<InputLabel
									{...field.labelProps}
									inline
									hint={t("april_fools_year", { year: 2025 })}
								>
									{t("enable_assistant")}
								</InputLabel>
								<InputSwitch {...field.props} />
							</>
						)}
					</FormField>
					<FormField name="ranked">
						{(field) => (
							<>
								<InputLabel
									{...field.labelProps}
									inline
									hint={t("april_fools_year", { year: 2024 })}
								>
									{t("enable_ranked_mode")}
								</InputLabel>
								<InputSwitch {...field.props} />
							</>
						)}
					</FormField>
					<FormButton>{t("update")}</FormButton>
				</>
			)}
		</Form>
	);
};
