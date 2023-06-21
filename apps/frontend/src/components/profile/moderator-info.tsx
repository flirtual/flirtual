import { Dialog } from "@capacitor/dialog";
import { FC, PropsWithChildren } from "react";
import useSWR from "swr";
import { Slot } from "@radix-ui/react-slot";
import { Clipboard } from "@capacitor/clipboard";
import { useRouter } from "next/navigation";
import { twMerge } from "tailwind-merge";

import { User } from "~/api/user";
import { api } from "~/api";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { filterBy } from "~/utilities";
import { useAttributeList } from "~/hooks/use-attribute-list";

import { DateTimeRelative } from "../datetime-relative";
import { InlineLink } from "../inline-link";

const CopyClick: FC<PropsWithChildren<{ value: string }>> = ({
	value,
	children
}) => {
	const toasts = useToast();

	return (
		<Slot
			className="cursor-pointer"
			onClick={async () => {
				await Clipboard.write({ string: value });
				toasts.add("Copied to clipboard");
			}}
		>
			{children}
		</Slot>
	);
};

export const ProfileModeratorInfo: FC<{
	user: User;
	setWarnProfileVisible: (value: boolean) => void;
}> = ({ user, setWarnProfileVisible }) => {
	const [session] = useSession();
	const toasts = useToast();
	const router = useRouter();
	const genders = useAttributeList("gender");

	const {
		data: { visible, reasons }
	} = useSWR(["user", user.id, "visible"], () => api.user.visible(user.id), {
		suspense: true
	});

	if (!session || !session.user?.tags?.includes("moderator")) return null;

	return (
		<div className="-mx-4 flex flex-col gap-4 rounded-xl bg-white-30 px-4 py-3 font-mono dark:bg-black-90/80 dark:text-white-20">
			<div className="flex flex-col">
				<span>
					<span className="font-bold">ID:</span>{" "}
					<CopyClick value={user.id}>
						<span className="brightness-75 hover:brightness-100">
							{user.id}
						</span>
					</CopyClick>
				</span>
				<span>
					<span className="font-bold">Legacy ID:</span>{" "}
					<CopyClick value={user.talkjsId}>
						<span className="brightness-75 hover:brightness-100">
							{user.talkjsId}
						</span>
					</CopyClick>
				</span>
				<span>
					<span className="font-bold">Username:</span>{" "}
					<CopyClick value={user.username}>
						<span className="brightness-75 hover:brightness-100">
							{user.username}
						</span>
					</CopyClick>
				</span>
			</div>
			<div className="flex flex-col">
				{user.createdAt && (
					<span>
						<span className="font-bold">Registered:</span>{" "}
						<CopyClick value={user.createdAt}>
							<DateTimeRelative
								className="brightness-75 hover:brightness-100"
								value={user.createdAt}
							/>
						</CopyClick>
					</span>
				)}
				{user.activeAt && (
					<span>
						<span className="font-bold">Last login:</span>{" "}
						<CopyClick value={user.activeAt}>
							<DateTimeRelative
								className="brightness-75 hover:brightness-100"
								value={user.activeAt}
							/>
						</CopyClick>
					</span>
				)}
			</div>
			<div className="flex flex-col">
				<span>
					<span className="font-bold">Banned:</span>{" "}
					{user.bannedAt ? (
						<CopyClick value={user.bannedAt}>
							<DateTimeRelative
								className="text-red-500 brightness-75 hover:brightness-100"
								value={user.bannedAt}
							/>
						</CopyClick>
					) : (
						<span className="brightness-75 hover:brightness-100">No</span>
					)}
				</span>
				<span>
					<span className="font-bold">Shadowbanned:</span>{" "}
					{user.shadowbannedAt ? (
						<CopyClick value={user.shadowbannedAt}>
							<DateTimeRelative
								className="text-red-500"
								value={user.shadowbannedAt}
							/>
						</CopyClick>
					) : (
						<span className="brightness-75 hover:brightness-100">No</span>
					)}
				</span>
				<span>
					<span className="font-bold">Deactivated:</span>{" "}
					{user.deactivatedAt ? (
						<CopyClick value={user.deactivatedAt}>
							<DateTimeRelative
								className="text-red-500"
								value={user.deactivatedAt}
							/>
						</CopyClick>
					) : (
						<span className="brightness-75 hover:brightness-100">No</span>
					)}
				</span>
				<span>
					<span className="font-bold">Visible:</span>{" "}
					{visible ? (
						<span className="brightness-75 hover:brightness-100">Yes</span>
					) : (
						<span className="text-red-500 brightness-75 hover:brightness-100">
							No
							{reasons.length > 0
								? `, ${reasons.map(({ reason }) => reason).join(", ")}.`
								: ""}
						</span>
					)}
				</span>
				<span>
					<span className="font-bold">Premium:</span>{" "}
					{user.subscription?.active ? (
						<span className="text-green-500 brightness-75 hover:brightness-100">
							{user.subscription.plan.name}
						</span>
					) : (
						<span className="brightness-75 hover:brightness-100">No</span>
					)}
				</span>
			</div>
			<div className="flex flex-col">
				<span>
					<span className="font-bold">Moderator Message:</span>{" "}
					<span
						className={twMerge(
							user.moderatorMessage && "text-yellow-500",
							"cursor-pointer brightness-75 hover:brightness-100"
						)}
						onClick={() => setWarnProfileVisible(true)}
					>
						{user.moderatorMessage ?? "None"}
					</span>
				</span>
				<span>
					<span className="font-bold">Moderator Note:</span>{" "}
					<span
						className="cursor-pointer brightness-75 hover:brightness-100"
						onClick={async () => {
							const { value, cancelled } = await Dialog.prompt({
								message: "Moderator Note",
								inputText: user.moderatorNote,
								title: "Moderator Note"
							});

							if (cancelled) return;

							if (!value && !!user.moderatorNote) {
								await api.user
									.deleteNote(user.id)
									.then(() => {
										toasts.add("Note deleted");
										return router.refresh();
									})
									.catch(toasts.addError);

								return;
							}

							await api.user
								.note(user.id, { body: { message: value } })
								.then(() => {
									toasts.add("Note updated");
									return router.refresh();
								})
								.catch(toasts.addError);
						}}
					>
						{user.moderatorNote || "None, write one by clicking here."}
					</span>
				</span>
			</div>
			{session.user.tags.includes("admin") && (
				<>
					<div className="flex flex-col">
						<span>
							<span className="font-bold">Email:</span>{" "}
							<CopyClick value={user.email}>
								<span className="cursor-pointer brightness-75 hover:brightness-100">
									{user.email}
								</span>
							</CopyClick>
						</span>
						<span>
							<span className="font-bold">Date of birth:</span>{" "}
							<span className="brightness-75 hover:brightness-100">
								{user.bornAt}
							</span>
						</span>
						<span>
							<span className="font-bold">Looking for:</span>{" "}
							<span className="brightness-75 hover:brightness-100">
								{user.profile.preferences?.agemin ?? 18}-
								{user.profile.preferences?.agemax ?? "99+"}{" "}
								{filterBy(
									user.profile.preferences?.attributes ?? [],
									"type",
									"gender"
								)
									.map(
										({ id }) => genders.find((gender) => gender.id === id)?.name
									)
									.filter(Boolean)
									.join(", ")}
							</span>
						</span>
						<span>
							<span className="font-bold">Stripe customer:</span>{" "}
							<InlineLink
								href={`https://dashboard.stripe.com/customers/${user.stripeId}`}
							>
								{user.stripeId}
							</InlineLink>
						</span>
						<span>
							<span className="font-bold">Tags:</span>{" "}
							<span className="brightness-75 hover:brightness-100">
								{user.tags?.join(", ")}
							</span>
						</span>
					</div>
				</>
			)}
		</div>
	);
};
