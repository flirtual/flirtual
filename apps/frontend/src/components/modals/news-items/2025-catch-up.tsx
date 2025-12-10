import type { FC } from "react";
import { Trans, useTranslation } from "react-i18next";

import { Profile, ProfileRelationshipList } from "~/api/user/profile";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputLabel } from "~/components/inputs";
import { InputCheckboxList } from "~/components/inputs/checkbox-list";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { invalidate, sessionKey } from "~/query";

import { commonComponents } from "./common";

export const CatchUp2025: FC<{ onSaved?: () => void }> = () => {
	const { t } = useTranslation();
	const toasts = useToast();
	const { user } = useSession();

	return (
		<Trans
			components={{
				...commonComponents,
				form: (
					<Form
						fields={{
							relationships: user.profile.relationships ?? []
						}}
						className="mb-2 flex flex-col gap-6"
						onSubmit={async (values) => {
							await Profile.update(user.id, {
								required: ["relationships"],
								relationships: values.relationships ?? []
							});
							await invalidate({ queryKey: sessionKey() });
							toasts.add(t("saved"));
						}}
					>
						{({ FormField }) => (
							<>
								<FormField name="relationships">
									{(field) => (
										<>
											<InputLabel>{t("im_open_to")}</InputLabel>
											<InputCheckboxList
												{...field.props}
												items={ProfileRelationshipList.map((item) => ({
													key: item,
													label: t(({
														serious: "serious_dating_hint",
														vr: "casual_dating_hint",
														hookups: "hookups_hint",
														friends: "new_friends"
													} as const)[item])
												}))}
											/>
										</>
									)}
								</FormField>
								<FormButton>{t("save")}</FormButton>
							</>
						)}
					</Form>
				)
			}}
			i18nKey="news.2025_catch_up.body"
		/>
	);
};
