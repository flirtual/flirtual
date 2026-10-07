import process from "node:process";

export const temporaryDirectory = process.env.TEMPORARY_DIRECTORY ?? "/tmp";
export const accessToken = process.env.ACCESS_TOKEN ?? "";
export const port = Number.parseInt(process.env.PORT ?? "8080");
