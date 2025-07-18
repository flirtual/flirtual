import type { CSSProperties, FC } from "react";

export const InsetPreview: FC = () => {
	return (
		<div
			style={{
				"--left": "var(--safe-area-inset-left, env(safe-area-inset-left))",
				"--right": "var(--safe-area-inset-right, env(safe-area-inset-right))",
				"--top": "var(--safe-area-inset-top, env(safe-area-inset-top))",
				"--bottom": "var(--safe-area-inset-bottom, env(safe-area-inset-bottom))",
				clipPath: "polygon(0% 0%, 0% 100%, var(--left) 100%, var(--left) var(--top), calc(100% - var(--right)) var(--top), calc(100% - var(--right)) calc(100% - var(--bottom)), var(--left) calc(100% - var(--bottom)), var(--left) 100%, 100% 100%, 100% 0%)",
				backgroundImage: "repeating-linear-gradient(45deg, rgb(48, 48, 48), rgb(48, 48, 48) .5rem, rgb(24, 24, 24) .5rem, rgb(24, 24, 24) 1rem)"
			} as CSSProperties}
			className="pointer-events-none fixed z-[999] h-screen w-screen opacity-50"
		/>
	);
};
