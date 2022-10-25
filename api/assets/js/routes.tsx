import { createBrowserRouter } from "react-router-dom";
import React from "react";

import { RootIndexPage } from "./pages";
import { ErrorPage } from "./pages/error";
import { LoginPage } from "./pages/login";
import { RootLayout } from "./components/layout/root";
import { RegisterPage } from "./pages/register";

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
			}
		]
	}
]);
