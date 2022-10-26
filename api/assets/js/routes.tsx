import { createBrowserRouter } from "react-router-dom";
import React from "react";

import { RootIndexPage } from "./pages";
import { ErrorPage } from "./pages/error";
import { LoginPage } from "./pages/login";
import { RootLayout } from "./components/layout/root";
import { RegisterPage } from "./pages/register";
import { Onboarding1Page } from "./pages/onboarding/1-matchmaking";
import { Onboarding2Page } from "./pages/onboarding/2-personal";

export const router = createBrowserRouter([
	{
		path: "/",
		element: <RootLayout />,
		errorElement: <ErrorPage />,
		children: [
			{
				path: "",
				element: <RootIndexPage />
			},
			{
				path: "login",
				element: <LoginPage />
			},
			{
				path: "register",
				element: <RegisterPage />
			},
			{
				path: "onboarding",
				children: [
					{
						path: "1",
						element: <Onboarding1Page />
					},
					{
						path: "2",
						element: <Onboarding2Page />
					}
				]
			}
		]
	}
]);
