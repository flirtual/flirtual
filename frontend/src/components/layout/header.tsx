import { NavigationInner } from "./navigation/inner";

export async function Header() {
	return (
		<div className="hidden w-full flex-col sm:flex sm:h-20">
			<header className="fixed z-10 flex w-full flex-col text-white-20">
				<div className="absolute top-0 h-full w-full flex-col bg-brand-gradient shadow-brand-1 md:ml-[-50vw] md:mt-[calc(-50vw+80px)] md:h-[50vw] md:w-[200vw] md:rounded-half" />
				{/* <HeaderMessage className="hidden sm:flex">
				Download the{" "}
				<InlineLink
					className="font-semibold before:absolute before:left-0 before:top-0 before:h-full before:w-full"
					highlight={false}
					href="/download"
				>
					{" "}
					mobile app
				</InlineLink>{" "}
				for a better experience!
			</HeaderMessage> */}
				<div className="z-10 flex w-full flex-col items-center justify-center py-2">
					{/* @ts-expect-error: Server Component */}
					<NavigationInner />
				</div>
			</header>
		</div>
	);
}
