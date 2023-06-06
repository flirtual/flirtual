/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unknown-property */

import { ImageResponse } from "next/server";

import { ProfilePageProps } from "./page";
import { getProfileUser } from "./profile-user";

import { urls } from "~/urls";
import { displayName } from "~/api/user";
import { withAttribute } from "~/api/attributes-server";
import { filterBy } from "~/utilities";
import { yearsAgo } from "~/date";
import { AttributeCollection } from "~/api/attributes";

export const alt = "Flirtual";
export const contentType = "image/svg+xml";

const brandGradient = "linear-gradient(to right, #ff8975, #e9658b)";
const boxShadow =
	"0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 3px 1px -2px rgba(0, 0, 0, 0.12), 0 1px 5px 0 rgba(0, 0, 0, 0.2)";

const Pill: React.FC<{ name: string }> = ({ name }) => (
	<div
		style={{ backgroundImage: brandGradient, boxShadow }}
		tw="flex py-2 px-4 rounded-3xl text-white"
	>
		<span tw="text-2xl font-semibold">{name}</span>
	</div>
);

export default async function og({ params }: ProfilePageProps) {
	const user = await getProfileUser(params.username);

	const attributes = await Promise.all(
		user.profile.attributes.map((attribute) => withAttribute(attribute.type, attribute.id))
	);

	return new ImageResponse(
		(
			<div style={{ fontFamily: "Nunito" }} tw="flex flex-col w-full h-full bg-[#FFFAF0]">
				<div
					style={{ backgroundImage: brandGradient, boxShadow }}
					tw="absolute bottom-0 left-0 flex h-3 w-full"
				/>
				<div tw="flex p-16 w-full h-full relative">
					<img
						src="https://flirtu.al/images/brand/black.svg"
						tw="absolute right-0 bottom-0 h-16 mb-16 mr-16"
					/>
					<div style={{ gap: "4rem" }} tw="flex w-full h-full items-center overflow-hidden">
						<div style={{ backgroundImage: brandGradient, boxShadow }} tw="flex p-2 rounded-3xl">
							<img
								src={urls.userAvatar(user)}
								style={{ objectFit: "cover", height: 384, width: 384 }}
								tw="rounded-3xl"
							/>
						</div>
						<div style={{ gap: "2rem", width: 600 }} tw="flex flex-col">
							<div style={{ gap: "1rem" }} tw="flex items-baseline">
								<span style={{ fontFamily: "Montserrat" }} tw="text-6xl font-bold">
									{displayName(user)}
								</span>
								{user.bornAt && <span tw="text-4xl">{yearsAgo(new Date(user.bornAt))}</span>}
							</div>
							<div style={{ gap: "0.5rem" }} tw="flex flex-wrap w-full max-w-full">
								{(
									filterBy(attributes, "type", "gender") as unknown as AttributeCollection<"gender">
								)
									.filter((gender) => gender?.metadata?.simple)
									.map((attribute) => (
										<Pill key={attribute.id} name={attribute.name} />
									))}
								{filterBy(attributes, "type", "sexuality").map((attribute) => (
									<Pill key={attribute.id} name={attribute.name} />
								))}
								{filterBy(attributes, "type", "interest").map((attribute) => (
									<Pill key={attribute.id} name={attribute.name} />
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		)
	);
}
