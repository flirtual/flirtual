export const temporaryDirectory = process.env.TEMPORARY_DIRECTORY ?? "/tmp";
export const apiUrl = process.env.API_URL ?? "http://flirtual.internal:4000";
export const accessToken = process.env.ACCESS_TOKEN ?? "";
export const port = Number.parseInt(process.env.PORT ?? "8080");
export const batchSize = Number.parseInt(process.env.BATCH_SIZE ?? "25");
