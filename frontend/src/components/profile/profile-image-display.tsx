"use client";

import React, { useCallback, useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

import { ProfileImage } from "~/api/user/profile/images";
import { urls } from "~/urls";

export interface ProfileImageDisplayProps {
	images: Array<ProfileImage>;
	children: React.ReactNode;
}

export const ProfileImageDisplay: React.FC<ProfileImageDisplayProps> = ({ images, children }) => {
	const firstImageId = images[0]?.id;

	const [imageId, setImageId] = useState(firstImageId);
	useEffect(() => setImageId(firstImageId), [firstImageId]);

	const set = useCallback(
		(direction: -1 | 0 | 1, imageId?: string) => {
			setImageId((curImageId) => {
				if (imageId !== undefined) return imageId;

				const curImageIdx = images.findIndex((image) => image.id === curImageId) ?? 0;

				const newImageOffset = curImageIdx + direction;
				const newImageId =
					images[(newImageOffset < 0 ? images.length - 1 : newImageOffset) % images.length].id;
				return newImageId;
			});
		},
		[images]
	);

	return (
		<div className="relative shrink-0 overflow-hidden">
			<div className="relative flex aspect-square shrink-0 bg-black-70">
				{images.map((image) => (
					<img
						key={image.id}
						src={image.url}
						className={twMerge(
							"aspect-square object-cover transition-opacity duration-500",
							image.id === imageId ? "opacity-100" : "absolute h-full w-full opacity-0"
						)}
						onError={({ currentTarget }) => {
							// If the image fails to load (doesn't exist), use a fallback.
							currentTarget.src = urls.media("e8212f93-af6f-4a2c-ac11-cb328bbc4aa4");
						}}
					/>
				))}
				{images.length > 1 && (
					<>
						<div className="absolute flex h-full w-full">
							<button className="h-full grow" type="button" onClick={() => set(-1)} />
							<button className="h-full grow" type="button" onClick={() => set(1)} />
						</div>
						<div className="pointer-events-auto absolute top-0 flex w-full px-8 py-6">
							<div className="flex grow items-center gap-2">
								{images.map((image) => (
									<button
										key={image.id}
										type="button"
										className={twMerge(
											"h-1.5 grow rounded-full",
											image.id === imageId ? "bg-white-10/50" : "bg-black-70/50"
										)}
										onClick={() => set(0, image.id)}
									/>
								))}
							</div>
						</div>
					</>
				)}
				<div className="pointer-events-none absolute bottom-0 h-full w-full bg-gradient-to-b from-transparent via-black-90/20 to-black-90/60">
					{children}
				</div>
			</div>
		</div>
	);
};
