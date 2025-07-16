import { Key, Loader2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

import { Authentication } from "~/api/auth";
import { useToast } from "~/hooks/use-toast";
import { invalidate, sessionKey, useMutation } from "~/query";

export interface PasskeyButtonProps {
	id: string;
	name?: string;
	icon?: string;
	date: Date;
}

export const PasskeyButton: React.FC<PasskeyButtonProps> = (props) => {
	const { id, name, icon, date } = props;
	const toasts = useToast();
	const { t } = useTranslation();

	const { mutate, isPending } = useMutation({
		mutationKey: sessionKey(),
		mutationFn: async () => {
			await Authentication.passkey.delete(id);
			await invalidate({ queryKey: sessionKey() });
		},
		onSuccess: () => toasts.add(name ? t("removed_item", { item: name }) : t("removed_passkey")),
		onError: toasts.addError
	});

	return (
		<div className="flex w-full gap-2 rounded-xl bg-white-40 shadow-brand-1  dark:bg-black-60 dark:text-white-20">
			<div className="flex aspect-square size-12 items-center justify-center rounded-l-xl bg-brand-gradient p-2 text-white-20">
				{icon
					? (
						// eslint-disable-next-line @next/next/no-img-element
							<img className="size-7" src={icon} />
						)
					: (
							<Key className="size-7" />
						)}
			</div>
			<div className="flex flex-col overflow-hidden whitespace-nowrap p-2 text-left font-nunito leading-none vision:text-black-80">
				{name || t("passkey")}
				<span className="text-sm leading-none text-black-60 dark:text-white-40">
					{t("added_date", { date })}
				</span>
			</div>
			<button
				className={twMerge(
					"ml-auto cursor-pointer self-center p-3 opacity-50 vision:text-black-80",
					!isPending && "hover:text-red-400 hover:opacity-100"
				)}
				type="button"
				onClick={() => mutate()}
			>
				{isPending
					? <Loader2 className="animate-spin" />
					: <X />}
			</button>
		</div>
	);
};
