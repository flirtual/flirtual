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

export const recommendedThemes = [
	{
		name: "peachy_petal",
		color1: "#f9c58d",
		color2: "#f492f0"
	},
	{
		name: "minty_fresh",
		color1: "#00ff87",
		color2: "#60efff"
	},
	{
		name: "3d_movie",
		color1: "#ff1b6b",
		color2: "#45caff"
	},
	{
		name: "rise_and_shine",
		color1: "#ffa585",
		color2: "#ffeda0"
	},
	{
		name: "pretty_in_pink",
		color1: "#ff00b4",
		color2: "#ff9abe"
	},
	{
		name: "aqua_depths",
		color1: "#6ff7e8",
		color2: "#1f7ea1"
	},
	{
		name: "galactic_glow",
		color1: "#fcb0f3",
		color2: "#3d05dd"
	},
	{
		name: "vaporwave",
		color1: "#fc4ecb",
		color2: "#2effcb"
	},
	{
		name: "fox_fire",
		color1: "#f46605",
		color2: "#ffb45d"
	},
	{
		name: "touch_grass",
		color1: "#743d17",
		color2: "#478f50"
	},
	{
		name: "lemon_lime",
		color1: "#fff82e",
		color2: "#4dff3d"
	},
	{
		name: "vampiric_vibe",
		color1: "#d80000",
		color2: "#650000"
	},
	{
		name: "trick_or_treat",
		color1: "#ff8400",
		color2: "#b337fc"
	},
	{
		name: "serene_silver",
		color1: "#ebf4f5",
		color2: "#8694a9"
	},
	{
		name: "dark_as_my_soul",
		color1: "#000000",
		color2: "#000000"
	}
] as const satisfies Array<
	{
		name: string;
		description?: string;
	} & ProfileColors
>;
