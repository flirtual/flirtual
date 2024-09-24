"use client";

import { Key, Trash2 } from "lucide-react";
import { useFormatter } from "next-intl";
import { useRouter } from "next/navigation";

import { Authentication } from "~/api/auth";
import { useToast } from "~/hooks/use-toast";

export interface PasskeyButtonProps {
	id: string;
	name?: string;
	icon?: string;
	date: Date;
}

export const PasskeyButton: React.FC<PasskeyButtonProps> = (props) => {
	const { id, name, icon, date } = props;
	const toasts = useToast();
	const router = useRouter();
	const formatter = useFormatter();

	return (
		<div className="flex w-full gap-2 rounded-xl bg-white-40 shadow-brand-1  dark:bg-black-60 dark:text-white-20">
			<div className="flex aspect-square size-12 items-center justify-center rounded-l-xl bg-brand-gradient p-2 text-white-20">
				{icon ? (
					<img className="size-7" src={icon} />
				) : (
					<Key className="size-7" />
				)}
			</div>
			<div className="flex flex-col overflow-hidden whitespace-nowrap p-2 text-left font-nunito leading-none">
				{name || "Passkey"}
				<span className="text-sm leading-none text-black-60 dark:text-white-40">
					Added {formatter.dateTime(date)}
				</span>
			</div>
			<div
				className="ml-auto cursor-pointer self-center p-3 text-black-30 hover:text-red-600"
				onClick={() => {
					void Authentication.passkey
						.delete(id)
						.then(() => {
							toasts.add(`Removed ${name || "passkey"}`);
							return router.refresh();
						})
						.catch(toasts.addError);
				}}
			>
				<Trash2 />
			</div>
		</div>
	);
};
