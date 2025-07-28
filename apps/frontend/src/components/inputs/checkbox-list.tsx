import { useId } from "react";
import type React from "react";

import { emptyArray } from "~/utilities";

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

export function InputCheckboxList<T extends string>(
	props: InputCheckboxListProps<T>
) {
	const { value, items = emptyArray, onChange } = props;
	const id = useId();

	return (
		<div className="flex flex-col gap-2">
			{items.map((item) => {
				const itemId = id + item.key;

				return (
					<div key={item.key} className="flex items-center gap-4">
						<InputCheckbox
							id={itemId}
							value={value.includes(item.key)}
							onChange={(itemValue) => {
								onChange(
									[item.key, ...value].filter((key) =>
										itemValue
											? !item.conflicts?.includes(key)
											: key !== item.key
									)
								);
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
