import { Plus } from "lucide-react";

import type { FlagType } from "~/api/flag";
import { Flag } from "~/api/flag";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputText } from "~/components/inputs";
import { useToast } from "~/hooks/use-toast";
import { invalidate } from "~/query";

export const AddFlagForm: React.FC<{ type: FlagType }> = ({ type }) => {
	const toasts = useToast();

	return (
		<div className="flex flex-col gap-2">
			<span className="text-lg font-semibold">
				Add new
				{" "}
				{type}
				{" "}
				flag
			</span>
			<Form
				fields={{
					flag: ""
				}}
				className="flex w-full gap-2"
				onSubmit={async (body) => {
					await Flag.create({
						type,
						flag: body.flag
					});
					toasts.add("Added flag");
					invalidate({ queryKey: ["flags"] });
				}}
			>
				{({ FormField }) => (
					<>
						<div className="flex-1">
							<FormField name="flag">
								{(field) => (
									<InputText
										{...field.props}
										placeholder={type === "email" ? "domain.com" : "keyword/phrase"}
									/>
								)}
							</FormField>
						</div>
						<FormButton Icon={Plus} size="sm">
							Add
						</FormButton>
					</>
				)}
			</Form>
		</div>
	);
};
