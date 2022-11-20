"use client";

import React, { useState } from "react";
import { twMerge } from "tailwind-merge";

const ProfileImage: React.FC<React.ComponentProps<"img">> = (props) => (
	<img {...props} className={twMerge("aspect-square object-cover", props.className)} />
);

export interface ProfileImageDisplayProps {
	images: Array<string>;
	children: React.ReactNode;
}

export const ProfileImageDisplay: React.FC<ProfileImageDisplayProps> = ({ images, children }) => {
	const [imageOffset, setImageOffset] = useState(0);

	const set = (direction: -1 | 0 | 1, imageIdx?: number) => {
		setImageOffset((imageOffset) => {
			if (imageIdx !== undefined) return imageIdx;

			const newImageOffset = imageOffset + direction;
			return (newImageOffset < 0 ? images.length - 1 : newImageOffset) % images.length;
		});
	};

	return (
		<div className="relative shrink-0 overflow-hidden">
			<div className="relative flex aspect-square shrink-0 bg-black-70">
				{images.map((image, imageIdx) => (
					<ProfileImage
						key={imageIdx}
						src={image}
						className={twMerge(
							"transition-opacity duration-500",
							imageOffset === imageIdx ? "opacity-100" : "absolute h-full w-full opacity-0"
						)}
					/>
				))}
				<div className="absolute flex h-full w-full">
					<button className="h-full grow" type="button" onClick={() => set(-1)} />
					<button className="h-full grow" type="button" onClick={() => set(1)} />
				</div>
				<div className="absolute top-0 flex w-full px-8 py-6">
					<div className="flex grow items-center gap-2">
						{images.map((_, imageIdx) => (
							<button
								key={imageIdx}
								type="button"
								className={twMerge(
									"h-1.5 grow rounded-full",
									imageOffset === imageIdx ? "bg-white-10/50" : "bg-black-70/50"
								)}
								onClick={() => set(0, imageIdx)}
							/>
						))}
					</div>
				</div>
				<div className="pointer-events-none absolute bottom-0 h-full w-full bg-gradient-to-b from-transparent via-black-90/20 to-black-90/60">
					{children}
				</div>
			</div>
		</div>
	);
};
