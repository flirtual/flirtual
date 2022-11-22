import { countries, languages } from "countries-list";

export type CountryCode = Lowercase<keyof typeof countries>;
export type LanguageCode = Lowercase<keyof typeof languages>;

export function getCountry(code: CountryCode) {
	return countries[code.toUpperCase() as keyof typeof countries];
}

export function getCountries() {
	return Object.entries(countries).map(([code, country]) => ({
		...country,
		code: code.toLowerCase()
	}));
}

export function getCountryImageUrl(code: CountryCode): string {
	return `https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/4.1.4/flags/4x3/${code}.svg`;
}

export function getLanguage(code: LanguageCode) {
	return languages[code];
}

export function getLanguages() {
	return Object.entries(languages).map(([code, language]) => ({ ...language, code }));
}
