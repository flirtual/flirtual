/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";

import { filterBy, findBy } from "~/utilities";
import { User } from "~/api/user";

import type { Attribute } from "~/api/attributes";

const boxShadow =
	"0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 3px 1px -2px rgba(0, 0, 0, 0.12), 0 1px 5px 0 rgba(0, 0, 0, 0.2)";

interface PillProps {
	name: string;
	active?: boolean;
}

export interface ProfileOpenGraphImageContext {
	params: {
		username: string;
	};
}

// Blocked by: https://github.com/vercel/next.js/issues/48081
// const Montserrat = await fs.readFile("./public/fonts/montserrat.ttf");

export async function GET(
	request: Request,
	{ params }: ProfileOpenGraphImageContext
) {
	const user = await User.preview(params.username);

	const country = findBy(user.attributes, "type", "country") as
		| Attribute<"country">
		| undefined;

	const brandGradient = user.dark
		? "linear-gradient(to right, #b24592, #e9658b)"
		: "linear-gradient(to right, #ff8975, #e9658b)";

	const Pill: React.FC<PillProps> = ({ name, active = false }) => (
		<div
			tw="flex py-2 px-4 rounded-3xl text-white"
			style={
				active
					? { backgroundImage: brandGradient, boxShadow }
					: {
							boxShadow,
							backgroundColor: user.dark ? "#1e1e1e" : "#EBEBEB",
							color: user.dark ? "#F5F5F5" : "#1e1e1e"
						}
			}
		>
			<span tw="text-2xl font-semibold">{name}</span>
		</div>
	);

	return new ImageResponse(
		(
			<div
				tw="flex flex-col w-full h-full"
				style={{
					fontFamily: "Nunito",
					backgroundColor: user.dark ? "#111111" : "#FFFAF0"
				}}
			>
				<div
					style={{ backgroundImage: brandGradient, boxShadow }}
					tw="absolute bottom-0 left-0 flex h-3 w-full"
				/>
				<div tw="flex p-16 w-full h-full relative">
					<img
						style={{ height: 80, width: 277.44 }}
						tw="absolute right-0 bottom-0 mb-16 mr-16"
						src={
							user.dark
								? "https://flirtu.al/images/brand/white.svg"
								: "https://flirtu.al/images/brand/black.svg"
						}
					/>
					<div
						className="h-20"
						style={{ gap: "4rem" }}
						tw="flex w-full h-full items-center overflow-hidden"
					>
						<div
							style={{ backgroundImage: brandGradient, boxShadow }}
							tw="flex p-2 rounded-3xl"
						>
							<img
								src={user.avatarUrl}
								style={{ objectFit: "cover", height: 384, width: 384 }}
								tw="rounded-3xl"
							/>
						</div>
						<div style={{ gap: "2rem", width: 600 }} tw="flex flex-col">
							<div
								tw="flex items-baseline"
								style={{
									gap: "1rem",
									color: user.dark ? "#F5F5F5" : "#1e1e1e"
								}}
							>
								<span
									style={{ fontFamily: "Montserrat" }}
									tw="text-6xl font-bold"
								>
									{user.name}
								</span>
								<span tw="text-4xl">{user.age}</span>
							</div>
							<div
								style={{ gap: "0.5rem" }}
								tw="flex flex-wrap w-full max-w-full"
							>
								{filterBy(user.attributes, "type", "gender").map(
									(attribute) => (
										<Pill active key={attribute.id} name={attribute.name} />
									)
								)}
								{country && <Pill active name={country.name} />}
								{filterBy(user.attributes, "type", "sexuality").map(
									(attribute) => (
										<Pill key={attribute.id} name={attribute.name} />
									)
								)}
								{filterBy(user.attributes, "type", "interest").map(
									(attribute) => (
										<Pill key={attribute.id} name={attribute.name} />
									)
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		),
		{
			debug: false,
			emoji: "twemoji"
		}
	);
}
