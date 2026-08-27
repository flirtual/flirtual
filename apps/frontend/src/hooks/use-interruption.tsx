import { createContext, use, useCallback, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";

// Prompts that block the page content, to be shown one-by-one. Ordered by
// priority.
// eslint-disable-next-line react-refresh/only-export-components
export const interruptions = [
	"update_required",
	"update_available",
	"moderator_message",
	"discord_spam",
	"tour",
	"news"
] as const;

export type Interruption = (typeof interruptions)[number];

const InterruptionContext = createContext({} as {
	active: Interruption | null;
	request: (name: Interruption) => () => void;
});

export function InterruptionProvider({ children }: PropsWithChildren) {
	const [pending, setPending] = useState<Array<Interruption>>([]);

	const request = useCallback((name: Interruption) => {
		setPending((previous) => [...previous, name]);

		return () => setPending((previous) => {
			const index = previous.indexOf(name);
			return index === -1 ? previous : previous.toSpliced(index, 1);
		});
	}, []);

	const active = useMemo(
		() => interruptions.find((name) => pending.includes(name)) ?? null,
		[pending]
	);

	const value = useMemo(() => ({ active, request }), [active, request]);

	return <InterruptionContext value={value}>{children}</InterruptionContext>;
}

// Whether this prompt is the one currently allowed and wants to be shown.
// eslint-disable-next-line react-refresh/only-export-components
export function useInterruption(name: Interruption, wanted: boolean = true) {
	const { active, request } = use(InterruptionContext);

	useEffect(() => {
		if (!wanted) return;
		return request(name);
	}, [name, wanted, request]);

	return wanted && active === name;
}

// Whether any prompt is on screen, used to defer native prompts which can't be
// ordered above.
// eslint-disable-next-line react-refresh/only-export-components
export function useInterrupted() {
	return use(InterruptionContext).active !== null;
}
