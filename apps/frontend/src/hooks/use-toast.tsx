"use client";

import { Toast as NativeToast } from "@capacitor/toast";
import { captureException } from "@sentry/nextjs";
import { AlertTriangle, Check } from "lucide-react";
import {
	createContext,
	type PropsWithChildren,
	use,
	useCallback,
	useMemo,
	useState
} from "react";
import { twMerge } from "tailwind-merge";

import type { IconComponent } from "~/components/icons";

import { useDevice } from "./use-device";

export type ToastType = "error" | "success" | "warning";
export type ToastDuration = "long" | "short";

export interface CreateToast {
	type?: ToastType;
	icon?: IconComponent;
	duration?: ToastDuration;
	value: string;
}

export interface Toast {
	id: string;
	type: ToastType;
	icon: IconComponent;
	children: string;
	ttl: number | null;
	remove: () => void;
}

export interface ToastContext {
	toasts: Array<Toast>;

	add: (toast: CreateToast | string) => Toast;
	addError: (reason: unknown) => void;

	remove: (toast: Pick<Toast, "id">) => void;
}

const ToastContext = createContext<ToastContext>({} as ToastContext);

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
	return use(ToastContext);
}

const ToastItem: React.FC<Omit<Toast, "key">> = ({ type, icon: Icon, children, remove }) => {
	return (
		<button
			className={twMerge(
				"pointer-events-auto flex w-full max-w-xl items-center gap-4 rounded-lg px-6 py-4 text-left shadow-brand-1",
				{
					success: "bg-brand-gradient text-white-20",
					error: "bg-white-10 dark:bg-black-80 border-2 border-red-500 text-black-80 dark:text-white-20 motion-preset-slide-left",
					warning: "bg-black-80 border-2 border-yellow-500"
				}[type]
			)}
			type="button"
			onClick={() => remove()}
		>
			<Icon className="size-5 shrink-0" strokeWidth={2} />
			<span data-mask className="font-montserrat font-semibold">
				{children}
			</span>
		</button>
	);
};

export interface AddErrorOptions {
	expected?: boolean;
}

export const ToastProvider: React.FC<PropsWithChildren> = ({ children }) => {
	const [toasts, setToasts] = useState<Array<Toast>>([]);
	const { native } = useDevice();

	const remove = useCallback((toast: Pick<Toast, "id">) => {
		setToasts((toasts) => toasts.filter(({ id }) => id !== toast.id));
	}, []);

	const add = useCallback(
		(options: CreateToast | string) => {
			if (typeof options === "string") options = { value: options };
			const { type = "success", icon, duration = "short", value } = options;

			// Match duration of native toasts.
			// See https://capacitorjs.com/docs/apis/toast
			const ttl = duration === "short" ? 2000 : 3500;

			const toast: Toast = {
				id: String(performance.now()),
				type,
				icon: icon || (type === "success" ? Check : AlertTriangle),
				ttl,
				children: value,
				remove: () => {
					remove(toast);
				}
			};

			if (toast.ttl) setTimeout(() => toast.remove(), toast.ttl);

			if (native)
				void NativeToast.show({
					duration,
					text:
						type === "success"
							? value
							: type === "warning"
								? `warning: ${value}`
								: `Error: ${value}`,
					// Android only supports bottom position.
					position: "bottom"
				});

			setToasts((toasts) => [toast, ...toasts]);

			return toast;
		},
		[remove, native]
	);

	const addError = useCallback(
		(reason: unknown, { expected = false }: AddErrorOptions = {}) => {
			const message
				= (typeof reason === "object"
					&& reason !== null
					&& "message" in reason
					&& typeof reason.message === "string"
					&& reason.message)
				|| (typeof reason === "string" && reason)
				|| "Unknown request error";

			if (!expected) captureException(reason);

			return add({
				type: "error",
				value: message
			});
		},
		[add]
	);

	return (
		<ToastContext.Provider
			value={useMemo(
				() => ({
					toasts,
					add,
					remove,
					addError
				}),
				[toasts, add, remove, addError]
			)}
		>
			{children}
			{!native && toasts.length > 0 && (
				<div className="pointer-events-none fixed bottom-16 right-0 z-[999] flex flex-col-reverse gap-2 p-8 px-4 desktop:bottom-[unset] desktop:top-16 desktop:px-8">
					{toasts.map((toast) => (
						<ToastItem {...toast} key={toast.id} />
					))}
				</div>
			)}
		</ToastContext.Provider>
	);
};
