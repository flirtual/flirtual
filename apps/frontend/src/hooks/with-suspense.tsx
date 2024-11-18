/* eslint-disable ts/no-empty-object-type */
import type { FC, ReactNode, SuspenseProps } from "react";
import { Suspense } from "react";

export type WithSuspenseOptions<T = {}> = {
	fallback?: FC<T> | ReactNode;
} & Omit<SuspenseProps, "children" | "fallback">;

export function withSuspense<T = {}>(Component: FC<T>, { fallback, ...options }: WithSuspenseOptions<T> = {}): FC<T> {
	return (props) => (
		<Suspense
			{...options}
			fallback={typeof fallback === "function" ? fallback(props) : fallback}
		>
			{/* @ts-expect-error: ? */}
			<Component {...props} />
		</Suspense>
	);
}
