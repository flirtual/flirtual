"use client";

import { useRouter } from "~/i18n/navigation";
import type { FC } from "react";
import { twMerge } from "tailwind-merge";

import { urls } from "~/urls";

import type { IconComponentProps } from "./icons";

export const FlirtualLogo: FC<IconComponentProps> = ({ className, ...props }) => {
	const router = useRouter();

	const handleSecondaryClick = (event: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
		event.preventDefault();
		router.push(urls.resources.branding);
	};

	return (
		<svg
			{...props}
			className={twMerge("text-[snow]", className)}
			viewBox="0 0 1040.4352 300"
			xmlns="http://www.w3.org/2000/svg"
			xmlSpace="preserve"
			onContextMenu={handleSecondaryClick}
		>
			<defs>
				<linearGradient
					gradientTransform="translate(-19.2149 8.0305)"
					gradientUnits="userSpaceOnUse"
					id="b"
					x1="196.7217"
					x2="268.4562"
					xlinkHref="#a"
					y1="92.5157"
					y2="92.5157"
				/>
				<linearGradient
					gradientTransform="translate(76.0771 80.3102)"
					gradientUnits="userSpaceOnUse"
					id="d"
					x1="-74.7175"
					x2="-12.552"
					xlinkHref="#a"
					y1="62.5683"
					y2="62.5683"
				/>
				<linearGradient
					gradientTransform="translate(76.0771 80.3102)"
					gradientUnits="userSpaceOnUse"
					id="c"
					x1="-74.7175"
					x2="-12.552"
					xlinkHref="#a"
					y1="62.5683"
					y2="62.5683"
				/>
				<linearGradient id="a">
					<stop offset="0" stopColor="#fc9caa" />
					<stop offset="1" stopColor="#fb7d9b" />
				</linearGradient>
				<radialGradient
					cx="133.0941"
					cy="80.1321"
					fx="133.0941"
					fy="80.1321"
					gradientTransform="matrix(-.4121 .8079 -1.0236 -.5222 247.5047 48.9698)"
					gradientUnits="userSpaceOnUse"
					id="e"
					r="133.4293"
					xlinkHref="#a"
				/>
				<radialGradient
					cx="133.0941"
					cy="80.1321"
					fx="133.0941"
					fy="80.1321"
					gradientTransform="matrix(-.4121 .8079 -1.0236 -.5222 250.6226 47.2186)"
					gradientUnits="userSpaceOnUse"
					id="f"
					r="133.4293"
					xlinkHref="#a"
				/>
				<radialGradient
					cx="133.0941"
					cy="80.1321"
					fx="133.0941"
					fy="80.1321"
					gradientTransform="matrix(-.4121 .8079 -1.0236 -.5222 250.6226 47.219)"
					gradientUnits="userSpaceOnUse"
					id="g"
					r="133.4293"
					xlinkHref="#a"
				/>
			</defs>
			<g>
				<path
					aria-label="flirtual"
					d="m26.5741 117.2559-.762 4.9276h3.5052l-5.0292 31.6484h6.1976l5.0292-31.6484h6.096l.762-4.9276h-6.35l.3048-1.9304c.508-2.9972 2.5908-4.6228 5.5372-4.6228 1.2192 0 2.1336.2032 2.54.3048l.8128-5.2832c-.4064-.1016-1.6256-.3048-3.2004-.3048-6.2992 0-10.414 3.6576-11.3284 9.2964l-.4064 2.54zM44.151 135.747c-.9145 5.4865 1.9303 7.5693 5.9943 7.5693 2.0828 0 3.6576-.4064 4.2164-.6096l.8128-5.1816c-.4064.1524-1.4224.4064-2.4384.4064-1.8288 0-2.5908-.9652-2.1844-3.5052l4.4704-28.3464h-6.1976zm19.304-18.4911-4.0132 25.4h6.1976l4.0132-25.4zm.6096-6.7564c0 1.7272 1.1684 2.8956 3.0988 2.8956 2.3876 0 4.2164-1.6256 4.2164-4.0132 0-1.778-1.2192-2.9464-3.0988-2.9464-2.4384 0-4.2164 1.6256-4.2164 4.064zm9.4996 32.1564h6.1976l1.7272-10.922c.762-4.7752 4.4704-9.1948 8.8392-9.1948.8128 0 1.3208.2032 1.4732.2032l.9652-5.9944c-.1524-.0508-.8128-.1524-1.5748-.1524-3.5052 0-6.5024 2.3368-8.5852 5.4356v-.3556c0-.9652.5588-3.4036.6604-4.4196h-5.6896zm21.9456-25.4-.762 4.9276h3.8608l-1.778 11.2268c-.1524.8636-.254 1.7272-.3556 2.54-.5588 5.4864 2.9972 7.366 6.858 7.366 2.7432 0 5.0292-.5588 6.2992-1.1684l.8128-5.1816c-1.3716.5588-3.2004 1.0668-4.7752 1.0668-1.8796 0-3.302-1.0668-2.794-4.2164l1.8288-11.6332h7.2136l.762-4.9276h-7.2136l1.2192-7.62h-5.9944l-1.2192 7.62zm41.656 25.4 4.0132-25.4h-6.1468l-1.9812 12.5984c-.7112 4.4704-4.1656 7.8232-8.2804 7.8232-3.4544 0-3.7084-2.5908-3.2512-5.588l2.3368-14.8336h-6.1976l-2.4892 15.9004c-1.0668 6.5532 1.1684 10.16 7.112 10.16 4.7244 0 8.5852-3.4036 9.9568-5.7404h.1016c-.1016.2032-.3556.8636-.508 1.8796l-.3556 3.2004zm22.3012-20.7772c2.9972 0 5.842 2.1844 5.842 6.6548 0 6.35-4.572 9.4996-8.4328 9.4996-3.556 0-5.7912-2.7432-5.7912-6.6548 0-5.4356 3.7084-9.4996 8.382-9.4996zm14.0716-4.6228h-5.6896l-.4572 2.3876c-.254 1.0668-.2032 1.778-.2032 1.778h-.1016c-.8128-2.54-4.0132-4.826-7.9248-4.826-7.4168 0-14.0716 6.2484-14.0716 15.5956 0 6.7564 4.064 11.1252 9.8552 11.1252 4.0132 0 7.8232-2.3876 9.4996-5.08h.1016s-.254.7112-.4064 1.778l-.3048 2.6416h5.6896zm4.9276 18.4911c-.9144 5.4865 1.9304 7.5693 5.9944 7.5693 2.0828 0 3.6576-.4064 4.2164-.6096l.8128-5.1816c-.4064.1524-1.4224.4064-2.4384.4064-1.8288 0-2.5908-.9652-2.1844-3.5052l4.4704-28.3464h-6.1976z"
					fill="currentColor"
					fontFamily="Brother 1816"
					fontSize="50.8"
					fontStyle="italic"
					fontWeight="500"
					transform="translate(252.9847 -328.9464) scale(3.7795)"
				/>
			</g>
			<path
				d="M179.5068 93.4297c0-1.4233 11.3026-11.8966 18.7613-17.3847 8.4332-6.2051 22.4395-14.1157 24.993-14.1157 5.63 0 19.1644 37.2395 22.6224 62.2448.9086 6.57 1.495 12.4165 1.303 12.9922-15.778-18.5335-32.1967-36.6936-67.6797-43.7366z"
				fill="url(#b)"
				stroke="#fff"
				strokeWidth="4"
				transform="matrix(.913 0 0 .913 53.9584 9.1932)"
			/>
			<path
				d="M234.8171 98.7176c-.8371-.7537 7.2217-9.3485 12.1337-12.9644 5.1116-3.763 5.5178-3.9046 7.0985-2.474 3.114 2.8181 10.5833 28.4957 11.1857 35.3682-2.9925-.3353-22.0605-15.4683-30.4179-19.9298z"
				fill="none"
				stroke="#fff"
				strokeWidth="2.4926"
			/>
			<path
				d="M15.4107 171.5507C7.796 159.0572 3.36 130.644 3.36 117.3087c0-10.229.7118-11.2583 7.7852-11.2568 12.2254.003 46.1327 5.476 50.4125 7.8115-16.8808 16.6358-31.8176 36.5583-42.5741 63.5491z"
				fill="url(#c)"
				stroke="#fff"
				strokeWidth="4"
				transform="matrix(.913 0 0 .913 53.9584 9.1932)"
			/>
			<path
				d="M22.8084 151.9765c-2.1033-4.9744-5.2027-19.9823-5.2027-24.8118 0-2.6442.5592-3.9502 2.0278-4.7362 2.464-1.3187 28.5526 2.7544 29.808 4.0159-5.6298 7.4032-15.566 21.8316-23.8942 32.0095z"
				fill="url(#d)"
				stroke="#fff"
				strokeWidth="2.7301"
				transform="matrix(.913 0 0 .913 53.9584 9.1932)"
			/>
			<path
				d="M253.384 150.2564c-1.7503.034 1.0668 7.3383 1.0668 14.1199 0 3.7863-.7047 8.755-1.5915 11.7423-1.7965 6.0514-9.148 18.5484-10.7264 19.5239-.5623.3475-1.1093-.0758-1.1093.9917 0 2.679 7.2303 5.3173 10.6868 1.5876 3.0321-3.2717 8.7116-18.4116 10.8254-27.9932 1.3934-6.3162-.0111-10.0886-.9844-12.4383-1.0062-2.4293-6.3676-7.5687-8.1673-7.5339z"
				fill="url(#e)"
				stroke="#fff"
				strokeWidth="4"
				transform="matrix(.913 0 0 .913 53.9584 9.1932)"
			/>
			<path
				d="M43.433 234.5715c-11.1922-7.7751-19.1973-21.0723-23.6294-38.2171-3.146-12.1697-1.8467-21.1593 5.1405-35.5664 1.1987-2.4717 2.3987-4.8186 3.6176-7.0634 4.9607-9.1358 10.2354-16.5811 17.0167-23.8646 3.8825-4.17 8.2588-8.287 13.3527-12.6377 29.6092-25.2897 65.2025-35.9693 100.694-30.213 19.0444 3.0889 43.229 11.5984 58.5346 21.9821 8.7042 5.9052 20.0578 16.693 26.5877 24.8547 7.1868 8.9827 9.2563 15.006 9.2563 26.9407 0 11.0085-1.868 18.9816-6.381 27.2351-4.4864 8.2048-8.0942 10.499-16.5169 10.5034-8.6839.004-27.0034 1.6462-40.102 3.5938-21.0181 3.125-60.0331 12.3814-78 18.5057-39.8202 13.5733-43.9887 14.7287-55.6279 15.419-9.3807.5564-11.2152-.069-13.9429-1.4723z"
				fill="url(#f)"
				stroke="#fff"
				strokeWidth="4"
				transform="matrix(.913 0 0 .913 53.9584 9.1932)"
			/>
			<path
				d="M18.4387 190.5501c-.4208 0-5.0213 10.2497-7.419 16.7122-7.2334 19.4963-6.0817 24.9365 7.371 34.8398 3.8475 2.8323 7.032 4.4102 8.9024 4.4102 2.9384 0 6.6153-1.8624 11.1406-4.1387 7.3132-3.6787 9.4942-6.0454 7.5139-6.3613-12.5214-1.9973-22.7914-21.0775-26.8146-33.5899-1.2223-3.801-.2734-11.8723-.6943-11.8723z"
				fill="url(#g)"
				stroke="#fff"
				strokeWidth="4"
				transform="matrix(.913 0 0 .913 53.9584 9.1932)"
			/>
			<path
				d="M180.1792 165.3844c-3.015 2.9515-8.9646 5.5828-12.9005 5.202l-1.286 4.9796-.0135.049c-.0654.219-5.595 19.1817 2.4987 24.5083 6.916 4.1688 16.2566-5.8546 19.9288-13.1854 3.1834-6.4755 4.243-13.3133 3.6095-19.1817 0 0-2.194.8112-4.7548.4272-1.8608-.279-4.6784-1.2596-7.0822-2.799z"
				fill="#fff"
			/>
			<path
				d="M170.3004 197.1046c-6.1557-4.0512-1.862-18.5879-1.876-18.5373 6.1697 1.2932 12.4286 4.8522 16.0616 9.441-2.0096 3.8167-8.965 12.2431-14.1856 9.0963z"
				fill="#ed5073"
			/>
			<path
				d="M165.7971 162.4299s-3.3759 4.6506 1.1067 7.555c2.373 1.5376 7.8785.7488 12.918-4.0754 4.3014 3.1284 8.4382 3.8022 12.2922 1.398 5.911-3.6872 1.8997-8.4298 1.8997-8.4298"
				fill="none"
				stroke="#fff"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="3.7967"
			/>
			<path
				d="m168.9711 176.0623.9924-3.8392c3.0055.2908 7.5487-1.719 9.8509-3.9727 1.8355 1.1755 3.9872 1.9255 5.4081 2.1386 1.9554.2932 3.6301-.3264 3.6301-.3264.4837 4.4812-.3243 9.7028-3.1438 15.7179-4.7635-5.0648-9.1018-7.703-16.7377-9.7182z"
				fill="#db647e"
			/>
			<g fill="#fff">
				<path d="M125.4276 174.3817c3.612-.891 7.9742-2.1846 16.0594-2.352 12.1615-.0456 15.0014.2028 14.4423-7.5315 0 0-.6595-7.2402-4.5334-3.7954-8.5618-.4301-16.7427-.7453-24.8026 1.1937-8.4263 2.0271-12.8422 3.7462-13.6894 5.3294-1.0615 2.0844.5461 5.1752.5461 5.1752s1.9145 3.9785 3.5111 3.9486c3.1341-.4324 5.9417-1.3452 8.4665-1.968z" />
				<path d="M123.9418 158.9042c3.7104 1.248 8.6051 2.1097 14.8078 5.469 11.2158 6.2353 13.4985 7.7997 16.7928.7798 0 0 .8015-4.041-2.4385-6.6614-3.6298-3.088-9.5738-7.979-20.1779-10.8605-8.6814-2.012-14.7345-2.105-16.2477-1.1384-1.9452 1.2992-2.047 4.6879-2.047 4.6879s-.283 4.5 1.1244 5.2547c2.9452 1.1555 5.7283 1.6194 8.186 2.469z" />
			</g>
			<path
				d="M225.068 156.0604c-.2279-2.6468-.9766-9.1705-1.3484-14.5328-.865-12.4752-2.0597-17.1299-5.0577-19.7066-4.658-4.0036-10.8239-1.65-13.2523 4.5368-2.816 7.174.5541 41.1541 11.4653 40.1579 8.0257-.7328 8.8007-3.3993 8.1931-10.4553z"
				fill="#fff"
			/>
		</svg>
	);
};
