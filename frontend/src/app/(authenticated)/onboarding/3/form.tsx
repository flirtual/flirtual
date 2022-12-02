"use client";

import byteSize from "byte-size";
import {
	EllipsisHorizontalIcon,
	PencilSquareIcon,
	PhotoIcon,
	TrashIcon
} from "@heroicons/react/24/solid";
import React, { useEffect, useRef, useState } from "react";
import { DndProvider, useDrag, useDragLayer, useDrop } from "react-dnd";
import { getEmptyImage, HTML5Backend } from "react-dnd-html5-backend";
import { twMerge } from "tailwind-merge";
import { LinkIcon } from "@heroicons/react/24/outline";
import { Discord } from "@icons-pack/react-simple-icons";
import { useRouter } from "next/navigation";

import { InputFile, InputLabel, InputLabelHint, InputSelect, InputText } from "~/components/inputs";
import { useCurrentUser } from "~/hooks/use-current-user";
import { privacyOptionLabel } from "~/const";
import { IconComponent } from "~/components/icons";
import { api } from "~/api";
import { pick } from "~/utilities";
import { PrivacyPreferenceOptions } from "~/api/user/preferences";
import { Form } from "~/components/forms";

interface ArrangeableImageProps {
	src: string;
	idx: number;
	moveImage: (sourceIdx: number, targetIdx: number) => void;
	onDelete: () => void;
}

interface DragItem {
	itemIdx: number;
}

const ArrangeableImagePreview: React.FC<React.ComponentProps<"img">> = (props) => (
	<img
		{...props}
		className={twMerge("aspect-square h-full w-full rounded-md object-cover", props.className)}
	/>
);

const ArrangeableImage: React.FC<ArrangeableImageProps> = ({ src, idx, moveImage, onDelete }) => {
	const [{ dragging }, dragRef, preview] = useDrag({
		type: "item",
		item: { itemIdx: idx } as DragItem,
		collect: (monitor) => ({
			dragging: monitor.isDragging()
		})
	});

	useEffect(() => void preview(getEmptyImage(), {}), [preview]);

	const [, dropRef] = useDrop({
		accept: "item",
		drop: (item: DragItem) => {
			moveImage(idx, item.itemIdx);
			item.itemIdx = idx;
		}
	});

	const ref = useRef<HTMLDivElement | null>(null);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const dragDropRef = dragRef(dropRef(ref)) as any;

	const { currentItem, dragOffset } = useDragLayer((monitor) => {
		const currentItem = monitor.getItem() as DragItem;
		const dragOffset = monitor.getDifferenceFromInitialOffset() ?? { x: 0, y: 0 };

		return {
			currentItem,
			dragOffset
		};
	});

	const [fullPreview, setFullPreview] = useState(false);

	return (
		<>
			{fullPreview && (
				<div
					className="fixed top-0 left-0 z-40 flex h-full w-full items-center justify-center bg-black-90/60 p-4 backdrop-blur-sm md:p-16"
					onClick={() => setFullPreview(false)}
				>
					<ArrangeableImagePreview className="h-auto w-full md:w-96" src={src} />
				</div>
			)}
			<div className="group relative aspect-square max-h-full w-full shrink-0" ref={dragDropRef}>
				{dragging && (
					<div
						className="pointer-events-none absolute top-0 left-0 z-50 w-24 rounded-md shadow-brand-1"
						style={{ transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)` }}
					>
						<ArrangeableImagePreview src={src} />
					</div>
				)}
				<ArrangeableImagePreview
					className={twMerge("transition-all", dragging && "brightness-50")}
					src={src}
				/>
				<div
					className={twMerge(
						"absolute top-0 right-0 p-2",
						currentItem ? "opacity-0" : "opacity-100"
					)}
				>
					<div className="flex items-center justify-center rounded-md bg-black-70/80 p-1 transition-all group-hocus-within:bg-black-70">
						<div className="flex w-0 items-center justify-center gap-2 opacity-0 transition-all group-hocus-within:w-fit group-hocus-within:pr-2 group-hocus-within:opacity-100">
							<button className="opacity-60 hocus:opacity-100" type="button" onClick={onDelete}>
								<TrashIcon className="h-4 w-4 text-white-20" />
							</button>
							<button
								className="opacity-60 hocus:opacity-100"
								type="button"
								onClick={() => {
									setFullPreview((fullPreview) => !fullPreview);
								}}
							>
								<PencilSquareIcon className="h-4 w-4 text-white-20" />
							</button>
						</div>
						<button className="opacity-60 hocus:opacity-100" type="button">
							<EllipsisHorizontalIcon className="h-4 w-4 text-white-20" strokeWidth={3} />
						</button>
					</div>
				</div>
			</div>
		</>
	);
};

type ArrangeableImageSetValue = Array<
	Omit<ArrangeableImageProps, "idx" | "moveImage" | "onDelete">
>;

const ArrangeableImageSet: React.FC<{
	value: ArrangeableImageSetValue;
	onChange?: React.Dispatch<ArrangeableImageSetValue>;
}> = ({ value, onChange }) => {
	return (
		<div className="grid grid-cols-3 gap-2">
			{value.map((image, imageIdx) => (
				<ArrangeableImage
					{...image}
					idx={imageIdx}
					key={imageIdx}
					moveImage={(sourceIdx: number, targetIdx: number) => {
						const sourceItem = value[sourceIdx];
						const targetItem = value[targetIdx];

						const newValue = [...value];
						newValue[sourceIdx] = targetItem;
						newValue[targetIdx] = sourceItem;

						onChange?.(newValue);
					}}
					onDelete={() => {
						onChange?.(value.filter((_, idx) => imageIdx !== idx));
					}}
				/>
			))}
		</div>
	);
};

interface AccountConnectionButtonProps {
	children: string;
	accountName?: string;
	Icon: IconComponent;
	iconClassName?: string;
}

const AccountConnectionButton: React.FC<AccountConnectionButtonProps> = (props) => {
	const { children, accountName, iconClassName, Icon } = props;

	return (
		<button
			className="flex w-full cursor-pointer overflow-hidden rounded-xl bg-white-40 text-left shadow-brand-1 focus-within:ring-2 focus-within:ring-coral focus-within:ring-offset-2 focus:outline-none dark:bg-black-60 dark:text-white-20 focus-within:dark:ring-offset-black-50"
			type="button"
		>
			<div
				className={twMerge(
					"flex aspect-square h-12 w-12 items-center justify-center p-2 text-white-20",
					iconClassName
				)}
			>
				<Icon className="h-7 w-7" />
			</div>
			<div className="flex flex-col px-4 py-2 font-nunito leading-none">
				<span>{children}</span>
				<span className="text-sm leading-none text-black-60">
					{accountName ?? "Connect account"}
				</span>
			</div>
		</button>
	);
};

export const Onboarding3Form: React.FC = () => {
	const { data: user } = useCurrentUser();
	const router = useRouter();

	if (!user) return null;

	return (
		<DndProvider backend={HTML5Backend}>
			<Form
				className="flex flex-col gap-8"
				fields={{
					displayName: user.profile.displayName || user.username || "",
					images: [] as Array<{ file: File; src: string }>,
					biography: user.profile.biography || "",
					connectionsPrivacy: user.preferences.privacy.connections ?? "matches"
				}}
				onSubmit={async (values) => {
					await Promise.all([
						api.user.profile.update(user.id, pick(values, ["displayName", "biography"])),
						api.user.preferences.updatePrivacy(user.id, {
							connections: values.connectionsPrivacy
						})
					]);

					if (values.images.length) {
						const files = values.images.map((image) => image.file);
						await api.user.profile.images.upload(user.id, files, {
							uploadOptions: { store: true }
						});
					}

					router.push("/onboarding/4");
				}}
			>
				{({ submitting, FormField }) => (
					<>
						<FormField name="displayName">
							{(field) => (
								<>
									<InputLabel {...field.labelProps}>Display name</InputLabel>
									<InputText {...field.props} />
									<InputLabelHint className="text-sm">
										This is how you&apos;ll appear around Flirtual. Your display name can contain
										special characters and doesn&apos;t need to be unique. Your profile link (
										<span className="font-mono">
											flirtu.al/
											{user.username}
										</span>
										) will still use your username.
									</InputLabelHint>
								</>
							)}
						</FormField>
						<FormField name="images">
							{(field) => (
								<>
									<InputLabel {...field.labelProps} inline hint="Upload your VR avatar pictures!">
										Profile pictures
									</InputLabel>
									<ArrangeableImageSet
										value={field.props.value.map(({ src }) => ({ src }))}
										onChange={(value) =>
											field.props.onChange(
												// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
												value.map(({ src }) => field.props.value.find((a) => a.src === src)!)
											)
										}
									/>
									<label
										className="flex cursor-pointer items-center overflow-hidden rounded-xl bg-white-40 text-left shadow-brand-1 focus-within:ring-2 focus-within:ring-coral focus-within:ring-offset-2 focus:outline-none dark:bg-black-60 dark:text-white-20 focus-within:dark:ring-offset-black-50"
										htmlFor={field.labelProps.htmlFor}
										tabIndex={0}
									>
										<div className="flex items-center justify-center bg-brand-gradient p-2 text-white-20">
											<PhotoIcon className="h-7 w-7" />
										</div>
										<span className="px-4 py-2 font-nunito">
											{field.props.value.length ? "Choose new images" : "Choose images"}
										</span>
									</label>
									<InputLabelHint>
										{field.props.value.length} file{field.props.value.length === 1 ? "" : "s"}{" "}
										total,{" "}
										{byteSize(
											field.props.value
												.map(({ file }) => file.size)
												.reduce((prev, curr) => prev + curr, 0)
										).toString()}
									</InputLabelHint>
									<InputFile
										multiple
										accept="image/*"
										className="hidden"
										id={field.props.id}
										value={[]}
										onChange={(files) =>
											field.props.onChange(
												files.map((file) => ({ file, src: URL.createObjectURL(file) }))
											)
										}
									/>
								</>
							)}
						</FormField>
						<FormField name="biography">
							{(field) => (
								<>
									<InputLabel {...field.labelProps}>Biography</InputLabel>
									<InputText {...field.props} />
								</>
							)}
						</FormField>
						<div className="flex flex-col gap-2">
							<InputLabel>Connect accounts</InputLabel>
							<div className="flex flex-col gap-4">
								<AccountConnectionButton Icon={Discord} iconClassName="bg-[#5865F2]">
									Discord
								</AccountConnectionButton>
								<AccountConnectionButton Icon={LinkIcon} iconClassName="bg-black-70">
									VRChat
								</AccountConnectionButton>
							</div>
						</div>

						<FormField name="connectionsPrivacy">
							{(field) => (
								<>
									<InputLabel inline hint="Who can see your connected accounts?">
										Connected account privacy
									</InputLabel>
									<InputSelect
										{...field.props}
										options={PrivacyPreferenceOptions.map((option) => ({
											key: option,
											label: privacyOptionLabel[option]
										}))}
									/>
								</>
							)}
						</FormField>

						<button
							className="relative rounded-xl bg-brand-gradient p-4 text-white-10 shadow-brand-1 focus:outline-none focus:ring-2  focus:ring-coral focus:ring-offset-2"
							type="submit"
						>
							<span className="font-montserrat text-xl font-semibold">Continue</span>
							{submitting && (
								<div className="absolute right-0 top-0 flex h-full items-center px-4">
									<svg
										className="w-10"
										fill="#fff"
										viewBox="0 0 140 64"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											d="M30.262 57.02L7.195 40.723c-5.84-3.976-7.56-12.06-3.842-18.063 3.715-6 11.467-7.65 17.306-3.68l4.52 3.76 2.6-5.274c3.717-6.002 11.47-7.65 17.305-3.68 5.84 3.97 7.56 12.054 3.842 18.062L34.49 56.118c-.897 1.512-2.793 1.915-4.228.9z"
											fillOpacity=".5"
										>
											<animate
												attributeName="fill-opacity"
												begin="0s"
												calcMode="linear"
												dur="1.4s"
												repeatCount="indefinite"
												values="0.5;1;0.5"
											/>
										</path>
										<path
											d="M105.512 56.12l-14.44-24.272c-3.716-6.008-1.996-14.093 3.843-18.062 5.835-3.97 13.588-2.322 17.306 3.68l2.6 5.274 4.52-3.76c5.84-3.97 13.592-2.32 17.307 3.68 3.718 6.003 1.998 14.088-3.842 18.064L109.74 57.02c-1.434 1.014-3.33.61-4.228-.9z"
											fillOpacity=".5"
										>
											<animate
												attributeName="fill-opacity"
												begin="0.7s"
												calcMode="linear"
												dur="1.4s"
												repeatCount="indefinite"
												values="0.5;1;0.5"
											/>
										</path>
										<path d="M67.408 57.834l-23.01-24.98c-5.864-6.15-5.864-16.108 0-22.248 5.86-6.14 15.37-6.14 21.234 0L70 16.168l4.368-5.562c5.863-6.14 15.375-6.14 21.235 0 5.863 6.14 5.863 16.098 0 22.247l-23.007 24.98c-1.43 1.556-3.757 1.556-5.188 0z" />
									</svg>
								</div>
							)}
						</button>
					</>
				)}
			</Form>
		</DndProvider>
	);
};
