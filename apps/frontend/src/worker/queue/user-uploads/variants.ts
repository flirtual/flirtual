export const supportedTypes = [
	"image/gif",
	"image/heic",
	"image/heif",
	"image/jpeg",
	"image/png",
	"image/webp"
];

export const imageVariants = [
	{ name: "full", fit: "scale-down", width: 1920, height: 1920 },
	{ name: "profile", fit: "cover", width: 1008, height: 1008 },
	{ name: "thumb", fit: "cover", width: 160, height: 160 },
	{ name: "icon", fit: "cover", width: 64, height: 64 },
	{ name: "blur", fit: "cover", width: 64, height: 64, blur: 10 }
] as const;
