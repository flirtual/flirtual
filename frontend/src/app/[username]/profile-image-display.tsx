"use client";

import React, { useState } from "react";
import { twMerge } from "tailwind-merge";

import { clamp } from "~/utilities";

const ProfileImage: React.FC<React.ComponentProps<"img">> = (props) => (
	<img {...props} className={twMerge("object-cover aspect-square", props.className)} />
);

export interface ProfileImageDisplayProps {
	images: Array<string>;
	children: React.ReactNode;
}

export const ProfileImageDisplay: React.FC<ProfileImageDisplayProps> = ({ images, children }) => {
	const [imageOffset, setImageOffset] = useState(0);

	const set = (direction: -1 | 0 | 1, imageIdx?: number) => {
		setImageOffset((imageOffset) => {
			if (imageIdx) return imageIdx;

			const newImageOffset = imageOffset + direction;
			return (newImageOffset < 0 ? images.length - 1 : newImageOffset) % images.length;
		});
	};

	return (
		<div className="relative overflow-hidden shrink-0">
			<div className="flex relative aspect-square shrink-0 bg-brand-black">
				{images.map((image, imageIdx) => (
					<ProfileImage
						key={imageIdx}
						src={image}
						className={twMerge(
							"transition-opacity duration-500",
							imageOffset === imageIdx ? "opacity-100" : "opacity-0 absolute w-full h-full"
						)}
					/>
				))}
				<div className="absolute w-full flex h-full">
					<button className="h-full grow" type="button" onClick={() => set(-1)} />
					<button className="h-full grow" type="button" onClick={() => set(1)} />
				</div>
				<div className="flex absolute w-full top-0 p-6">
					<div className="flex items-center gap-2 grow">
						{images.map((_, imageIdx) => (
							<button
								key={imageIdx}
								type="button"
								className={twMerge(
									"grow h-1.5 rounded-full",
									imageOffset === imageIdx ? "bg-brand-white/50" : "bg-brand-black/50"
								)}
								onClick={() => set(0, imageIdx)}
							/>
						))}
					</div>
				</div>
				<div className="to-black/60 pointer-events-none via-black/20 absolute h-full w-full bg-gradient-to-b from-transparent bottom-0">
					{children}
				</div>
			</div>
		</div>
	);
};
