"use client";

import { Key } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "~/api";
import { useToast } from "~/hooks/use-toast";

export interface PasskeyButtonProps {
	id: string;
	name: string;
	icon: string;
	date: Date;
}

export const PasskeyButton: React.FC<PasskeyButtonProps> = (props) => {
	const { id, name, icon, date } = props;
	const [text, setText] = useState(`Added ${date.toLocaleDateString()}`);
	const toasts = useToast();
	const router = useRouter();

	return (
		<button
			className="flex w-full cursor-pointer gap-2 rounded-xl bg-white-40 shadow-brand-1  dark:bg-black-60 dark:text-white-20"
			type="button"
			onMouseLeave={() => setText(`Added ${date.toLocaleDateString()}`)}
			onClick={() => {
				void api.auth
					.deletePasskey({ query: { passkeyId: id } })
					.then(() => {
						toasts.add(`Removed ${name || "passkey"}`);
						return router.refresh();
					})
					.catch(toasts.addError);
			}}
			onMouseEnter={() => {
				setText("Delete passkey");
			}}
		>
			<div className="flex aspect-square h-12 w-12 items-center justify-center rounded-l-xl bg-brand-gradient p-2 text-white-20">
				{icon ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img className="h-7 w-7" src={icon} />
				) : (
					<Key className="h-7 w-7" />
				)}
			</div>
			<div className="flex flex-col p-2 text-left font-nunito leading-none">
				{name || "Passkey"}
				<span className="text-sm leading-none text-black-60 dark:text-white-40">
					{text}
				</span>
			</div>
		</button>
	);
};
