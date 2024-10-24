"use client";

import { useState } from "react";

import { InputEditor } from "~/components/inputs";

export default function EmptyPage() {
	const [value, setValue] = useState("");
	return <InputEditor value={value} onChange={setValue} />;
}
