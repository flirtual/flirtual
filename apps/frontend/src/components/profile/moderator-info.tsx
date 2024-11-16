import { Dialog } from "@capacitor/dialog";
import { Eye, EyeOff } from "lucide-react";
import type { FC } from "react";
import { capitalize } from "remeda";
import { mutate } from "swr";
import { twMerge } from "tailwind-merge";

import { User } from "~/api/user";
import { useAttributeTranslation } from "~/hooks/use-attribute";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { useUser } from "~/hooks/use-user";
import { userKey } from "~/swr";

import { CopyClick } from "../copy-click";
import { DateTimeRelative } from "../datetime-relative";
import { InlineLink } from "../inline-link";

export const ProfileModeratorInfo: FC<{
	userId: string;
}> = ({ userId }) => {
	const [session] = useSession();
	const toasts = useToast();
	const tAttributes = useAttributeTranslation();
	const user = useUser(userId, { cache: "no-cache" });

	if (!user || !session || !session.user?.tags?.includes("moderator")) return null;

	return (
		<div
			data-block
			className="select-children -mx-4 flex flex-col gap-4 rounded-xl bg-white-30 px-4 py-3 font-mono shadow-brand-inset vision:bg-white-30/70 dark:bg-black-90/80 dark:text-white-20"
		>
			<div className="flex flex-col">
				<span>
					<span className="font-bold">Moderator Note (private):</span>
					{" "}
					<span
						className={twMerge(
							"cursor-pointer hover:underline",
							user.moderatorNote && "text-yellow-600"
						)}
						onClick={async () => {
							const { value: message, cancelled } = await Dialog.prompt({
								message: "Moderator Note",
								inputText: user.moderatorNote,
								title: "Moderator Note"
							});

							if (cancelled) return;

							if (!message && !!user.moderatorNote) {
								await User.deleteNote(user.id).catch(toasts.addError);
								mutate(userKey(user.id));

								toasts.add("Note deleted");
								return;
							}

							await User.note(user.id, { message }).catch(toasts.addError);
							mutate(userKey(user.id));

							toasts.add("Note updated");
						}}
					>
						{user.moderatorNote || "None"}
					</span>
				</span>
			</div>
			<div className="flex flex-col">
				<span>
					<span className="font-bold">ID:</span>
					{" "}
					<CopyClick value={user.id}>
						<span className="hover:underline">{user.id}</span>
					</CopyClick>
				</span>
				<span>
					<span className="font-bold">Legacy ID:</span>
					{" "}
					<CopyClick value={user.talkjsId}>
						<span className="hover:underline">{user.talkjsId}</span>
					</CopyClick>
				</span>
				<span>
					<span className="font-bold">Profile link:</span>
					{" "}
					<CopyClick value={user.slug}>
						<span className="hover:underline">{user.slug}</span>
					</CopyClick>
				</span>
			</div>
			<div className="flex flex-col">
				{user.createdAt && (
					<span>
						<span className="font-bold">Registered:</span>
						{" "}
						<CopyClick value={user.createdAt}>
							<DateTimeRelative
								className="hover:underline"
								value={user.createdAt}
							/>
						</CopyClick>
					</span>
				)}
				{user.activeAt && (
					<span>
						<span className="font-bold">Last login:</span>
						{" "}
						<CopyClick value={user.activeAt}>
							<DateTimeRelative
								className="hover:underline"
								value={user.activeAt}
							/>
						</CopyClick>
					</span>
				)}
			</div>
			<div className="flex flex-col">
				<span>
					<span className="font-bold">Status:</span>
					{" "}
					<span
						className={twMerge(
							"inline-flex gap-2",
							user.status === "visible"
								? "text-green-600"
								: user.status === "finished_profile"
									? "text-yellow-600"
									: user.status === "onboarded"
										? "text-orange-600"
										: "text-red-600"
						)}
					>
						{capitalize(user.status).replace("_", " ")}
						{user.status === "visible"
							? (
									<>
										<Eye />
										{user.tnsDiscordInBiography && (
											<span className="text-red-600">
												(hidden from non-visible users)
											</span>
										)}
									</>
								)
							: (
									<EyeOff />
								)}
					</span>
				</span>
				<span>
					<span className="font-bold">Banned:</span>
					{" "}
					{user.bannedAt
						? (
								<CopyClick value={user.bannedAt}>
									<DateTimeRelative
										className="text-red-600 hover:underline"
										value={user.bannedAt}
									/>
								</CopyClick>
							)
						: (
								<span>No</span>
							)}
				</span>
				<span>
					<span className="font-bold">Shadowbanned:</span>
					{" "}
					{user.shadowbannedAt
						? (
								<CopyClick value={user.shadowbannedAt}>
									<DateTimeRelative
										className="text-red-600 hover:underline"
										value={user.shadowbannedAt}
									/>
								</CopyClick>
							)
						: (
								<span>No</span>
							)}
				</span>
				<span>
					<span className="font-bold">Indef. shadowbanned:</span>
					{" "}
					{user.indefShadowbannedAt
						? (
								<CopyClick value={user.indefShadowbannedAt}>
									<DateTimeRelative
										className="text-red-600 hover:underline"
										value={user.indefShadowbannedAt}
									/>
								</CopyClick>
							)
						: (
								<span>No</span>
							)}
				</span>
				<span>
					<span className="font-bold">Deactivated:</span>
					{" "}
					{user.deactivatedAt
						? (
								<CopyClick value={user.deactivatedAt}>
									<DateTimeRelative
										className="text-red-600 hover:underline"
										value={user.deactivatedAt}
									/>
								</CopyClick>
							)
						: (
								<span>No</span>
							)}
				</span>
				<span>
					<span className="font-bold">Premium:</span>
					{" "}
					{user.subscription?.active
						? (
								<span className="text-green-600">
									{user.subscription.plan.name}
								</span>
							)
						: (
								<span>No</span>
							)}
				</span>
				<span>
					<span className="font-bold">Payments banned:</span>
					{" "}
					{user.paymentsBannedAt
						? (
								<CopyClick value={user.paymentsBannedAt}>
									<DateTimeRelative
										className="text-red-600"
										value={user.paymentsBannedAt}
									/>
								</CopyClick>
							)
						: (
								<span>No</span>
							)}
				</span>
				<span>
					<span className="font-bold">Discord in bio:</span>
					{" "}
					{user.tnsDiscordInBiography
						? (
								<CopyClick value={user.tnsDiscordInBiography}>
									<DateTimeRelative
										className={
											new Date(user.tnsDiscordInBiography).getTime() > Date.now()
												? "text-orange-600"
												: "text-red-600"
										}
										value={user.tnsDiscordInBiography}
									/>
								</CopyClick>
							)
						: (
								<span>No</span>
							)}
				</span>
			</div>
			<span>
				<span className="font-bold">Warning (visible to user):</span>
				{" "}
				<span className={user.moderatorMessage && "text-yellow-600"}>
					{user.moderatorMessage ?? "None"}
				</span>
			</span>
			<span>
				<span className="font-bold">Looking for:</span>
				{" "}
				<span>
					{user.profile.preferences?.agemin ?? 18}
					-
					{user.profile.preferences?.agemax ?? "99+"}
					{" "}
					{user.profile.preferences?.attributes.gender
						?.map((id) => tAttributes[id]?.name ?? id)
						.join(", ")}
				</span>
			</span>
			{session.user.tags.includes("admin") && (
				<div className="flex flex-col">
					<span>
						<span className="font-bold">Email:</span>
						{" "}
						<CopyClick value={user.email}>
							<span className="cursor-pointer hover:underline">
								{user.email}
							</span>
						</CopyClick>
					</span>
					<span>
						<span className="font-bold">Date of birth:</span>
						{" "}
						<span>{user.bornAt}</span>
					</span>
					<span>
						<span className="font-bold">Chargebee customer:</span>
						{" "}
						<InlineLink
							className="underline"
							highlight={false}
							href={`https://flirtual.chargebee.com/d/customers/${user.chargebeeId}`}
						>
							{user.chargebeeId}
						</InlineLink>
					</span>
					<span>
						<span className="font-bold">Stripe customer:</span>
						{" "}
						<InlineLink
							className="underline"
							highlight={false}
							href={`https://dashboard.stripe.com/customers/${user.stripeId}`}
						>
							{user.stripeId}
						</InlineLink>
					</span>
					<span>
						<span className="font-bold">RevenueCat customer:</span>
						{" "}
						<InlineLink
							className="underline"
							highlight={false}
							href={`https://app.revenuecat.com/customers/cf0649d1/${user.revenuecatId}`}
						>
							{user.revenuecatId}
						</InlineLink>
					</span>
					<span>
						<span className="font-bold">Tags:</span>
						{" "}
						<span>
							{user.tags && user.tags.length > 0
								? user.tags?.join(", ")
								: "None"}
						</span>
					</span>
				</div>
			)}
		</div>
	);
};
