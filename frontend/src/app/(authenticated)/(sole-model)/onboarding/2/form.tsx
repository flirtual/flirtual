"use client";

import { useRouter } from "next/navigation";

import { api } from "~/api";
import { Form } from "~/components/forms";
import { FormPrivacySelect } from "~/components/forms/form-privacy-select";
import {
	InputAutocomplete,
	InputDateSelect,
	InputLabel,
	InputSelect,
	InputSwitch
} from "~/components/inputs";
import { InputCheckboxList } from "~/components/inputs/checkbox-list";
import { CountryCode, getCountries, getLanguages, LanguageCode } from "~/countries";
import { useCurrentUser } from "~/hooks/use-current-user";
import { urls } from "~/pageUrls";
import { pick } from "~/utilities";

export const Onboarding2Form: React.FC = () => {
	const { data: user } = useCurrentUser();
	const router = useRouter();

	if (!user) return null;

	return (
		<Form
			className="flex flex-col gap-8"
			fields={{
				bornAt: user.bornAt ? new Date(user.bornAt) : new Date(),
				gender: user.profile.gender ?? [],
				sexuality: user.profile.sexuality ?? [],
				sexualityPrivacy: user.preferences.privacy.sexuality ?? "everyone",
				country: (user.profile.country ?? "") as CountryCode | "",
				countryPrivacy: user.preferences.privacy.country ?? "everyone",
				languages: user.profile.languages ?? [],
				platforms: user.profile.platforms ?? [],
				new: false,
				games: user.profile.games ?? [],
				interests: user.profile.interests ?? []
			}}
			onSubmit={async (values) => {
				await Promise.all([
					api.user.update(user.id, { bornAt: values.bornAt.toISOString() }),
					api.user.preferences.updatePrivacy(user.id, {
						sexuality: values.sexualityPrivacy,
						country: values.countryPrivacy
					}),
					api.user.profile.update(user.id, {
						...pick(values, [
							"gender",
							"sexuality",
							"games",
							"languages",
							"platforms",
							"interests"
						]),
						country: values.country || undefined
					})
				]);

				router.push(urls.onboarding(3));
			}}
		>
			{({ FormField }) => (
				<>
					<FormField name="bornAt">
						{(field) => (
							<>
								<InputLabel
									{...field.labelProps}
									className="flex-col sm:flex-row"
									hint="(only your age will be visible)"
								>
									Date of birth
								</InputLabel>
								<InputDateSelect {...field.props} />
							</>
						)}
					</FormField>
					<FormField name="gender">
						{(field) => (
							<>
								<InputLabel {...field.labelProps}>Gender</InputLabel>
								<InputCheckboxList
									{...field.props}
									items={{
										man: {
											label: "Man",
											conflicts: ["woman"]
										},
										woman: {
											label: "Woman",
											conflicts: ["man"]
										},
										other: {
											label: "Other"
										}
									}}
								/>
							</>
						)}
					</FormField>
					<FormField name="sexuality">
						{(field) => (
							<>
								<InputLabel>Sexuality</InputLabel>
								<InputAutocomplete
									{...field.props}
									limit={3}
									placeholder="Select your sexualities..."
									options={[
										"Straight",
										"Lesbian",
										"Gay",
										"Bisexual",
										"Pansexual",
										"Asexual",
										"Demisexual",
										"Heteroflexible",
										"Homoflexible",
										"Queer",
										"Questioning",
										"Experimenting in VR"
									].map((label) => ({ label, key: label.toLowerCase().replace(" ", "_") }))}
								/>
							</>
						)}
					</FormField>
					<FormField name="sexualityPrivacy">
						{(field) => (
							<>
								<InputLabel inline hint="Who can see your sexuality?">
									Sexuality privacy
								</InputLabel>
								<FormPrivacySelect {...field.props} />
							</>
						)}
					</FormField>
					<FormField name="country">
						{(field) => (
							<>
								<InputLabel>Country</InputLabel>
								<InputSelect
									{...field.props}
									options={getCountries()
										.map(({ code, name }) => ({
											key: code as CountryCode,
											label: name
										}))
										.sort((a, b) => {
											if (a.label > b.label) return 1;
											return -1;
										})}
								/>
							</>
						)}
					</FormField>
					<FormField name="countryPrivacy">
						{(field) => (
							<>
								<InputLabel inline hint="Who can see your country?">
									Country privacy
								</InputLabel>
								<FormPrivacySelect {...field.props} />
							</>
						)}
					</FormField>
					<FormField name="languages">
						{(field) => (
							<>
								<InputLabel>Language</InputLabel>
								<InputAutocomplete
									{...field.props}
									limit={3}
									options={getLanguages()
										.map(({ code, name }) => ({
											key: code as LanguageCode,
											label: name
										}))
										.sort((a, b) => {
											if (a.label > b.label) return 1;
											return -1;
										})}
								/>
							</>
						)}
					</FormField>
					<FormField name="platforms">
						{(field) => (
							<>
								<InputLabel>VR setup</InputLabel>
								<InputAutocomplete
									{...field.props}
									limit={8}
									placeholder="Select the platforms you use..."
									options={[
										"Meta Quest",
										"Oculus Link",
										"Oculus Rift",
										"SteamVR",
										"Windows Mixed Reality",
										"Pico",
										"PlayStation VR",
										"Mobile VR",
										"Other VR",
										"Desktop",
										"Full-bodytracking",
										"Haptic suit",
										"Eye/facial tracking",
										"Locomotion Treadmill"
									].map((label) => ({ label, key: label.toLowerCase().replace(" ", "_") }))}
								/>
							</>
						)}
					</FormField>
					<FormField name="games">
						{(field) => (
							<>
								<InputLabel>Favorite social VR games</InputLabel>
								<InputAutocomplete
									{...field.props}
									limit={5}
									placeholder="Select your favorite games..."
									options={[
										"A Township Tale",
										"After the Fall",
										"Alcove",
										"AltspaceVR",
										"Alvo",
										"Anyland",
										"Arizona Sunshine",
										"Assetto Corsa",
										"Automobilista 2",
										"BRINK Traveler",
										"BattleGroupVR",
										"Battlezone Gold Edition",
										"Beat Saber",
										"Bigscreen",
										"Blaston",
										"Brass Tactics",
										"Cards & Tankards",
										"Carrier Command 2",
										"Catan VR",
										"Chess Club",
										"ChilloutVR",
										"Clash of Chefs VR",
										"Climbey",
										"Contractors",
										"Cook-Out",
										"Creed: Rise to Glory",
										"DCS World",
										"DEVOUR",
										"Dance Central",
										"Dash Dash World",
										"Dead and Buried 2",
										"Death Horizon: Reloaded",
										"Death Lap",
										"Demeo",
										"DiRT Rally",
										"DiRT Rally 2.0",
										"Drop Dead: Dual Strike Edition",
										"Drunkn Bar Fight",
										"Eagle Flight",
										"Echo VR",
										"Electronauts - VR Music",
										"Eleven Table Tennis",
										"Elite Dangerous",
										"Elven Assassin",
										"Epic Roller Coasters",
										"FOREWARNED",
										"Farpoint",
										"Firewall Zero Hour",
										"First Person Tennis",
										"FitXR",
										"ForeVR Bowl",
										"ForeVR Darts",
										"From Other Suns",
										"GOLF+",
										"Golf 5 eClub",
										"Gorilla Tag",
										"Gun Raiders",
										"Half + Half",
										"Helios",
										"Holofit",
										"Horizon Venues",
										"Horizon Worlds",
										"Hyper Dash",
										"IL-2 Sturmovik: Battle of Stalingrad",
										"Immersed",
										"Inside the Backrooms",
										"IronWolf VR",
										"Ironlights",
										"Killing Floor: Incursion",
										"Kingspray Graffiti VR",
										"Landfall",
										"Larcenauts",
										"Lavender",
										"Legendary Tales",
										"Minecraft VR",
										"Mini Motor Racing X",
										"Mozilla Hubs",
										"Multiverse",
										"Museum of Other Realities",
										"Nature Treks: Together",
										"Neos VR",
										"Neverboard",
										"Nock",
										"Onward",
										"OrbusVR: Reborn",
										"PAYDAY 2",
										"POPULATION: ONE",
										"PULSAR: Lost Colony",
										"Path of the Warrior",
										"Pavlov VR",
										"Phasmophobia",
										"PokerStars VR",
										"Poker VR",
										"Premium Bowling",
										"Project CARS 2",
										"Puppet Fever",
										"RIGS Mechanized Combat League",
										"RUSH",
										"Raccoon Lagoon",
										"Racket: Nx",
										"Racket Fury",
										"Ragnarock",
										"Real VR Fishing",
										"Rec Room",
										"Rock Life: The Rock Simulator",
										"SCP: Labrat",
										"SOLARIS OFFWORLD COMBAT",
										"STAND OUT: VR Battle Royale",
										"STAR WARS: Squadrons",
										"STRIDE",
										"Sairento VR: Untethered",
										"SculptrVR",
										"Skyworld: Kingdom Brawl",
										"Smash Drums",
										"Spaceteam VR",
										"Spatial",
										"Sports Scramble",
										"Star Trek: Bridge Crew",
										"Statik",
										"Stormland VR",
										"Swarm",
										"Synth Riders",
										"TOTALLY BASEBALL",
										"Tabletop Simulator",
										"Tetris Effect: Connected",
										"The Forest",
										"The Under Presents",
										"The Unspoken",
										"Tribe XR",
										"Trickster VR: Co-op Dungeon Crawler",
										"Ultrawings 2",
										"VAIL VR",
										"VRChat",
										"VR Regatta",
										"VZfit",
										"Villa: Metaverse Terraforming Platform",
										"Void Racer: Extreme",
										"Vox Machinae",
										"Walkabout Mini Golf",
										"Wander",
										"Wands",
										"Warhammer 40,000: Battle Sister",
										"Warplanes: Battles over Pacific",
										"Warplanes: WW1 Fighters",
										"Wave",
										"Werewolves Within",
										"WipEout Omega Collection",
										"Zenith: The Last City",
										"Zero Caliber: Reloaded",
										"Zero Caliber VR",
										"iRacing",
										"rFactor",
										"vTime"
									].map((label) => ({ label, key: label.toLowerCase().replace(" ", "_") }))}
								/>
							</>
						)}
					</FormField>
					<FormField name="new">
						{(field) => (
							<>
								<InputLabel>New to Virtual Reality</InputLabel>
								<InputSwitch {...field.props} />
							</>
						)}
					</FormField>
					<FormField name="interests">
						{(field) => (
							<>
								<InputLabel>Personal interests</InputLabel>
								<InputAutocomplete
									{...field.props}
									limit={7}
									placeholder="Select your personal interests..."
									options={[
										"Board games",
										"Bookworm",
										"Cars",
										"Clubbing",
										"Comics",
										"Concerts",
										"Content creator",
										"Cooking",
										"Dancing",
										"Driving sims",
										"Exploring worlds",
										"FPS",
										"Fantasy",
										"Fitness",
										"Flight sims",
										"Gamer",
										"History",
										"Horror",
										"Indie games",
										"JRPGs",
										"Karaoke",
										"MOBAs",
										"Manga",
										"Military",
										"Movies",
										"Mute",
										"Mystery",
										"Nature",
										"Philosophy",
										"Photography",
										"Psychology",
										"Puzzles",
										"RPGs",
										"Rhythm games",
										"Sci-fi",
										"Social games",
										"Spiritual",
										"Sports",
										"Sports games",
										"Strategy games",
										"TV",
										"Technology",
										"Travel",
										"VTuber",
										"eSports",
										"Anime",
										"Art",
										"Avatar creator",
										"Film/Video",
										"LGBTQ+",
										"Language learning",
										"MMOs",
										"Music",
										"Roleplaying",
										"Software dev",
										"Streaming",
										"Student",
										"World creator",
										"Writing",
										"Deaf",
										"Furry",
										"Sign language"
									].map((label) => ({ label, key: label.toLowerCase().replace(" ", "_") }))}
								/>
							</>
						)}
					</FormField>
					<button
						className="rounded-xl bg-brand-gradient p-4 shadow-brand-1 focus:outline-none focus:ring-2  focus:ring-coral focus:ring-offset-2"
						type="submit"
					>
						<span className="font-montserrat text-xl font-semibold text-white-10">Continue</span>
					</button>
				</>
			)}
		</Form>
	);
};
