import {
	AtSign,
	Baby,
	Bot,
	Check,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	CreditCard,
	DoorOpen,
	ExternalLink,
	Eye,
	EyeOff,
	Files,
	FileText,
	Flag as FlagIcon,
	Gavel,
	Image as ImageIcon,
	ImageOff,
	Images,
	MailCheck,
	MailWarning,
	MailX,
	Megaphone,
	Plus,
	Scale,
	ShieldX,
	TextSearch,
	Trash2
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import type { FC, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { capitalize, toSnakeCase } from "remeda";
import { twMerge } from "tailwind-merge";
import { withSuspense } from "with-suspense";

import { Flag } from "~/api/flag";
import { reviewableModerationEventTypes } from "~/api/moderation-event";
import type { ModerationEvent, ModerationEventType } from "~/api/moderation-event";
import type { Report } from "~/api/report";
import type { ProfileImage } from "~/api/user/profile/images";
import { useAttributeTranslation } from "~/hooks/use-attribute";
import { useOptionalSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { useUser } from "~/hooks/use-user";
import { invalidate } from "~/query";
import { urls } from "~/urls";

import { Button } from "./button";
import { CopyClick } from "./copy-click";
import { DateTimeRelative } from "./datetime-relative";
import { Dialog, DialogContent, DialogTitle } from "./dialog/dialog";
import { DiscordIcon } from "./icons";
import { Image } from "./image";
import { InlineLink } from "./inline-link";
import { ImageToolbar } from "./profile/profile-image-display";
import { TimeRelative } from "./time-relative";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";
import { UserAvatar } from "./user-avatar";

interface EntryColor { border: string; icon: string }

const gray: EntryColor = { border: "border-l-black-20", icon: "text-black-20" };
const red: EntryColor = { border: "border-l-red-500", icon: "text-red-500" };
const yellow: EntryColor = { border: "border-l-yellow-500", icon: "text-yellow-500" };
const green: EntryColor = { border: "border-l-green-500", icon: "text-green-500" };

const entryTypes: Record<"report" | ModerationEventType, { title: string; Icon: LucideIcon; color: EntryColor }> = {
	report: { title: "New report", Icon: FlagIcon, color: gray },
	banned: { title: "User banned", Icon: Gavel, color: red },
	unbanned: { title: "User unbanned", Icon: Scale, color: green },
	indef_shadowbanned: { title: "User indefinitely shadowbanned", Icon: EyeOff, color: red },
	unindef_shadowbanned: { title: "User unshadowbanned", Icon: Eye, color: green },
	warned: { title: "User warned", Icon: MailWarning, color: yellow },
	warn_revoked: { title: "Warning revoked", Icon: MailX, color: green },
	warn_acknowledged: { title: "Warning acknowledged", Icon: MailCheck, color: green },
	payments_banned: { title: "Payments banned", Icon: CreditCard, color: red },
	payments_unbanned: { title: "Payments unbanned", Icon: CreditCard, color: green },
	image_removed: { title: "Image removed", Icon: ImageOff, color: red },
	image_quarantined: { title: "Illegal image removed", Icon: ShieldX, color: red },
	flagged_keyword: { title: "Keyword flagged", Icon: TextSearch, color: yellow },
	flagged_bio: { title: "Bio flagged", Icon: FileText, color: yellow },
	flagged_domain: { title: "New email domain", Icon: AtSign, color: gray },
	flagged_duplicate: { title: "Potential duplicate", Icon: Files, color: gray },
	flagged_image: { title: "Image auto-flagged", Icon: ImageIcon, color: gray },
	flagged_duplicate_image: { title: "Potential duplicate image", Icon: Images, color: yellow },
	flagged_registered_underage: { title: "Date of birth flagged (previously underage)", Icon: Baby, color: yellow },
	flagged_honeypot: { title: "Registration honeypot tripped", Icon: Bot, color: gray },
	appealed: { title: "Ban appealed", Icon: Megaphone, color: gray },
	deleted: { title: "Admin deleted user", Icon: Trash2, color: red },
	exit_survey: { title: "New exit survey", Icon: DoorOpen, color: gray }
};

const attributeDetails: Record<string, string> = {
	genderIds: "Genders",
	lookingForIds: "Looking for"
};

// Mirrors Discord.deliver_webhook(:flagged_duplicate): identifiers that can't be
// shared by chance are red, IP addresses yellow.
const certainDuplicateTypes = new Set(["email", "APNS token", "FCM token", "Discord ID", "device ID", "connection"]);

// Details shown some other way, or of no use to a moderator.
const hiddenDetails = new Set([
	"discordChannel",
	"discordMessageId",
	"discordMessageIds",
	"imageId",
	"imageKey",
	"imageUrl",
	"matchImageIds",
	"username",
	"moderatorUsername",
	"context",
	"classifications",
	"classification",
	"categories",
	"duplicateBanUrls",
	"duplicateUserIds",
	"shadowbanned",
	"banId",
	"reasonText",
	"key",
	"flags",
	"flagsText",
	"reason",
	"domain",
	"provider",
	"type",
	"text",
	"distance",
	"previousBornAt",
	"bornAt"
]);

export type ModerationEntry = { id: string; createdAt: string } & (
	| { kind: "event"; event: ModerationEvent }
	| { kind: "report"; report: Report }
);

// Each list is in API order; the stable sort only breaks ties by kind, matching
// ModerationCursor, since ShortUUIDs don't sort like the database's UUIDs.
// eslint-disable-next-line react-refresh/only-export-components
export function toModerationEntries(
	events: Array<ModerationEvent>,
	reports: Array<Report>,
	order: "asc" | "desc" = "desc"
): Array<ModerationEntry> {
	const direction = order === "asc" ? 1 : -1;

	return [
		...events.map((event) => ({ kind: "event" as const, id: event.id, createdAt: event.createdAt, event })),
		...reports.map((report) => ({ kind: "report" as const, id: report.id, createdAt: report.createdAt, report }))
	].sort((a, b) => direction * (a.createdAt.localeCompare(b.createdAt) || a.kind.localeCompare(b.kind)));
}

function text(value: unknown): string | undefined {
	if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : undefined;
	if (typeof value === "string" || typeof value === "number") return String(value);
}

function isUrl(value: unknown): value is string {
	return typeof value === "string" && /^https?:\/\//.test(value);
}

function humanize(key: string): string {
	return capitalize(key.replaceAll(/([A-Z])/g, " $1").toLowerCase())
		.replaceAll(/\b(id|url)(s?)\b/gi, (_, word: string, plural: string) => word.toUpperCase() + plural);
}

const UserName: FC<{ userId: string; fallback?: string; className?: string }> = withSuspense(({ userId, fallback, className }) => {
	const user = useUser(userId);
	const name = user ? user.profile.displayName || user.slug : fallback ?? "Deleted user";

	return (
		<span className={className}>
			{user
				? (
						<InlineLink
							className="underline"
							highlight={false}
							href={urls.profile(userId)}
							target="_blank"
						>
							{name}
						</InlineLink>
					)
				: <span className="italic">{name}</span>}
			{" "}
			<CopyClick value={userId}>
				<span className="hover:underline">{`(${userId})`}</span>
			</CopyClick>
		</span>
	);
}, {
	fallback: ({ userId, className }) => <span className={twMerge("animate-pulse", className)}>{userId}</span>
});

const SubjectAvatar: FC<{ userId: string }> = withSuspense(({ userId }) => {
	const user = useUser(userId);

	return (
		<UserAvatar
			className="size-7 shrink-0 rounded-full object-cover"
			height={28}
			user={user}
			variant="icon"
			width={28}
		/>
	);
}, {
	fallback: () => <span className="size-7 shrink-0 animate-pulse rounded-full bg-black-50/20" />
});

const Subject: FC<{ userId?: string; fallback?: string }> = ({ userId, fallback }) => (
	<div className="flex items-center gap-2">
		{userId
			? (
					<>
						<SubjectAvatar userId={userId} />
						<UserName className="text-lg" fallback={fallback} userId={userId} />
					</>
				)
			: <span className="text-lg italic">{fallback ?? "Deleted user"}</span>}
	</div>
);

const UserDisplayName: FC<{ userId: string; fallback?: string }> = withSuspense(({ userId, fallback }) => {
	const user = useUser(userId);

	return (
		<span className={twMerge("max-w-40 shrink-0 truncate font-semibold", !user && "italic")}>
			{user ? user.profile.displayName || user.slug : fallback ?? "Deleted user"}
		</span>
	);
}, {
	fallback: () => <span className="w-20 shrink-0 animate-pulse rounded bg-black-50/20" />
});

// The Discord-style **bold** that flag context highlights keywords with.
const InlineMarkdown: FC<{ children: string }> = ({ children }) => (
	<>
		{children.split(/(\*\*[^*]+\*\*)/).map((part, index) => {
			const bold = /^\*\*([^*]+)\*\*$/.exec(part);

			// eslint-disable-next-line react/no-array-index-key
			return bold ? <strong key={index}>{bold[1]}</strong> : part;
		})}
	</>
);

function DetailValue({ value }: { value: unknown }): ReactNode {
	if (Array.isArray(value)) return value.length === 0 ? "None" : value.map((item) => text(item) ?? JSON.stringify(item)).join(", ");
	if (isUrl(value)) {
		return (
			<InlineLink className="underline" highlight={false} href={value}>
				{value}
			</InlineLink>
		);
	}

	if (value === null || value === undefined) return "None";
	if (typeof value === "boolean") return value ? "Yes" : "No";
	if (typeof value === "object") return JSON.stringify(value);
	return <InlineMarkdown>{String(value)}</InlineMarkdown>;
}

const Field: FC<{ label: string; children: ReactNode }> = ({ label, children }) => (
	<span className="whitespace-pre-wrap break-words">
		<span className="font-bold">
			{label}
			:
		</span>
		{" "}
		{children}
	</span>
);

const BanSummary: FC<{ ban?: ModerationEvent; url?: string }> = ({ ban, url }) => {
	const tAttributes = useAttributeTranslation();
	const username = text(ban?.details.username);
	const reason = ban && ((ban.reasonId && tAttributes[ban.reasonId]?.name) || text(ban.details.reasonText));

	return (
		<span className="flex flex-wrap items-center gap-x-1">
			{ban
				? (
						<>
							{ban.userId
								? <UserName fallback={username} userId={ban.userId} />
								: <span className="italic">{username ?? "Deleted user"}</span>}
							{reason && <span>-</span>}
							<InlineLink
								className="flex flex-wrap gap-x-1 hover:underline"
								highlight={false}
								href={urls.moderation.queue({ tab: "logs", eventId: ban.id })}
							>
								{reason && <span>{reason}</span>}
								<span className="text-black-50 dark:text-white-50">
									(
									<DateTimeRelative options={{ dateStyle: "medium", timeStyle: undefined }} value={ban.createdAt} />
									)
								</span>
							</InlineLink>
						</>
					)
				: <span className="italic">Banned user (not found)</span>}
			{url && (
				<InlineLink highlight={false} href={url}>
					<DiscordIcon className="size-4" />
				</InlineLink>
			)}
		</span>
	);
};

// A { tag: score } map (tags camel-cased by the API client), or the Discord
// embed's text for backfilled events.
function classificationsText(value: unknown): string | undefined {
	if (typeof value === "string") return value.replaceAll("`", "");
	if (!value || typeof value !== "object") return;

	return Object.entries(value as Record<string, number>)
		.sort(([, a], [, b]) => b - a)
		.map(([tag, score]) => `${toSnakeCase(tag)} ${Number(score).toFixed(2)}`)
		.join(", ") || undefined;
}

// Events backfilled from Discord carry their text in different keys.
function eventSummary(event: ModerationEvent): string | undefined {
	const { details } = event;

	switch (event.type) {
		case "flagged_keyword":
			return details.context ? undefined : text(details.flags) ?? text(details.flagsText);
		case "flagged_bio":
			return text(details.reason) ?? text(details.flagsText);
		case "flagged_domain":
			return text(details.domain);
		case "flagged_duplicate": {
			const type = text(details.provider ?? details.type);
			return [type && capitalize(type), text(details.text)].filter(Boolean).join(": ") || undefined;
		}
		case "flagged_image":
			return text(details.classification) ?? text(details.categories);
		case "flagged_duplicate_image":
			return details.distance === undefined ? undefined : `Distance: ${details.distance}`;
		case "flagged_registered_underage":
			return `${text(details.previousBornAt) ?? "?"} → ${text(details.bornAt) ?? "?"}`;
		default:
			return undefined;
	}
}

function entryStatus(entry: ModerationEntry): string | undefined {
	if (entry.kind === "report") return entry.report.reviewedAt ? "cleared" : undefined;
	if (entry.event.reviewedAt) return "reviewed";
	if (entry.event.revokedAt) return "revoked";
}

function useEntry(entry: ModerationEntry) {
	const tAttributes = useAttributeTranslation();

	const type = entry.kind === "event" ? entry.event.type : "report";
	const details = entry.kind === "event" ? entry.event.details : {};
	const reasonId = entry.kind === "event" ? entry.event.reasonId : entry.report.reasonId;
	const status = entryStatus(entry);
	const { title, Icon, color } = entryTypes[type];

	return {
		Icon,
		title: type === "warned" && details.shadowbanned ? `${title} + shadowbanned` : title,
		color: type === "flagged_duplicate"
			? (details.type === "IP address"
					? yellow
					: certainDuplicateTypes.has(String(details.type)) || String(details.type).endsWith("(connection updated)")
						? red
						: gray)
			: type === "flagged_duplicate_image"
				? (details.distance === 0 ? red : yellow)
				: color,
		reasonName: (reasonId && (tAttributes[reasonId]?.name ?? reasonId)) || text(details.reasonText),
		summary: entry.kind === "event" ? eventSummary(entry.event) : undefined,
		subjectId: entry.kind === "event" ? entry.event.userId : entry.report.targetId,
		actorId: entry.kind === "event" ? entry.event.moderatorId : entry.report.userId,
		username: text(details.username),
		anonymous: entry.kind === "event" && entry.event.type === "exit_survey",
		message: entry.kind === "event" ? entry.event.message : entry.report.message,
		status,
		reviewable: !status
			&& (entry.kind === "report" || reviewableModerationEventTypes.includes(entry.event.type))
	};
}

type ReviewHandler = (entry: ModerationEntry) => Promise<unknown>;

const ReviewButton: FC<{ entry: ModerationEntry; onReview: ReviewHandler; className?: string }> = ({ entry, onReview, className }) => {
	const [reviewing, setReviewing] = useState(false);

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					className="h-fit disabled:opacity-50"
					disabled={reviewing}
					type="button"
					onClick={() => {
						setReviewing(true);
						void onReview(entry).finally(() => setReviewing(false));
					}}
				>
					<Check className={twMerge("size-4 text-green-600", className)} />
				</button>
			</TooltipTrigger>
			<TooltipContent>{entry.kind === "report" ? "Clear report" : "Mark reviewed"}</TooltipContent>
		</Tooltip>
	);
};

interface EntryImage {
	key: string;
	src: string;
	full: string;
	image?: ProfileImage;
	userId?: string;
}

function isImageKey(key: string): boolean {
	return !key.includes(".") || /\.(?:jpg|jpeg|png|gif|webm)$/i.test(key);
}

function entryImages(entry: ModerationEntry): Array<EntryImage> {
	if (entry.kind === "report") {
		return (entry.report.images ?? []).filter(isImageKey).map((key) => {
			const source = urls.media(key, "uploads");
			return { key, src: source, full: source };
		});
	}

	const { details, related } = entry.event;
	const imageId = text(details.imageId);
	const ids = [imageId, ...[details.matchImageIds].flat().map(text)].filter(Boolean) as Array<string>;

	const images = ids.flatMap((id): Array<EntryImage> => {
		const found = related?.images?.find(({ image }) => image.id === id);
		if (found) {
			return [{
				key: id,
				src: urls.image(found.image, "profile"),
				full: urls.image(found.image, "full"),
				image: found.image,
				userId: found.userId
			}];
		}

		return id === imageId && isUrl(details.imageUrl)
			? [{ key: id, src: details.imageUrl, full: details.imageUrl }]
			: [];
	});

	return images.length === 0 && isUrl(details.imageUrl)
		? [{ key: details.imageUrl, src: details.imageUrl, full: details.imageUrl }]
		: images;
}

// Opens like a profile's images, with the toolbar for those still on a profile.
const EntryImages: FC<{ images: Array<EntryImage>; small?: boolean }> = ({ images, small = false }) => {
	const [index, setIndex] = useState<number | null>(null);
	const session = useOptionalSession();
	const { t } = useTranslation();

	const current = index === null ? undefined : images[index];
	const step = (delta: number) =>
		setIndex((index) => index === null ? index : (index + delta + images.length) % images.length);

	return (
		<>
			<div className="flex flex-wrap gap-2">
				{images.map((image, imageIndex) => (
					<button key={image.key} className="w-fit" type="button" onClick={() => setIndex(imageIndex)}>
						<Image
							alt=""
							className={twMerge("w-auto rounded-md", small ? "max-h-32" : "max-h-64")}
							height={small ? 128 : 256}
							src={image.src}
							width={small ? 128 : 256}
						/>
					</button>
				))}
			</div>
			<Dialog open={!!current} onOpenChange={(open) => !open && setIndex(null)}>
				<DialogContent
					border={false}
					className="max-w-full overflow-hidden rounded-none outline-none desktop:max-w-[95svw] desktop:rounded-xl"
					onKeyDown={(event) => {
						if (event.key === "ArrowLeft") step(-1);
						if (event.key === "ArrowRight") step(1);
					}}
					onOpenAutoFocus={(event) => {
						event.preventDefault();
						(event.currentTarget as HTMLElement | null)?.focus();
					}}
				>
					<DialogTitle className="sr-only">{t("view_image")}</DialogTitle>
					{current && (
						<>
							<div className="relative max-h-[80vh] w-full bg-black-90">
								{images.length > 1 && (
									<div className="absolute z-10 flex size-full">
										<button
											className="group flex h-full w-1/4 items-center justify-start px-8 opacity-70 outline-none transition-opacity hover:opacity-100"
											type="button"
											onClick={() => step(-1)}
										>
											<ChevronLeft className="size-10 rounded-md text-white-10 drop-shadow group-focus-visible:ring-2 group-focus-visible:ring-white-10" />
										</button>
										<button
											className="group ml-auto flex h-full w-1/4 items-center justify-end px-8 opacity-70 outline-none transition-opacity hover:opacity-100"
											type="button"
											onClick={() => step(1)}
										>
											<ChevronRight className="size-10 rounded-md text-white-10 drop-shadow group-focus-visible:ring-2 group-focus-visible:ring-white-10" />
										</button>
									</div>
								)}
								<Image
									alt=""
									className="touch-callout-default relative mx-auto max-h-[80vh] w-auto object-contain"
									src={current.full}
								/>
							</div>
							{current.image && session?.user?.tags?.includes("moderator") && (
								<ImageToolbar
									image={current.image}
									userId={current.userId}
									onDeleted={() => invalidate({ queryKey: ["mod-queue"] })}
								/>
							)}
						</>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
};

const DomainActions: FC<{ domain: string }> = ({ domain }) => {
	const toasts = useToast();
	const [adding, setAdding] = useState(false);

	return (
		<div className="flex flex-wrap gap-2">
			<InlineLink
				className="flex h-8 items-center gap-2 rounded-xl bg-white-50 px-3 font-montserrat text-xs font-semibold text-black-80 shadow-brand-1"
				highlight={false}
				href={urls.moderation.checkDomain(domain)}
				rel="noreferrer"
				target="_blank"
			>
				Check domain
				<ExternalLink className="size-3.5" />
			</InlineLink>
			<Button
				Icon={Plus}
				kind="secondary"
				pending={adding}
				size="xs"
				onClick={async () => {
					setAdding(true);
					await Flag.create({ type: "email", flag: domain })
						.then(() => toasts.add("Added flag"))
						.catch(toasts.addError)
						.finally(() => setAdding(false));
				}}
			>
				Add flag
			</Button>
		</div>
	);
};

function useEntryBody(entry: ModerationEntry, compact: boolean): { content: Array<ReactNode>; fields: Array<ReactNode> } {
	const { reasonName, summary, actorId, message } = useEntry(entry);
	const tAttributes = useAttributeTranslation();
	const images = entryImages(entry);
	const content: Array<ReactNode> = [];
	const fields: Array<ReactNode> = [];

	const exitSurvey = entry.kind === "event" && entry.event.type === "exit_survey";

	if (summary) content.push(<span key="summary" className="break-words font-semibold"><InlineMarkdown>{summary}</InlineMarkdown></span>);
	if (message && !exitSurvey) content.push(<p key="message" className="select-text whitespace-pre-wrap break-words">{message}</p>);

	if (entry.kind === "report") {
		if (images.length > 0) content.push(<EntryImages key="images" images={images} small={compact} />);
		if (reasonName) fields.push(<Field key="reason" label="Reason">{reasonName}</Field>);
		if (entry.report.reviewedAt) {
			fields.push(
				<Field key="cleared" label="Cleared">
					<DateTimeRelative value={entry.report.reviewedAt} />
				</Field>
			);
		}
		fields.push(
			<InlineLink
				key="reports"
				className="underline"
				highlight={false}
				href={urls.moderation.queue({ tab: "reports", targetId: entry.report.targetId })}
			>
				View reports
			</InlineLink>
		);

		return { content, fields };
	}

	const { event } = entry;
	const { details, related } = event;
	const context = [details.context].flat().map(text).filter(Boolean) as Array<string>;
	const classifications = classificationsText(details.classifications);
	const domain = text(details.domain);
	const duplicateUserIds = [details.duplicateUserIds].flat().map(text).filter(Boolean) as Array<string>;
	const banUrls = [details.duplicateBanUrls].flat().filter(isUrl);
	const moderatorUsername = text(details.moderatorUsername);

	for (const [index, line] of context.entries()) {
		content.push(
			<p key={`context-${index}`} className="select-text whitespace-pre-wrap break-words">
				<InlineMarkdown>{line}</InlineMarkdown>
			</p>
		);
	}

	if (classifications) {
		content.push(
			<span key="classifications" className="break-words">
				{classifications}
			</span>
		);
	}

	if (images.length > 0) content.push(<EntryImages key="images" images={images} small={compact} />);

	if (event.type === "image_quarantined" && details.key) {
		content.push(
			<Field key="quarantined" label="Quarantined">
				{related?.quarantineUrl
					? (
							<InlineLink className="underline" highlight={false} href={related.quarantineUrl}>
								{String(details.key)}
							</InlineLink>
						)
					: String(details.key)}
			</Field>
		);
	}

	if (event.type === "flagged_domain" && domain) content.push(<DomainActions key="domain" domain={domain} />);

	if (reasonName) fields.push(<Field key="reason" label="Reason">{reasonName}</Field>);
	if (exitSurvey) fields.push(<Field key="comment" label="Comment">{message ?? "None"}</Field>);

	if (actorId) {
		fields.push(<Field key="moderator" label="Moderator"><UserName fallback={moderatorUsername} userId={actorId} /></Field>);
	}
	else if (moderatorUsername) {
		fields.push(<Field key="moderator" label="Moderator">{moderatorUsername}</Field>);
	}
	else if (event.automatic) {
		fields.push(<Field key="moderator" label="Moderator">Automatic</Field>);
	}

	if (duplicateUserIds.length > 0 || banUrls.length > 0) {
		fields.push(
			<Field key="duplicates" label={event.type === "flagged_duplicate_image" ? "Matching profiles" : "Duplicates"}>
				<span className="flex flex-col">
					{duplicateUserIds.map((userId) => {
						const ban = related?.duplicateBans?.find((ban) => ban.userId === userId);

						return ban
							? (
									<span key={userId} className="flex items-center gap-1">
										<Gavel className="size-3.5 shrink-0" />
										<BanSummary ban={ban} />
									</span>
								)
							: <UserName key={userId} userId={userId} />;
					})}
					{banUrls.map((url) => (
						<span key={url} className="flex items-center gap-1">
							<Gavel className="size-3.5 shrink-0" />
							<BanSummary url={url} />
						</span>
					))}
				</span>
			</Field>
		);
	}

	if (event.type === "unbanned" || event.type === "appealed") {
		fields.push(<Field key="ban" label="Ban"><BanSummary ban={related?.ban} /></Field>);
	}

	if (event.revokedAt) {
		fields.push(
			<Field key="revoked" label="Revoked">
				<DateTimeRelative value={event.revokedAt} />
				{event.revokedBy && (
					<>
						{" by "}
						<UserName userId={event.revokedBy} />
					</>
				)}
			</Field>
		);
	}

	if (event.acknowledgedAt) {
		fields.push(
			<Field key="acknowledged" label="Acknowledged">
				<DateTimeRelative value={event.acknowledgedAt} />
			</Field>
		);
	}

	if (event.reviewedAt) {
		fields.push(
			<Field key="reviewed" label="Reviewed">
				<DateTimeRelative value={event.reviewedAt} />
				{event.reviewedBy && (
					<>
						{" by "}
						<UserName userId={event.reviewedBy} />
					</>
				)}
			</Field>
		);
	}

	for (const [name, value] of Object.entries(details)) {
		if (hiddenDetails.has(name)) continue;

		const attributeLabel = attributeDetails[name];
		if (attributeLabel) {
			const names = [value].flat().map(text).filter(Boolean).map((id) => tAttributes[id!]?.name ?? id);
			fields.push(<Field key={name} label={attributeLabel}>{names.join(", ") || "None"}</Field>);
			continue;
		}

		fields.push(<Field key={name} label={humanize(name)}><DetailValue value={value} /></Field>);
	}

	return { content, fields };
}

export const ModerationEntryRow: FC<{
	entry: ModerationEntry;
	showUser?: boolean;
	onReview?: ReviewHandler;
}> = ({ entry, showUser = false, onReview }) => {
	const [expanded, setExpanded] = useState(false);
	const { title, Icon, color, summary, reasonName, message, subjectId, username, anonymous, status, reviewable } = useEntry(entry);

	const ExpandIcon = expanded ? ChevronDown : ChevronRight;
	const preview = summary ?? reasonName ?? message;
	showUser &&= !anonymous;

	return (
		<div className={twMerge("flex flex-col", status && "opacity-60")}>
			<div className="flex items-center gap-2">
				<button
					className="flex min-w-0 grow items-center gap-2 text-left text-sm hover:underline"
					type="button"
					onClick={() => setExpanded(!expanded)}
				>
					<ExpandIcon className="size-4 shrink-0" />
					<Icon className={twMerge("size-4 shrink-0", color.icon)} />
					<span className="shrink-0 font-bold">{title}</span>
					{showUser && (subjectId
						? <UserDisplayName fallback={username} userId={subjectId} />
						: username && <span className="max-w-40 shrink-0 truncate font-semibold italic">{username}</span>)}
					{status && <span className="shrink-0">{`(${status})`}</span>}
					{preview && <span className="min-w-0 truncate">{preview}</span>}
					<TimeRelative elementProps={{ className: "ml-auto shrink-0 opacity-75" }} value={entry.createdAt} />
				</button>
				{onReview && (
					<span className="flex size-4 shrink-0">
						{reviewable && <ReviewButton entry={entry} onReview={onReview} />}
					</span>
				)}
			</div>
			{expanded && <ModerationEntryDetails entry={entry} showUser={showUser} />}
		</div>
	);
};

const ModerationEntryDetails: FC<{ entry: ModerationEntry; showUser: boolean }> = ({ entry, showUser }) => {
	const { subjectId, actorId } = useEntry(entry);
	const { content, fields } = useEntryBody(entry, true);

	return (
		<div className="ml-[0.4375rem] flex flex-col gap-1 border-l-2 border-black-50/20 py-1 pl-4 text-sm dark:border-white-50/20">
			{showUser && (
				<Field label={entry.kind === "report" ? "Target" : "User"}>
					{subjectId ? <UserName userId={subjectId} /> : "None"}
				</Field>
			)}
			<Field label="Date">
				<CopyClick value={entry.createdAt}>
					<DateTimeRelative className="hover:underline" value={entry.createdAt} />
				</CopyClick>
			</Field>
			{entry.kind === "report" && (
				<Field label="Reporter">
					{actorId ? <UserName userId={actorId} /> : "Deleted user"}
				</Field>
			)}
			{content}
			{fields}
		</div>
	);
};

export const ModerationEntryCard: FC<{
	entry: ModerationEntry;
	onReview?: ReviewHandler;
}> = ({ entry, onReview }) => {
	const { title, Icon, color, subjectId, actorId, username, anonymous, status, reviewable } = useEntry(entry);
	const { content, fields } = useEntryBody(entry, false);

	return (
		<div
			className={twMerge(
				"flex flex-col gap-2 rounded-xl border-l-4 bg-white-30 p-4 dark:bg-black-80",
				color.border,
				status && "brightness-75"
			)}
		>
			<div className="flex justify-between gap-4">
				<div className="flex min-w-0 flex-col gap-1">
					<span
						suppressHydrationWarning
						className="text-xs text-black-50 first-letter:capitalize dark:text-white-50"
					>
						<TimeRelative value={entry.createdAt} />
						{" "}
						<DateTimeRelative value={entry.createdAt} />
					</span>
					<span className="flex items-center gap-2 text-lg font-semibold">
						<Icon className="size-5 shrink-0" />
						{title}
						{status && (
							<span className="text-sm font-normal text-black-50 dark:text-white-50">
								{`(${status})`}
							</span>
						)}
					</span>
					{!anonymous && <Subject fallback={username} userId={subjectId} />}
					{entry.kind === "report" && (
						<div className="flex items-baseline gap-1">
							Reporter:
							{actorId ? <UserName userId={actorId} /> : <span className="italic">Deleted user</span>}
						</div>
					)}
				</div>
				{onReview && reviewable && <ReviewButton className="size-5" entry={entry} onReview={onReview} />}
			</div>
			{content}
			{fields.length > 0 && <div className="flex flex-col text-sm">{fields}</div>}
		</div>
	);
};
