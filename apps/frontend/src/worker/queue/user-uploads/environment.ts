import { env } from "cloudflare:workers";
import invariant from "tiny-invariant";

export const {
	BUCKET_UPLOADS_ORIGIN: bucketUploadsOrigin,
	API_URL: apiUrl,
	IMAGE_ACCESS_TOKEN: imageAccessToken
} = env;

invariant(bucketUploadsOrigin, "BUCKET_UPLOADS_ORIGIN is not defined");
invariant(apiUrl, "API_URL is not defined");
invariant(imageAccessToken, "IMAGE_ACCESS_TOKEN is not defined");
