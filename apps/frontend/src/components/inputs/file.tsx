export type InputFileValue = Array<File>;

export type InputFileProps = {
	onChange?: React.Dispatch<InputFileValue>;
} & Omit<
	React.ComponentProps<"input">,
	"onChange" | "type" | "value"
>;

export function InputFile({ onChange, ...props }: InputFileProps) {
	return (
		<input
			{...props}
			type="file"
			onChange={({ currentTarget }) => {
				if (!onChange || !currentTarget.files) return;
				onChange([...currentTarget.files]);
			}}
		/>
	);
}
