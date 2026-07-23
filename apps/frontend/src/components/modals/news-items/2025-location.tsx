import { useMemo } from "react";
import type { FC } from "react";
import { Trans, useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

import { isWretchError } from "~/api/common";
import { DefaultProfileCustomWeights, Profile } from "~/api/user/profile";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputLabel, InputLabelHint, InputSwitch } from "~/components/inputs";
import { Slider } from "~/components/inputs/slider";
import {
	InputTimezoneSelect,
	useApplyGeolocation
} from "~/components/inputs/specialized";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { invalidate, sessionKey } from "~/query";

import { commonComponents } from "./common";

export const Location2025: FC<{ onSaved?: () => void }> = ({ onSaved }) => {
	const { t } = useTranslation();
	const toasts = useToast();
	const { user } = useSession();

	const applyGeolocation = useApplyGeolocation();

	const { customWeights = DefaultProfileCustomWeights } = user.profile;

	const browserTimezone = useMemo<string | null>(
		() => Intl.DateTimeFormat().resolvedOptions().timeZone,
		[]
	);

	return (
		<Trans
			components={{
				...commonComponents,
				form: (
					<Form
						fields={{
							timezone: user.profile.timezone ?? browserTimezone,
							weightLocation: customWeights.location,
							geolocation: true
						}}
						className="mt-2 flex flex-col gap-6"
						onSubmit={async ({ timezone, weightLocation, geolocation }) => {
							await Promise.all([
								Profile.update(user.id, {
									timezone: timezone ?? "none"
								}),
								Profile.updateCustomWeights(user.id, {
									location: weightLocation
								}),
								applyGeolocation(geolocation).catch((reason) => {
									if (isWretchError(reason)) return toasts.addError(t(`errors.${reason.json.error}` as any));
									toasts.addError(reason);
								})
							]);
							await invalidate({ queryKey: sessionKey() });
							toasts.add(t("saved"));
							onSaved?.();
						}}
					>
						{({ FormField }) => (
							<>
								<FormField name="geolocation">
									{(field) => (
										<>
											<InputLabel>{t("enable_distance_matchmaking")}</InputLabel>
											<InputLabelHint className="-mt-2">
												{t("geolocation_hint")}
												<details>
													<summary className="text-pink opacity-75 transition-opacity hover:cursor-pointer hover:opacity-100">
														{t("privacy")}
													</summary>
													{t("geolocation_privacy_details")}
												</details>
											</InputLabelHint>
											<InputSwitch {...field.props} />
										</>
									)}
								</FormField>
								<FormField name="timezone">
									{(field) => (
										<>
											<InputLabel>{t("timezone")}</InputLabel>
											<InputLabelHint className="-mt-2">
												{t("timezone_hint")}
											</InputLabelHint>
											<InputTimezoneSelect {...field.props} />
										</>
									)}
								</FormField>
								<FormField name="weightLocation">
									{({ labelProps, props: { value, onChange, ...props } }) => (
										<>
											<InputLabel
												{...labelProps}
												hint={(
													<InputLabelHint
														className={twMerge(
															"ml-auto",
															value === 0 ? "!text-red-500" : ""
														)}
													>
														{t("number_multiplier", { number: value })}
													</InputLabelHint>
												)}
											>
												{t("news.2025_location.location_priority")}
											</InputLabel>
											<InputLabelHint className="-mt-2">
												{t("news.2025_location.location_priority_help")}
											</InputLabelHint>
											<Slider
												{...props}
												max={2}
												min={0}
												step={0.25}
												value={[value]}
												onValueChange={(values) => onChange(values[0]!)}
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
			i18nKey="news.2025_location.body"
		/>
	);
};
