import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import { Dispatch, FC, PropsWithChildren } from "react";

import { displayName, User } from "~/api/user";
import { useToast } from "~/hooks/use-toast";
import { api } from "~/api";

import { InputLabel, InputTextArea } from "../inputs";
import { Form, FormButton, FormMessage } from "../forms";
import { DrawerOrModal } from "../drawer-or-modal";
import { UserAvatar } from "../user-avatar";

export interface WarnProfileModalFormProps {
	user: User;
	onVisibilityChange: Dispatch<boolean>;
}

export const WarnProfileModalForm: FC<WarnProfileModalFormProps> = ({
	user,
	onVisibilityChange
}) => {
	const toasts = useToast();

	return (
		<Form
			className="flex flex-col gap-8 rounded-3xl p-5 dark:text-white-20 sm:w-96"
			requireChange={false}
			fields={{
				targetId: user.id,
				message: ""
			}}
			onSubmit={async ({ targetId, ...body }) => {
				await api.user.warn(targetId, { body });

				toasts.add("Account warned");
				onVisibilityChange(false);
			}}
		>
			{({ FormField }) => (
				<>
					<div className="flex flex-row items-center gap-4">
						<ExclamationTriangleIcon className="h-6 w-6" />
						<span className="text-xl">Warn profile</span>
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
										<span className="text-lg font-semibold">
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
					<FormField name="message">
						{(field) => (
							<>
								<InputLabel {...field.labelProps}>Message</InputLabel>
								<InputTextArea {...field.props} rows={6} />
							</>
						)}
					</FormField>
					<FormMessage size="sm" type="warning">
						{displayName(user)} still has an existing{" "}
						<strong>unresolved warning</strong>, you&apos;ll be overwriting it.
					</FormMessage>
					<FormButton>Warn</FormButton>
				</>
			)}
		</Form>
	);
};

type WarnProfileModalProps = PropsWithChildren<{
	user: User;
	visible: boolean;
	onVisibilityChange: Dispatch<boolean>;
}>;

export const WarnProfileModal: FC<WarnProfileModalProps> = ({
	user,
	children,
	visible,
	onVisibilityChange
}) => {
	return (
		<DrawerOrModal visible={visible} onVisibilityChange={onVisibilityChange}>
			<WarnProfileModalForm
				user={user}
				onVisibilityChange={onVisibilityChange}
			/>
			{children}
		</DrawerOrModal>
	);
};
