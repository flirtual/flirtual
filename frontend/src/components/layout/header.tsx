import { NavigationInner } from "./navigation";

export const Header: React.FC = () => {
	return (
		<div className="hidden w-full flex-col sm:flex sm:h-20">
			<header className="fixed z-10 flex w-full flex-col text-white-20">
				<div className="absolute top-0 h-full w-full flex-col bg-brand-gradient shadow-brand-1 sm:mt-[calc(-50vw+80px)] sm:ml-[-50vw] sm:h-[50vw] sm:w-[200vw] sm:rounded-half" />
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
					<NavigationInner />
				</div>
			</header>
		</div>
	);
};
