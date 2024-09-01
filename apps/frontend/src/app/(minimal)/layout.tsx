import type { PropsWithChildren } from "react";

export default function MinimalLayout({ children }: PropsWithChildren) {
	return (
		<div className="flex min-h-screen w-full grow flex-col items-center bg-white-20 font-nunito text-black-80 vision:bg-transparent dark:bg-black-70 dark:text-white-20 desktop:flex-col desktop:bg-cream desktop:p-8 desktop:dark:bg-black-80">
			{children}
		</div>
	);
}
