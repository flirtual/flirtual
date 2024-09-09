import type { ProfileColors } from "~/api/user/profile";
import type { Theme } from "~/theme";

export const defaultProfileColors: Record<Theme, ProfileColors> = {
	light: {
		color_1: "#ff8975",
		color_2: "#e9658b"
	},
	dark: {
		color_1: "#b24592",
		color_2: "#e9658b"
	}
};

export const recommendedThemes: Array<
	{
		name: string;
	} & ProfileColors
> = [
	{
		name: "Peachy Petal",
		color_1: "#f9c58d",
		color_2: "#f492f0"
	},
	{
		name: "Minty Fresh",
		color_1: "#00ff87",
		color_2: "#60efff"
	},
	{
		name: "3D Movie",
		color_1: "#ff1b6b",
		color_2: "#45caff"
	},
	{
		name: "Rise and Shine",
		color_1: "#ffa585",
		color_2: "#ffeda0"
	},
	{
		name: "Pretty in Pink",
		color_1: "#ff00b4",
		color_2: "#ff9abe"
	},
	{
		name: "Aqua Depths",
		color_1: "#6ff7e8",
		color_2: "#1f7ea1"
	},
	{
		name: "Galactic Glow",
		color_1: "#fcb0f3",
		color_2: "#3d05dd"
	},
	{
		name: "Vaporwave",
		color_1: "#fc4ecb",
		color_2: "#2effcb"
	},
	{
		name: "Fox Fire",
		color_1: "#f46605",
		color_2: "#ffb45d"
	},
	{
		name: "Touch Grass",
		color_1: "#743d17",
		color_2: "#478f50"
	},
	{
		name: "Lemon Lime",
		color_1: "#fff82e",
		color_2: "#4dff3d"
	},
	{
		name: "Vampiric Vibe",
		color_1: "#d80000",
		color_2: "#650000"
	},
	{
		name: "Trick or Treat",
		color_1: "#ff8400",
		color_2: "#b337fc"
	},
	{
		name: "Serene Silver",
		color_1: "#ebf4f5",
		color_2: "#8694a9"
	},
	{
		name: "Dark as My Soul",
		color_1: "#000000",
		color_2: "#000000"
	}
];
