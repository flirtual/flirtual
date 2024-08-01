import React from "react";

import { type CheckboxListItem, InputCheckboxList } from "./checkbox-list";

export type RadioListItem<T extends string> = Omit<
	CheckboxListItem<T>,
	"conflicts"
>;

export interface InputRadioListProps<T extends string> {
	value?: T;
	onChange: React.Dispatch<T>;
	items: Array<RadioListItem<T>>;
}

/**
 * ``InputRadioList`` is similar to ``InputCheckboxList``, but with an important
 * distinction: ``InputRadioList`` is designed for selecting one value out of a set,
 * whereas ``InputCheckboxList`` let you turn individual values on and off.
 *
 * Where multiple controls exist, ``InputRadioList`` allow one to be selected out of them all,
 * whereas ``InputCheckboxList`` allow multiple values to be selected.
 */
export function InputRadioList<T extends string>(
	props: InputRadioListProps<T>
) {
	return (
		<InputCheckboxList
			{...props}
			value={props.value ? [props.value] : []}
			items={props.items.map((item) => {
				// every item conflicts with every other item, except itself.
				const conflicts = props.items
					.map(({ key }) => key)
					.filter((key) => item.key !== key);

				return {
					...item,
					conflicts
				};
			})}
			onChange={(value) => {
				props.onChange(value[0]!);
			}}
		/>
	);
}
