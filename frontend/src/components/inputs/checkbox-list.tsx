import React, { useId } from "react";

import { entries } from "~/utilities";

import { InputCheckbox } from "./checkbox";
import { InputLabel } from "./label";

export interface CheckboxListItem<K extends string> {
	label: React.ReactNode;
	labelHint?: React.ReactNode;
	conflicts?: Array<K>;
}

export type CheckboxListValue<K extends string> = Array<K>;
interface InputCheckboxListProps<K extends string> {
	items: { [K1 in K]: CheckboxListItem<K> };
	value: CheckboxListValue<K>;
	onChange: React.Dispatch<CheckboxListValue<K>>;
}

export function InputCheckboxList<T extends string>(props: InputCheckboxListProps<T>) {
	const { value, items, onChange } = props;
	const id = useId();

	return (
		<div className="flex flex-col gap-2">
			{entries(items).map(([key, item]) => {
				const itemId = id + key;

				return (
					<div className="flex items-center gap-4" key={key}>
						<InputCheckbox
							id={itemId}
							value={value.includes(key)}
							onChange={(itemValue) => {
								itemValue
									? onChange([key, ...value].filter((key) => !item.conflicts?.includes(key)))
									: onChange(value.filter((otherKey) => otherKey !== key));
							}}
						/>
						<InputLabel inline hint={item.labelHint} htmlFor={itemId}>
							{item.label}
						</InputLabel>
					</div>
				);
			})}
		</div>
	);
}
