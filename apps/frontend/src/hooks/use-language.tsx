import { useEffect, useState } from "react";

export function useLanguage() {
	const [language, setLanguage] = useState<string | null>(null);

	useEffect(() => {
		setLanguage(navigator.language.split("-", 1)[0]);
	}, []);

	return language;
}
