import { useState } from "react";
import { ShieldExclamationIcon } from "@heroicons/react/24/solid";

import { User, displayName } from "~/api/user";
import { api } from "~/api";
import { sortBy } from "~/utilities";
import { useAttributeList } from "~/hooks/use-attribute-list";
import { DrawerOrModal } from "~/components/drawer-or-modal";
import { Form, FormButton } from "~/components/forms";
import { InputSelect, InputLabel, InputTextArea } from "~/components/inputs";

export const BanProfile: React.FC<{ user: User }> = ({ user }) => {
	const [visible, setVisible] = useState(false);
	const reasons = sortBy(useAttributeList("ban-reason"), ({ metadata }) => metadata.order);

	return (
		<DrawerOrModal visible={visible} onVisibilityChange={setVisible}>
			<Form
				className="flex flex-col gap-8 rounded-3xl p-5 dark:text-white-20 sm:w-96"
				requireChange={false}
				fields={{
					targetId: user.id,
					reasonId: reasons[0]?.id,
					message: reasons[0]?.metadata.details
				}}
				onSubmit={async ({ targetId, ...body }) => {
					await api.user.suspend(targetId, { body });
					setVisible(false);
				}}
			>
				{({ FormField, fields: { message } }) => (
					<>
						<FormField className="flex flex-row items-center gap-4" name="targetId">
							{() => (
								<>
									<ShieldExclamationIcon className="h-6 w-6" />
									<span className="text-xl">Ban profile: {displayName(user)}</span>
								</>
							)}
						</FormField>
						<FormField name="reasonId">
							{(field) => (
								<>
									<InputSelect
										{...field.props}
										options={reasons.map((attribute) => ({
											key: attribute.id,
											label: attribute.name
										}))}
										onChange={(reasonId) => {
											field.props.onChange(reasonId);
											message.props.onChange(
												reasons.find((reason) => reason.id === reasonId)?.metadata.details || ""
											);
										}}
									/>
								</>
							)}
						</FormField>
						<FormField name="message">
							{(field) => (
								<>
									<InputLabel {...field.labelProps}>Message</InputLabel>
									<InputTextArea
										{...field.props}
										placeholder="Write a custom ban reason for the user."
										rows={6}
									/>
								</>
							)}
						</FormField>
						<FormButton>Yonk</FormButton>
					</>
				)}
			</Form>
			<button className="h-6 w-6" title="Ban user" type="button" onClick={() => setVisible(true)}>
				<ShieldExclamationIcon className="h-full w-full" />
			</button>
		</DrawerOrModal>
	);
};
