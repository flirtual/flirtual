export const targets = [
	"chrome106",
	"edge106",
	"firefox104",
	"safari15"
];

export const browserslist = targets.map((target) => target.replace(/(\d+)/, " >= $1"));
