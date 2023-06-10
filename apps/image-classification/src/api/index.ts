import { apiUrl } from "../consts";

export const url = (pathname: string) => new URL(pathname, apiUrl);
