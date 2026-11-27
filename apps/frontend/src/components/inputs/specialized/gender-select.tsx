import { useSuspenseQuery } from "@tanstack/react-query";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";

import { gendersOptions } from "~/api/data";
import type { InputProps } from "~/hooks/use-input-form";
import { useLocale } from "~/i18n";

import { InputAutocomplete } from "../autocomplete";
import { InputCheckbox } from "../checkbox";
import { InputCheckboxList } from "../checkbox-list";
import { InputLabel } from "../label";

export type InputGenderSelectProps = Pick<InputProps<string, Array<string>>, "disabled" | "id" | "onChange" | "value">;

// The other-genders checkbox only shows the autocomplete, so it isn't part of the value.
export function InputGenderSelect({ value, onChange, ...props }: InputGenderSelectProps) {
	const { t } = useTranslation();
	const [locale] = useLocale();
	const { data: genders } = useSuspenseQuery(gendersOptions({ locale }));
	const othersId = useId();

	const simpleIds = new Set(genders.filter((gender) => gender.simple).map((gender) => gender.id));
	const simple = value.filter((id) => simpleIds.has(id));
	const others = value.filter((id) => !simpleIds.has(id));

	const [showOthers, setShowOthers] = useState(others.length > 0);

	return (
		<div className="flex flex-col gap-2">
			<InputCheckboxList
				items={genders
					.filter((gender) => simpleIds.has(gender.id))
					.map((gender) => ({
						conflicts: gender.conflicts ?? [],
						key: gender.id,
						label: gender.name
					}))}
				value={simple}
				onChange={(next) => onChange([...next, ...others])}
			/>
			<div className="flex items-center gap-4">
				<InputCheckbox
					id={othersId}
					value={showOthers}
					onChange={(checked) => {
						setShowOthers(checked);
						if (!checked) onChange(simple);
					}}
				/>
				<InputLabel inline htmlFor={othersId}>{t("other_genders")}</InputLabel>
			</div>
			{showOthers && (
				<InputAutocomplete
					{...props}
					options={genders.map((gender) => ({
						definition: gender.definition,
						definitionLink: gender.definitionLink,
						hidden:
							simpleIds.has(gender.id)
							|| (!others.includes(gender.id)
								&& (gender.conflicts ?? []).some((conflict) => others.includes(conflict))),
						key: gender.id,
						label: gender.name
					}))}
					limit={4}
					placeholder={t("select_genders")}
					value={others}
					onChange={(next) => onChange([...simple, ...next])}
				/>
			)}
		</div>
	);
}
