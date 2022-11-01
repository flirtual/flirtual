import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
	return (
		<Html>
			<Head>
				<title>Flirtual</title>
				<meta
					content="Meet new people in Virtual Reality! Flirtual helps you go on dates in VR and VRChat. Formerly VRLFP."
					name="description"
				/>
				<link href="/images/apple-touch-icon.png" rel="apple-touch-icon" sizes="180x180" />
				<link href="/images/favicon-32x32.png" rel="icon" sizes="32x32" type="image/png" />
				<link href="/images/favicon-16x16.png" rel="icon" sizes="16x16" type="image/png" />
				<link href="/site.webmanifest" rel="manifest" />
				<link color="#e9658b" href="/images/safari-pinned-tab.svg" rel="mask-icon" />
				<link href="/favicon.ico" rel="shortcut icon" />
				<meta content="Flirtual" name="apple-mobile-web-app-title" />
				<meta content="Flirtual" name="application-name" />
				<meta content="#e9658b" name="msapplication-TileColor" />
				<meta content="#e9658b" name="theme-color" />
				<meta content="text/html; charset=utf-8" httpEquiv="content-type" />
				<meta
					content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1"
					name="viewport"
				/>
				<meta content="@getflirtual" name="twitter:site" />
				<meta content="website" property="og:type" />
				<meta content="Flirtual" property="og:title" />
				<meta
					content="The first and largest VR dating app. Join thousands for dates in VR apps like VRChat."
					property="og:description"
				/>
				<meta content="https://flirtu.al/images/android-chrome-512x512.png" property="og:image" />
				<meta content="512" property="og:image:width" />
				<meta content="512" property="og:image:width" />
				<meta content="summary" name="twitter:card" />
				<link href="https://fonts.googleapis.com" rel="preconnect" />
				<link href="https://fonts.gstatic.com" rel="preconnect" />
				<link
					href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Nunito:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;0,1000;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900;1,1000&display=swap"
					rel="stylesheet"
				/>
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
