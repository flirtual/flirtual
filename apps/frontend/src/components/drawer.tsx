import { motion, AnimatePresence } from "framer-motion";
import { useRef } from "react";
import { Portal } from "react-portal";

import { useClickOutside } from "~/hooks/use-click-outside";
import { useGlobalEventListener } from "~/hooks/use-event-listener";

import flirtualMark from "../../public/images/brand/mark/default.svg";

export interface DrawerProps {
	visible: boolean;
	children: React.ReactNode;
	onVisibilityChange: React.Dispatch<boolean>;
}

export const Drawer: React.FC<DrawerProps> = (props) => {
	const { visible, children, onVisibilityChange } = props;
	const overlayReference = useRef<HTMLDivElement>(null);

	useClickOutside(overlayReference, () => onVisibilityChange(false), visible);
	useGlobalEventListener(
		"document",
		"scroll",
		() => onVisibilityChange(false),
		visible
	);

	return (
		<AnimatePresence>
			{visible && (
				<Portal>
					<motion.div
						animate={{ y: 0 }}
						className="fixed bottom-0 left-0 z-50 w-full rounded-t-3xl bg-brand-gradient pt-1 shadow-brand-1"
						drag="y"
						dragConstraints={{ top: 0, bottom: 0 }}
						exit={{ y: "100%" }}
						initial={{ y: "100%" }}
						ref={overlayReference}
						transition={{ damping: 25 }}
						onDragEnd={(_, { offset }) => {
							if (offset.y > 300) onVisibilityChange(false);
						}}
					>
						<div className="relative flex w-full flex-col justify-center gap-y-3 rounded-t-3xl bg-white-30 px-3 py-4 dark:bg-black-70">
							<div className="px-3 pt-1">
								<div className="h-2 w-full rounded-full bg-white-20 dark:bg-black-60" />
							</div>
							<div className="h-full">{children}</div>
							<div className="absolute left-0 top-full -z-10 flex h-screen w-screen justify-center bg-white-30 p-16 dark:bg-black-70">
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img className="h-fit w-16" src={flirtualMark.src} />
							</div>
						</div>
					</motion.div>
				</Portal>
			)}
		</AnimatePresence>
	);
};
