import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import { router } from "./routes";

import "./phoenix";

const element = document.getElementById("app");
if (!element) throw new ReferenceError("Couldn't find root element");

createRoot(element).render(
	<React.StrictMode>
		<RouterProvider router={router} />
	</React.StrictMode>
);

import "./blinkloader";
import "./freshworks";
