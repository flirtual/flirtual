import { createContext, Fragment, use, useCallback, useMemo, useState } from "react";
import type { Dispatch, PropsWithChildren, ReactNode, SetStateAction } from "react";

const DialogContext = createContext({} as { dialogs: Array<ReactNode>; setDialogs: Dispatch<SetStateAction<Array<ReactNode>>> });

export function DialogProvider({ children }: PropsWithChildren) {
	const [dialogs, setDialogs] = useState<Array<ReactNode>>([]);
	const value = useMemo(() => ({ dialogs, setDialogs }), [dialogs]);

	return (
		<DialogContext value={value}>
			{children}
			{/* eslint-disable-next-line react/no-array-index-key */}
			{dialogs.map((dialog, index) => <Fragment key={index}>{dialog}</Fragment>)}
		</DialogContext>
	);
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDialog() {
	const { setDialogs } = use(DialogContext);

	const add = useCallback((node: ReactNode) => {
		setDialogs((previous) => [...previous, node]);
	}, [setDialogs]);

	const remove = useCallback((node: ReactNode) => {
		setDialogs((previous) => previous.filter((dialog) => dialog !== node));
	}, [setDialogs]);

	return {
		add,
		remove
	};
}
