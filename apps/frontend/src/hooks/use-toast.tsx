"use client";

import { Toast as NativeToast } from "@capacitor/toast";
import * as Sentry from "@sentry/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check } from "lucide-react";
import {
	createContext,
	type PropsWithChildren,
	useCallback,
	useContext,
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

export function useToast() {
	return useContext(ToastContext);
}

const ToastItem: React.FC<Omit<Toast, "key">> = (toast) => {
	const Icon = toast.icon;

	return (
		<motion.button
			className={twMerge(
				"pointer-events-auto flex items-center gap-4 rounded-lg px-6 py-4 text-left shadow-brand-1",
				{
					success: "bg-brand-gradient",
					error: "bg-black-80 border-2 border-red-500",
					warning: "bg-black-80 border-2 border-yellow-500"
				}[toast.type]
			)}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			initial={{ opacity: 0 }}
			onClick={() => toast.remove()}
		>
			<Icon className="size-5 shrink-0" strokeWidth={2} />
			<span data-mask className="font-montserrat font-semibold">
				{toast.children}
			</span>
		</motion.button>
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
				remove() {
					remove(this);
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

			if (!expected) Sentry.captureException(reason);

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
			{!native && (
				// We only want to render the toasts if we're not a native device, as
				// toasts are handled by the device itself.
				<AnimatePresence>
					{toasts.length > 0 && (
						<div className="pointer-events-none fixed right-0 top-0 z-[999] flex flex-col-reverse gap-2 p-8 text-white-20 desktop:top-16">
							{toasts.map((toast) => (
								<ToastItem {...toast} key={toast.id} />
							))}
						</div>
					)}
				</AnimatePresence>
			)}
		</ToastContext.Provider>
	);
};
