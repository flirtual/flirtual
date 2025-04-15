import { Montserrat, Nunito } from "next/font/google";
import { twMerge } from "tailwind-merge";

const montserrat = Montserrat({
	variable: "--font-montserrat",
	subsets: ["latin"]
});
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] });

export const fontClassNames = twMerge(montserrat.variable, nunito.variable);
