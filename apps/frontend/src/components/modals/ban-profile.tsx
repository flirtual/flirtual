import { ShieldExclamationIcon } from "@heroicons/react/24/solid";
import { Dispatch, FC, PropsWithChildren } from "react";
import { useRouter } from "next/navigation";

import { api } from "~/api";
import { displayName, User } from "~/api/user";
import { useAttributeList } from "~/hooks/use-attribute-list";
import { useToast } from "~/hooks/use-toast";

import { InputLabel, InputSelect, InputTextArea } from "../inputs";
import { Form, FormButton } from "../forms";
import { DrawerOrModal } from "../drawer-or-modal";
import { UserAvatar } from "../user-avatar";

export interface BanProfileModalFormProps {
	user: User;
	onVisibilityChange: Dispatch<boolean>;
}

export const BanProfileModalForm: FC<BanProfileModalFormProps> = ({
	user,
	onVisibilityChange
}) => {
	const toasts = useToast();
	const router = useRouter();

	const reasons = useAttributeList("ban-reason");

	return (
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

				router.refresh();
				toasts.add("Account suspended");

				onVisibilityChange(false);
			}}
		>
			{({ FormField, fields: { message } }) => (
				<>
					<div className="flex flex-row items-center gap-4">
						<ShieldExclamationIcon className="h-6 w-6" />
						<span className="text-xl">Ban profile</span>
					</div>
					<FormField name="targetId">
						{(field) => (
							<>
								<InputLabel {...field.labelProps}>Target</InputLabel>
								<div className="flex items-center gap-4">
									<UserAvatar
										className="h-8 w-8 rounded-full"
										height={64}
										user={user}
										width={64}
									/>
									<div className="flex flex-col">
										<span data-sentry-mask className="text-lg font-semibold">
											{displayName(user)}
										</span>
										<span className="font-mono text-sm brightness-75">
											{user.id}
										</span>
									</div>
								</div>
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
											reasons.find((reason) => reason.id === reasonId)?.metadata
												.details || ""
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
	);
};

type BanProfileModalProps = PropsWithChildren<{
	user: User;
	visible: boolean;
	onVisibilityChange: Dispatch<boolean>;
}>;

export const BanProfileModal: FC<BanProfileModalProps> = ({
	user,
	children,
	visible,
	onVisibilityChange
}) => {
	return (
		<DrawerOrModal visible={visible} onVisibilityChange={onVisibilityChange}>
			<BanProfileModalForm
				user={user}
				onVisibilityChange={onVisibilityChange}
			/>
			{children}
		</DrawerOrModal>
	);
};
