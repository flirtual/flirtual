import {
	ArrowLeftOnRectangleIcon,
	ArrowRightOnRectangleIcon,
	ClipboardDocumentIcon,
	FlagIcon,
	NoSymbolIcon,
	ShieldExclamationIcon
} from "@heroicons/react/24/solid";
import { useState } from "react";

import { User } from "~/api/user";
import { api } from "~/api";
import { sortBy } from "~/utilities";
import { useSession } from "~/hooks/use-session";
import { useAttributeList } from "~/hooks/use-attribute-list";

import { DrawerOrModal } from "../drawer-or-modal";
import { Form, FormButton } from "../forms";
import { InputLabel, InputSelect } from "../inputs";
import { InputTextArea } from "../inputs/textarea";

const ReportProfile: React.FC<{ user: User }> = ({ user }) => {
	const [reportVisible, setReportVisible] = useState(false);
	const reportReasons = useAttributeList("report-reason");

	return (
		<DrawerOrModal visible={reportVisible} onVisibilityChange={setReportVisible}>
			<Form
				className="flex flex-col gap-8 rounded-3xl p-5 dark:text-white-20 sm:w-96"
				fields={{
					targetId: user.id,
					reasonId: reportReasons[0]?.id,
					message: ""
				}}
				onSubmit={async (body) => {
					await api.report.create({ body });
					setReportVisible(false);
				}}
			>
				{({ FormField }) => (
					<>
						<FormField className="flex flex-row items-center gap-4" name="targetId">
							{() => (
								<>
									<ShieldExclamationIcon className="h-6 w-6" />
									<span className="text-xl">
										Report profile: {user.profile.displayName ?? user.username}
									</span>
								</>
							)}
						</FormField>

						<FormField name="reasonId">
							{(field) => (
								<>
									<InputSelect
										{...field.props}
										options={sortBy(reportReasons, ({ metadata }) => metadata.order).map(
											(attribute) => ({
												key: attribute.id,
												label: attribute.name
											})
										)}
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
										placeholder="Tell us a little more about this incident. If you'd like us to reach out for more details or further evidence, please include your contact info."
										rows={6}
									/>
								</>
							)}
						</FormField>
						<FormButton>Report</FormButton>
					</>
				)}
			</Form>
			<button className="h-6 w-6" type="button" onClick={() => setReportVisible(true)}>
				<FlagIcon className="h-full w-full" />
			</button>
		</DrawerOrModal>
	);
};

export const ProfileActionBar: React.FC<{ user: User }> = ({ user }) => {
	const [session, mutateSession] = useSession();
	if (!session) return null;

	return (
		<div className="flex w-full justify-between gap-3 p-8 dark:bg-black-70">
			<div className="flex gap-4">
				{session.user.tags.includes("debugger") && (
					<>
						<button
							title="Copy user id"
							type="button"
							onClick={() => navigator.clipboard.writeText(user.id)}
						>
							<ClipboardDocumentIcon className="h-6 w-6" />
						</button>
						<button
							title="Copy username"
							type="button"
							onClick={() => navigator.clipboard.writeText(user.username)}
						>
							<ClipboardDocumentIcon className="h-6 w-6" />
						</button>
					</>
				)}
				{session.user.tags.includes("admin") && (
					<>
						<button
							type="button"
							onClick={async () => {
								const session = await api.auth.sudo({ body: { userId: user.id } });
								await mutateSession(session);
							}}
						>
							<ArrowRightOnRectangleIcon className="h-6 w-6" />
						</button>
					</>
				)}
				{session.sudoerId && (
					<button
						type="button"
						onClick={async () => {
							const session = await api.auth.revokeSudo();
							await mutateSession(session);
						}}
					>
						<ArrowLeftOnRectangleIcon className="h-6 w-6" />
					</button>
				)}
			</div>
			<div className="flex gap-4">
				{session.user.id !== user.id && (
					<>
						<button className="h-6 w-6" type="button">
							<NoSymbolIcon className="h-full w-full" />
						</button>
						<ReportProfile user={user} />
					</>
				)}
			</div>
		</div>
	);
};
