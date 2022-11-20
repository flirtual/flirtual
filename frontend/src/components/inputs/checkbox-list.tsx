import React, { useId } from "react";

import { InputCheckbox } from "./checkbox";
import { InputLabel } from "./label";

interface InputCheckboxListProps<T extends string> {
	items: Array<{ key: T; label: React.ReactNode }>;
	value: Array<T>;
	onChange: React.Dispatch<Array<T>>;
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
									? onChange([item.key, ...value])
									: onChange(value.filter((key) => key !== item.key));
							}}
						/>
						<InputLabel inline htmlFor={itemId}>
							{item.label}
						</InputLabel>
					</div>
				);
			})}
		</div>
	);
}
