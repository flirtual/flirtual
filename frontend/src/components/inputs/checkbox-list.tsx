import React, { useId } from "react";

import { InputCheckbox } from "./checkbox";
import { InputLabel } from "./label";

export interface CheckboxListItem<K extends string> {
	key: K;
	label: React.ReactNode;
	labelHint?: React.ReactNode;
	conflicts?: Array<K>;
}

export type CheckboxListValue<K extends string> = Array<K>;
export interface InputCheckboxListProps<K extends string> {
	items: Array<CheckboxListItem<K>>;
	value: CheckboxListValue<K>;
	onChange: React.Dispatch<CheckboxListValue<K>>;
}

export function InputCheckboxList<T extends string>(props: InputCheckboxListProps<T>) {
	const { value, items, onChange } = props;
	const id = useId();

	return (
		<div className="flex flex-col gap-2">
			{items.map((item) => {
				const itemId = id + item.key;

				return (
					<div className="flex items-center gap-4" key={item.key}>
						<InputCheckbox
							id={itemId}
							value={value.includes(item.key)}
							onChange={(itemValue) => {
								itemValue
									? onChange([item.key, ...value].filter((key) => !item.conflicts?.includes(key)))
									: onChange(value.filter((otherKey) => otherKey !== item.key));
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
