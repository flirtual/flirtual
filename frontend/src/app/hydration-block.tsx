"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export const HydrationBlock: React.FC = () => {
	const [hydrated, setHydrated] = useState(false);
	useEffect(() => setHydrated(true), []);

	return (
		<motion.div
			className="fixed z-[9999] h-full w-full cursor-wait"
			animate={{
				pointerEvents: hydrated ? "none" : "auto",
				opacity: hydrated ? 0 : 1
			}}
		/>
	);
};
