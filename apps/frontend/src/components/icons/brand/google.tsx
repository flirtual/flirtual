import type { IconComponentProps } from "..";

export function GoogleIcon(props: IconComponentProps) {
	return (
		<svg
			{...props}
			fill="currentColor"
			role="img"
			viewBox="0 0 22 22"
			xmlns="http://www.w3.org/2000/svg"
		>
			<title>Google</title>
			<path d="M11 0C6.7 0 2.99 2.47 1.18 6.07.43 7.55 0 9.22 0 11c0 1.78.43 3.45 1.18 4.93v.01C2.99 19.53 6.7 22 11 22c2.97 0 5.46-.98 7.28-2.66 2.08-1.92 3.28-4.74 3.28-8.09 0-.78-.07-1.53-.2-2.25H11v4.26h5.92a5.072 5.072 0 0 1-2.21 3.31c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53h-.014l.014-.01A6.59 6.59 0 0 1 4.49 11c0-.73.13-1.43.35-2.09.87-2.6 3.3-4.53 6.16-4.53 1.62 0 3.06.56 4.21 1.64l3.15-3.15C16.45 1.09 13.97 0 11 0Z" />
		</svg>
	);
}
