"use client";

import React, { useState } from "react";
import { twMerge } from "tailwind-merge";

import { clamp } from "~/utilities";

const ProfileImage: React.FC<React.ComponentProps<"img">> = (props) => (
	<img {...props} className={twMerge("object-cover aspect-square", props.className)} />
);

type ImageSelectButtonProps = React.ComponentProps<"button"> & { active?: boolean };

const ImageSelectButton: React.FC<ImageSelectButtonProps> = ({ active, ...props }) => {
	return (
		<button
			{...props}
			type="button"
			className={twMerge(
				"grow h-1.5 rounded-full",
				active ? "bg-brand-white/50" : "bg-brand-black/50",
				props.className
			)}
		/>
	);
};

export interface ProfileImageDisplayProps {
	images: Array<string>;
	children: React.ReactNode;
}

export const ProfileImageDisplay: React.FC<ProfileImageDisplayProps> = ({ images, children }) => {
	const [imageOffset, setImageOffset] = useState(0);

	return (
		<div className="relative overflow-hidden shrink-0">
			<div className="flex">
				<div className="flex md:w-3/4 relative aspect-square shrink-0">
					<ProfileImage src={images[imageOffset]} />
					<div className="absolute w-full flex h-full">
						<button
							className="h-full grow"
							type="button"
							onClick={() => setImageOffset(clamp(imageOffset - 1, 0, images.length))}
						/>
						<button
							className="h-full grow"
							type="button"
							onClick={() => setImageOffset((imageOffset + 1) % images.length)}
						/>
					</div>
					<div className="to-black/60 pointer-events-none via-black/20 absolute h-full w-full bg-gradient-to-b from-transparent bottom-0">
						{children}
					</div>
				</div>
				<div className="flex-col hidden md:flex">
					{[...images, ...images].slice(imageOffset + 1, imageOffset + 4).map((image, imageIdx) => (
						<ProfileImage
							key={imageIdx}
							src={image}
							onClick={() => setImageOffset((imageIdx + imageOffset + 1) % images.length)}
						/>
					))}
				</div>
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
							onClick={() => setImageOffset(imageIdx)}
						/>
					))}
				</div>
			</div>
		</div>
	);
};
