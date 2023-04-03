"use client";

import { CheckIcon } from "@heroicons/react/24/outline";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import ms from "ms";
import {
	createContext,
	PropsWithChildren,
	ReactNode,
	useCallback,
	useContext,
	useMemo,
	useState
} from "react";
import { twMerge } from "tailwind-merge";

export type ToastType = "success" | "error" | "warning";

export interface CreateToast {
	type: ToastType;
	ttl?: string | null;
	label?: string;
	children?: ReactNode;
}

export interface Toast {
	id: string;
	type: ToastType;
	children: ReactNode;
	ttl: number | null;
	remove: () => void;
}

export interface ToastContext {
	toasts: Array<Toast>;

	add: (toast: CreateToast) => Toast;
	addError: (reason: unknown) => void;

	remove: (toast: Pick<Toast, "id">) => void;
}

const ToastContext = createContext<ToastContext>({
	toasts: [],
	// @ts-expect-error: this should never happen.
	add: () => null,
	remove: () => undefined,
	addError: () => undefined
});

export function useToast() {
	return useContext(ToastContext);
}

const ToastItem: React.FC<Omit<Toast, "key">> = (toast) => {
	const Icon = toast.type === "success" ? CheckIcon : ExclamationTriangleIcon;

	return (
		<motion.button
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			initial={{ opacity: 0 }}
			className={twMerge(
				"pointer-events-auto flex items-center gap-4 rounded-lg px-6 py-4 text-left shadow-brand-1",
				{
					success: "bg-brand-gradient",
					error: "bg-black-80 border-2 border-red-500",
					warning: "bg-black-80 border-2 border-yellow-500"
				}[toast.type]
			)}
			onClick={() => toast.remove()}
		>
			<Icon className="h-5 w-5" strokeWidth={2} />
			{toast.children}
		</motion.button>
	);
};

export const ToastProvider: React.FC<PropsWithChildren> = ({ children }) => {
	const [toasts, setToasts] = useState<Array<Toast>>([]);

	const remove = useCallback((toast: Pick<Toast, "id">) => {
		setToasts((toasts) => toasts.filter(({ id }) => id !== toast.id));
	}, []);

	const add = useCallback(
		({ type, ttl = "5s", label, children }: CreateToast) => {
			const toast: Toast = {
				type,
				id: String(performance.now()),
				ttl: ttl ? ms(ttl) : null,
				children: (
					<div className="flex flex-col">
						{label && <span className="font-montserrat font-semibold">{label}</span>}
						{children}
					</div>
				),
				remove: function () {
					remove(this);
				}
			};

			if (toast.ttl) setTimeout(() => toast.remove(), toast.ttl);

			setToasts((toasts) => [toast, ...toasts]);
			return toast;
		},
		[remove]
	);

	const addError = useCallback(
		(reason: unknown) => {
			const message =
				(typeof reason === "object" &&
					reason !== null &&
					"message" in reason &&
					typeof reason.message === "string" &&
					reason.message) ||
				"Unknown request error";

			console.error(reason);

			return add({
				type: "error",
				label: message
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
			<div className="pointer-events-none fixed right-0 top-0 z-[999] flex flex-col-reverse gap-2 p-8 text-white-20">
				<AnimatePresence>
					{toasts.map((toast) => (
						<ToastItem {...toast} key={toast.id} />
					))}
				</AnimatePresence>
			</div>
		</ToastContext.Provider>
	);
};
