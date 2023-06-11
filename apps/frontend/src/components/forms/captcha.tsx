"use client";

import HCaptcha from "@hcaptcha/react-hcaptcha";
import { forwardRef } from "react";

import { hcaptchaSiteKey } from "~/const";

export type FormCaptchaReference = HCaptcha;

export const FormCaptcha = forwardRef<HCaptcha, unknown>((props, reference) => {
	return (
		<HCaptcha
			ref={reference}
			sitekey={hcaptchaSiteKey}
			size="invisible"
			onVerify={() => {
				// Component throws an error if
				// this function isn't defined
			}}
		/>
	);
});
