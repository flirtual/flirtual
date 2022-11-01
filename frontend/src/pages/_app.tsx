import type { AppProps } from "next/app";

import "~/css/index.css";

export default function FlirtualApp({ Component, pageProps }: AppProps) {
	return <Component {...pageProps} />;
}

import "~/blinkloader";
import "~/freshworks";
