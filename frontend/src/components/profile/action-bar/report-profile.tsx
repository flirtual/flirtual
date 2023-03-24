import { useState } from "react";
import { ShieldExclamationIcon, FlagIcon } from "@heroicons/react/24/solid";

import { User } from "~/api/user";
import { api } from "~/api";
import { sortBy } from "~/utilities";
import { useAttributeList } from "~/hooks/use-attribute-list";
import { DrawerOrModal } from "~/components/drawer-or-modal";
import { Form, FormButton } from "~/components/forms";
import { InputSelect, InputLabel, InputTextArea } from "~/components/inputs";

export const ReportProfile: React.FC<{ user: User }> = ({ user }) => {
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
			<button
				className="h-6 w-6"
				title="Report profile"
				type="button"
				onClick={() => setReportVisible(true)}
			>
				<FlagIcon className="h-full w-full" />
			</button>
		</DrawerOrModal>
	);
};
