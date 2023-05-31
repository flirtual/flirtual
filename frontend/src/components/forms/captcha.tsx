"use client";

import HCaptcha from "@hcaptcha/react-hcaptcha";
import { forwardRef } from "react";

import { hcaptchaSiteKey } from "~/const";

export type FormCaptchaRef = HCaptcha;

export const FormCaptcha = forwardRef<HCaptcha, unknown>((props, ref) => {
	return (
		<HCaptcha
			ref={ref}
			sitekey={hcaptchaSiteKey}
			size="invisible"
			onVerify={() => {
				// Component throws an error if
				// this function isn't defined
			}}
		/>
	);
});
