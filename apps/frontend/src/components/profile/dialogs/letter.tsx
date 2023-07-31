import { FC, PropsWithChildren, useState } from "react";

import { Button } from "~/components/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "~/components/dialog/dialog";
import { Form, FormButton } from "~/components/forms";
import { InlineLink } from "~/components/inline-link";
import { InputLabel, InputTextArea } from "~/components/inputs";

export const LetterDialog: FC<PropsWithChildren> = ({ children }) => {
	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			{children}
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Send a letter</DialogTitle>
				</DialogHeader>
				<span className="select-none">
					Skip the line and stand out with a letter. This will use one of your 0
					envelopes. <InlineLink href={null}>Get more</InlineLink>
				</span>
				<Form
					className="flex flex-col gap-4"
					fields={{
						message: ""
					}}
					onSubmit={async () => {}}
				>
					{({ FormField }) => (
						<>
							<FormField name="message">
								{(field) => (
									<>
										<InputLabel {...field.labelProps}>Message</InputLabel>
										<InputTextArea
											{...field.props}
											rows={6}
											placeholder={
												"Roses are red,\nViolets are blue,\nIs that a custom avatar?\nIt looks good on you"
											}
										/>
									</>
								)}
							</FormField>
							<InlineLink href={null}>Add a sticker</InlineLink>
							<DialogFooter>
								<Button
									kind="tertiary"
									size="sm"
									onClick={() => setOpen(false)}
								>
									Cancel
								</Button>
								<FormButton size="sm">Send</FormButton>
							</DialogFooter>
						</>
					)}
				</Form>
			</DialogContent>
		</Dialog>
	);
};
