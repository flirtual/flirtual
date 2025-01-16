import type { ProfileColors } from "~/api/user/profile";
import type { Theme } from "~/theme";

export const defaultProfileColors: Record<Theme, ProfileColors> = {
	light: {
		color1: "#ff8975",
		color2: "#e9658b"
	},
	dark: {
		color1: "#b24592",
		color2: "#e9658b"
	}
};

export const recommendedThemes: Array<
	{
		name: string;
		description?: string;
	} & ProfileColors
> = [
	{
		name: "Peachy Petal",
		color1: "#f9c58d",
		color2: "#f492f0"
	},
	{
		name: "Minty Fresh",
		color1: "#00ff87",
		color2: "#60efff"
	},
	{
		name: "3D Movie",
		color1: "#ff1b6b",
		color2: "#45caff"
	},
	{
		name: "Rise and Shine",
		color1: "#ffa585",
		color2: "#ffeda0"
	},
	{
		name: "Pretty in Pink",
		color1: "#ff00b4",
		color2: "#ff9abe"
	},
	{
		name: "Aqua Depths",
		color1: "#6ff7e8",
		color2: "#1f7ea1"
	},
	{
		name: "Galactic Glow",
		color1: "#fcb0f3",
		color2: "#3d05dd"
	},
	{
		name: "Vaporwave",
		color1: "#fc4ecb",
		color2: "#2effcb"
	},
	{
		name: "Fox Fire",
		color1: "#f46605",
		color2: "#ffb45d"
	},
	{
		name: "Touch Grass",
		color1: "#743d17",
		color2: "#478f50"
	},
	{
		name: "Lemon Lime",
		color1: "#fff82e",
		color2: "#4dff3d"
	},
	{
		name: "Vampiric Vibe",
		color1: "#d80000",
		color2: "#650000"
	},
	{
		name: "Trick or Treat",
		color1: "#ff8400",
		color2: "#b337fc"
	},
	{
		name: "Serene Silver",
		color1: "#ebf4f5",
		color2: "#8694a9"
	},
	{
		name: "Dark as My Soul",
		color1: "#000000",
		color2: "#000000"
	}
];
