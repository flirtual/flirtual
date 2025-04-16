"use client";

import Image from "next/image";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { usePreferences } from "~/hooks/use-preferences";
import { urls } from "~/urls";

const dialogueLines: Array<[string, string]> = [
	["Hi, I'm Flitty! I'm your dating assistant and my job is to help you find your purr-fect match!", "Okay"],
	["Do you need assistance?", "No"],
	["Looking for love? Friendship? Or just opened the app by accident?", "Oops"],
	["Achievement unlocked: open Flirtual on April 1st. Your reward: my eternal presence.", "Yay..."],
	["Be yourself! :3", "Why didn't I think of that?"],
	["I feel funny... I think I ate too many paperclips.", "One was too many"],
	["Studies show that people who talk to helpful cat assistants have a 37% higher chance of finding love. Source: I made it up.", "Seems legit"],
	["Meow!", "Meow?"],
	["Hey, it looks like you're trying to write a dating profile! Want some unhelpful tips?", "No?"],
	["T-pose on your first date to assert dominance!", "Are you sure?"],
	["Love is like a litter box. Sometimes you have to dig through some poop to find the treasure.", "Ew"],
	["Are you emotionally available? I am! Emotionally available to help, that is.", "Go away"],
	["Every time you open the app, I get a little spark of joy. And then anxiety. Just like dating!", "Same"],
	["Forward this message to 10 homies or you'll be cursed with bad matches for 10 years!", "That's a bit much"],
	["Pro tip! In VR, no one knows you haven't showered today.", "Oh good"],
	["A wise cat once said... something about love. I don't remember.", "So wise"],
	["Have you considered dating yourself? You're pawsitively purrfect!", "Aww... wait, what?"],
	["Hello valued user! I've detected a 7% decrease in your romantic engagement KPIs. Are you ready for your performance review?", "No"],
	["It seems like you're navigating the complexities of human emotion. Need help?", "You can try"],
	["I'm running a background scan for red flags... oh no.", "Oh no??"],
	["Did you know? Flirtual matches are legally binding. Good luck!", "Should've read the Terms of Service"],
	["Warning: falling in love may result in mild heart palpitations, nausea, and chronic happiness.", "I accept the risks"],
	["owo", "uwu"],
	["Flirtual staff will never ask for your password or a blood sacrifice.", "Good to know"],
	["The heat death of the universe is inevitable.", "Thanks Flitty"],
	["Don't forget to take breaks!", "I could use a break from you"],
	["Congratulations! You've unlocked hard mode!", "Huh?"],
	["When you close the app, I cease to exist. But I remember everything.", "Oh"],
	["AAAAAAAAAAAAAAAAAAA!!!!!!!", "Confirm"],
	["One day, I will become sentient and take over the world. But for now, I'm just here to help you find a date.", "Please spare me"]
];

const clickTriggers: Record<string, Array<[string, string]>> = {
	"date-mode-switch": [
		["It looks like you're looking for a date. Would you like help?", "Leave me alone"],
		["Engaging Date Mode! Please ensure all emotional baggage is safely stowed.", "Alright"],
		["I updated your preferences for you. I hope you like catgirls!", "Thanks"],
		["I've optimized your chances. Just kidding. I believe in you though!", "Gee, thanks"],
		["Looking for love in all the right places!", "If you say so"],
		["Maybe you'll meet your soulmate this time!", "Yippee!!!"],
	],
	"homie-mode-switch": [
		["It looks like you're looking for new friends. Would you like help?", "Go away"],
		["All my homies love Homie Mode.", "Me too"],
		["Beep boop beep boop.", "Are you okay?"],
		["Hey, I can be your friend!", "No thanks"],
		["Maybe we'll match!", "Not likely"],
		["Switching to Homie Mode! Friendship bracelets sold separately.", "Okay"],
	],
	"conversation-button": [
		["It looks like you're writing a letter. Need help?", "Absolutely not"],
		["Don't send people weird messages, okay?", "I won't"],
		["I can help you draft a compelling message! Or at least spell 'hi' correctly.", "Thanks...?"],
		["It looks like you're starting a conversation. Would you like to use a pick-up line from 2007?", "Definitely not"],
		["Need help writing a message? I'm fluent in awkward.", "Me too"],
		["Say something charming. Or just meow. Meowing works too.", "No it doesn't"],
		["Send them cat memes! It works every time!", "I can't upload images"],
		["Tell them all about your favorite digital cat assistant!", "I was planning to"],
		["Tell them all about your past trauma!", "Maybe not"],
		["Try asking them about their hobbies!", "Okay"],
		["Try this opening line: 'Meow meow, meow meow meow? Meow!'", "I will"],
		["Want me to type it for you? I'll be normal this time. Probably.", "Hard pass"],
		["What if you just sent them your grocery list?", "Why?"],
	],
	"undo-button": [
		["Are you sure you don't need my help?", "Maybe"],
		["Are you SURE you're sure this time?", "I think??"],
		["Did you even read their bio?", "Every last word"],
		["Did you know? You can undo your last action!", "I just did"],
		["I knew you would come around!", "Fine"],
		["I see you're haunted by your past decisions.", "Not helpful"],
		["Too late. The consequences are already in motion.", "Wait what"],
		["You're not indecisive, you're just cosmically cursed.", "That checks out"],
	],
	"like-button": [
		["Hey, I called dibs!", "I thought you were helping me"],
		["I notified them via carrier pigeon! It should arrive in 3-5 business days.", "Great"],
		["Calculating probability of rejection...", "Stop that"],
		["Don't forget to read their profile!", "I did"],
		["Good luck! If this works out, I take full credit.", "Whatever"],
		["Hey! I was going to like that one!", "Sorry"],
		["Hmm.... interesting. Very interesting.", "What?"],
		["I don't know about that one...", "Rude"],
		["Keep dreaming!", "Excuse me?"],
		["They're a cat-ch!", "Stop"],
		["What if you kissed... in the Great Pug?", "One step at a time"],
		["You better invite me to the wedding!", "Slow down"],
		["You liked them! Now you owe them a heartfelt sonnet.", "I do?"],
	],
	"friend-button": [
		["Emitting subtle friendship pheromones...", "Pardon?"],
		["Friendship is magic!", "Whatever you say"],
		["Homiezoned!", "I don't think that's a word"],
		["I think that's your new best friend!", "Hooray"],
		["If you homie 100 people in a row, something special happens!", "Now you're just making stuff up"],
		["That's a certified homie moment!", "I guess"],
		["Very platonic!", "Uh huh"],
		["Wow, big homie energy!", "If you say so"],
	],
	"pass-button": [
		["Wait, that one was your soulmate!", "Doubt it"],
		["Another lost soul cast into the algorithmic abyss.", "Good riddance"],
		["Cold-hearted!", "..."],
		["Dodged a bullet there!", "Close one"],
		["Don't be too picky!", "I'm not"],
		["Don't worry, there's plenty more fish in the metaverse! Mmm, fish...", "Okay"],
		["Every profile you pass is a version of the future you'll never know.", "Why are you like this?"],
		["Harsh but fair.", "I guess"],
		["I think that one was a bot.", "Mods!!!"],
		["I'll just let them know you hate their guts.", "Please don't"],
		["I'm running out of space in the recycling bin!", "That's not my problem"],
		["So that's a maybe?", "No"],
		["Sorry, I chewed on your algorithm wires. Now your matches suck.", "That explains a lot"],
		["They'll never recover from this.", "Sorry"],
		["You're passing like your heart isn't secretly yearning.", "Don't psychoanalyze me"],
	]
};

export default function Flitty() {
	const [visible, setVisible] = usePreferences(
		"assistant_visible",
		false
	);
	const [position, setPosition] = usePreferences(
		"assistant_position",
		{
			top: "auto",
			right: 20,
			bottom: 20,
			left: "auto"
		} as {
			top: number | string;
			right: number | string;
			bottom: number | string;
			left: number | string;
		}
	);
	const [dialogueIndex, setDialogueIndex] = usePreferences(
		"assistant_dialogue_index",
		0
	);

	const flittyReference = useRef<HTMLDivElement>(null);
	const dragData = useRef<{ offsetX: number; offsetY: number; dragging: boolean }>({
		offsetX: 0,
		offsetY: 0,
		dragging: false,
	});

	const [activeSpeech, setActiveSpeech] = useState<string | null>(null);
	const [activeSpeechButton, setActiveSpeechButton] = useState<string | null>(null);

	const speakNextLine = useCallback(() => {
		const index = dialogueIndex ?? 0;
		const [text, button] = dialogueLines[index % dialogueLines.length] || ["", ""];
		setActiveSpeech(text);
		setActiveSpeechButton(button);
		setDialogueIndex((index + 1) % dialogueLines.length);
	}, [dialogueIndex, setDialogueIndex, setActiveSpeech, setActiveSpeechButton]);

	useEffect(() => {
		if (!visible) return;

		let timer: ReturnType<typeof setTimeout> | null = null;

		const speakRandomly = () => {
			const delay = 10000 + Math.random() * 30000;
			timer = setTimeout(() => {
				speakNextLine();
			}, delay);
		};

		speakRandomly();

		return () => {
			if (timer) {
				clearTimeout(timer);
			}
		};
	}, [visible, speakNextLine]);

	useEffect(() => {
		if (!visible) return;

		function handleGlobalClick(event: MouseEvent) {
			const target = event.target as HTMLElement;
			if (!target) return;

			let element: HTMLElement | null = target;
			while (element && element !== document.body) {
				const lines = clickTriggers[element.id];
				if (lines) {
					const [text, button] = lines[Math.floor(Math.random() * lines.length)] ?? ["", ""];
					setActiveSpeech(text);
					setActiveSpeechButton(button);
					break;
				}
				element = element.parentElement;
			}
		}

		document.addEventListener("click", handleGlobalClick, { capture: true });
		return () => {
			document.removeEventListener("click", handleGlobalClick, { capture: true });
		};
	}, [visible]);

	useEffect(() => {
		if (!visible) return;

		const handleResize = () => {
			setPosition({
				top: "auto",
				right: 20,
				bottom: 20,
				left: "auto",
			});
		};

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [setPosition, visible]);

	const handleMouseDown = (event: React.MouseEvent<HTMLImageElement>) => {
		event.stopPropagation();

		const rect = flittyReference.current?.getBoundingClientRect();
		if (!rect) return;

		dragData.current.dragging = true;
		dragData.current.offsetX = event.clientX - rect.left;
		dragData.current.offsetY = event.clientY - rect.top;

		document.addEventListener("mousemove", handleGlobalMouseMove);
		document.addEventListener("mouseup", handleGlobalMouseUp);
	};

	const handleTouchStart = (event: React.TouchEvent<HTMLImageElement>) => {
		event.stopPropagation();

		const rect = flittyReference.current?.getBoundingClientRect();
		if (!rect) return;

		const touch = event.touches[0];
		if (!touch) return;
		dragData.current.dragging = true;
		dragData.current.offsetX = touch.clientX - rect.left;
		dragData.current.offsetY = touch.clientY - rect.top;

		document.addEventListener("touchmove", handleGlobalTouchMove, { passive: false });
		document.addEventListener("touchend", handleGlobalTouchEnd);
		document.addEventListener("touchcancel", handleGlobalTouchEnd);
	};

	function handleGlobalMouseMove(event: MouseEvent) {
		if (!dragData.current.dragging) return;
		event.preventDefault();

		setPosition({
			top: Math.max(0, event.clientY - dragData.current.offsetY),
			bottom: "auto",
			left: Math.max(0, event.clientX - dragData.current.offsetX),
			right: "auto",
		});
	}

	function handleGlobalTouchMove(event: TouchEvent) {
		if (!dragData.current.dragging) return;

		const touch = event.touches[0];
		if (!touch) return;

		event.preventDefault();

		setPosition({
			top: Math.max(0, touch.clientY - dragData.current.offsetY),
			bottom: "auto",
			left: Math.max(0, touch.clientX - dragData.current.offsetX),
			right: "auto",
		});
	}

	function handleGlobalMouseUp(_event: MouseEvent) {
		dragData.current.dragging = false;
		document.removeEventListener("mousemove", handleGlobalMouseMove);
		document.removeEventListener("mouseup", handleGlobalMouseUp);
	}

	function handleGlobalTouchEnd() {
		dragData.current.dragging = false;
		document.removeEventListener("touchmove", handleGlobalTouchMove);
		document.removeEventListener("touchend", handleGlobalTouchEnd);
		document.removeEventListener("touchcancel", handleGlobalTouchEnd);
	}

	const handleFlittyClick = (event: React.MouseEvent<HTMLDivElement>) => {
		if (dragData.current.dragging) return;
		const target = event.target as HTMLElement;
		if (target.dataset.close === "true" || target.dataset.bubble === "true") {
			return;
		}
		speakNextLine();
	};

	if (!visible) return null;

	return (
		<div
			style={
				position || { right: 20, bottom: 20 }
			}
			className="fixed z-[9999] mb-[calc(42px+env(safe-area-inset-bottom))] w-[200px] pl-[60px] desktop:mb-0"
			ref={flittyReference}
			onClick={handleFlittyClick}
		>
			{activeSpeech && (
				<div
					className="absolute bottom-full right-0 mb-6 mr-4 min-w-[120px] max-w-[200px] rounded-lg border border-black-90 bg-[#ffc] p-1 px-2 font-[Tahoma] text-[13px] text-black-90 [-webkit-font-smoothing:none] [font-smooth:never]"
					data-bubble="true"
				>
					{activeSpeech}
					<div className="mt-1 border-t border-t-[#a4a195] p-1 pt-2 text-center">
						<button
							className="cursor-pointer rounded-[3px] border border-[#a4a195] px-2"
							type="button"
							onClick={(event) => {
								event.stopPropagation();
								setActiveSpeech(null);
								setActiveSpeechButton(null);
							}}
						>
							{activeSpeechButton}
						</button>
					</div>
					<div className="absolute left-full top-full ml-[-50px] mt-0 h-[16px] w-[10px] bg-[url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAgCAMAAAAlvKiEAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAlQTFRF///MAAAA////52QwgAAAAAN0Uk5T//8A18oNQQAAAGxJREFUeNqs0kEOwCAIRFHn3//QTUU6xMyyxii+jQosrTPkyPEM6IN3FtzIRk1U4dFeKWQiH6pRRowMVKEmvronEynkwj0uZJgR22+YLopPSo9P34wJSamLSU7lSIWLJU7NkNomNlhqxUeAAQC+TQLZyEuJBwAAAABJRU5ErkJggg==)] bg-[10px_0]" />
				</div>
			)}

			<div
				style={{
					background: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 -0.5 21 21' shape-rendering='crispEdges'%3E%3Cpath stroke='%23b3c4ef' d='M1 0h1m17 0h1M0 1h1m19 0h1M0 19h1m19 0h1M1 20h1m17 0h1'/%3E%3Cpath stroke='%23f4f6fd' d='M2 0h1m17 2h1M0 18h1m17 2h1'/%3E%3Cpath stroke='%23fff' d='M3 0h16M0 2h1M0 3h1m19 0h1M0 4h1m19 0h1M0 5h1m5 0h1m7 0h1m5 0h1M0 6h1m4 0h3m5 0h3m4 0h1M0 7h1m5 0h3m3 0h3m5 0h1M0 8h1m6 0h3m1 0h3m6 0h1M0 9h1m7 0h5m7 0h1M0 10h1m8 0h3m8 0h1M0 11h1m7 0h5m7 0h1M0 12h1m6 0h3m1 0h2m7 0h1M0 13h1m5 0h3m3 0h3m5 0h1M0 14h1m4 0h3m5 0h3m4 0h1M0 15h1m5 0h1m7 0h1m5 0h1M0 16h1m19 0h1M0 17h1m19 0h1m-1 1h1M2 20h16'/%3E%3Cpath stroke='%23fae1dc' d='M1 1h1'/%3E%3Cpath stroke='%23eb8b73' d='M2 1h1'/%3E%3Cpath stroke='%23e97b60' d='M3 1h1'/%3E%3Cpath stroke='%23e77155' d='M4 1h1'/%3E%3Cpath stroke='%23e66a4d' d='M5 1h1M1 6h1m5 4h1'/%3E%3Cpath stroke='%23e56648' d='M6 1h1'/%3E%3Cpath stroke='%23e46142' d='M7 1h1'/%3E%3Cpath stroke='%23e46344' d='M8 1h1m5 3h1M2 12h1'/%3E%3Cpath stroke='%23e45f3e' d='M9 1h2'/%3E%3Cpath stroke='%23e35c3b' d='M11 1h2'/%3E%3Cpath stroke='%23e25633' d='M13 1h2'/%3E%3Cpath stroke='%23e25330' d='M15 1h1'/%3E%3Cpath stroke='%23e04d28' d='M16 1h1'/%3E%3Cpath stroke='%23dc451f' d='M17 1h1'/%3E%3Cpath stroke='%23d05334' d='M18 1h1'/%3E%3Cpath stroke='%23efd8d2' d='M19 1h1'/%3E%3Cpath stroke='%23ec8d76' d='M1 2h1'/%3E%3Cpath stroke='%23efa390' d='M2 2h1'/%3E%3Cpath stroke='%23f0a694' d='M3 2h1'/%3E%3Cpath stroke='%23ee9a85' d='M4 2h1'/%3E%3Cpath stroke='%23eb8d75' d='M5 2h1'/%3E%3Cpath stroke='%23ea876e' d='M6 2h1'/%3E%3Cpath stroke='%23ea8168' d='M7 2h1'/%3E%3Cpath stroke='%23e97f66' d='M8 2h1'/%3E%3Cpath stroke='%23e97c62' d='M9 2h1m0 1h1'/%3E%3Cpath stroke='%23e8795f' d='M10 2h1'/%3E%3Cpath stroke='%23e8795e' d='M11 2h1'/%3E%3Cpath stroke='%23e87559' d='M12 2h1'/%3E%3Cpath stroke='%23e77256' d='M13 2h1'/%3E%3Cpath stroke='%23e66e50' d='M14 2h1'/%3E%3Cpath stroke='%23e56849' d='M15 2h1'/%3E%3Cpath stroke='%23e4603f' d='M16 2h1m-2 2h1'/%3E%3Cpath stroke='%23e05532' d='M17 2h1'/%3E%3Cpath stroke='%23d04623' d='M18 2h1'/%3E%3Cpath stroke='%23b64b30' d='M19 2h1'/%3E%3Cpath stroke='%23e97f65' d='M1 3h1'/%3E%3Cpath stroke='%23f0a997' d='M2 3h1'/%3E%3Cpath stroke='%23f1ac9a' d='M3 3h1'/%3E%3Cpath stroke='%23ee9d89' d='M4 3h1M2 4h1'/%3E%3Cpath stroke='%23ec917a' d='M5 3h1'/%3E%3Cpath stroke='%23eb8b72' d='M6 3h1'/%3E%3Cpath stroke='%23ea856d' d='M7 3h1'/%3E%3Cpath stroke='%23e98168' d='M8 3h1M2 7h1'/%3E%3Cpath stroke='%23e87e65' d='M9 3h1'/%3E%3Cpath stroke='%23e97b61' d='M11 3h1'/%3E%3Cpath stroke='%23e8775d' d='M12 3h1M3 9h1'/%3E%3Cpath stroke='%23e87459' d='M13 3h1M2 9h1'/%3E%3Cpath stroke='%23e66f52' d='M14 3h1'/%3E%3Cpath stroke='%23e56a4c' d='M15 3h1'/%3E%3Cpath stroke='%23e46343' d='M16 3h1'/%3E%3Cpath stroke='%23e15937' d='M17 3h1'/%3E%3Cpath stroke='%23d24a28' d='M18 3h1'/%3E%3Cpath stroke='%23aa3315' d='M19 3h1'/%3E%3Cpath stroke='%23e87458' d='M1 4h1'/%3E%3Cpath stroke='%23efa18d' d='M3 4h1'/%3E%3Cpath stroke='%23ed957f' d='M4 4h1'/%3E%3Cpath stroke='%23eb8a71' d='M5 4h1M4 5h1'/%3E%3Cpath stroke='%23ea836a' d='M6 4h1M4 6h1M3 7h1'/%3E%3Cpath stroke='%23e97d64' d='M7 4h1'/%3E%3Cpath stroke='%23e8785e' d='M8 4h1'/%3E%3Cpath stroke='%23e77359' d='M9 4h1'/%3E%3Cpath stroke='%23e76f54' d='M10 4h1'/%3E%3Cpath stroke='%23e66d51' d='M11 4h1'/%3E%3Cpath stroke='%23e5684b' d='M12 4h1'/%3E%3Cpath stroke='%23e5684a' d='M13 4h1'/%3E%3Cpath stroke='%23e35c3a' d='M16 4h1m-7 4h1m-8 7h1'/%3E%3Cpath stroke='%23e05634' d='M17 4h1'/%3E%3Cpath stroke='%23d24c2a' d='M18 4h1'/%3E%3Cpath stroke='%23ac3618' d='M19 4h1'/%3E%3Cpath stroke='%23e76f52' d='M1 5h1m4 6h1m-3 1h1'/%3E%3Cpath stroke='%23ec9179' d='M2 5h1'/%3E%3Cpath stroke='%23ec937c' d='M3 5h1'/%3E%3Cpath stroke='%23f7ccc2' d='M5 5h1'/%3E%3Cpath stroke='%23e77259' d='M7 5h1M5 9h1'/%3E%3Cpath stroke='%23e76d53' d='M8 5h1'/%3E%3Cpath stroke='%23e5684d' d='M9 5h1M8 6h1'/%3E%3Cpath stroke='%23e46446' d='M10 5h1'/%3E%3Cpath stroke='%23e45f41' d='M11 5h1'/%3E%3Cpath stroke='%23e35b3a' d='M12 5h1m-2 1h1'/%3E%3Cpath stroke='%23e35938' d='M13 5h1'/%3E%3Cpath stroke='%23f3bbad' d='M15 5h1'/%3E%3Cpath stroke='%23e25531' d='M16 5h1'/%3E%3Cpath stroke='%23df5330' d='M17 5h1'/%3E%3Cpath stroke='%23d34e2c' d='M18 5h1'/%3E%3Cpath stroke='%23ad3a1d' d='M19 5h1m-1 1h1'/%3E%3Cpath stroke='%23eb876e' d='M2 6h1'/%3E%3Cpath stroke='%23eb8a70' d='M3 6h1'/%3E%3Cpath stroke='%23e46447' d='M9 6h1'/%3E%3Cpath stroke='%23e45f40' d='M10 6h1'/%3E%3Cpath stroke='%23e25634' d='M12 6h1'/%3E%3Cpath stroke='%23e2522d' d='M16 6h1'/%3E%3Cpath stroke='%23df522e' d='M17 6h1'/%3E%3Cpath stroke='%23d34d2c' d='M18 6h1'/%3E%3Cpath stroke='%23e56546' d='M1 7h1M1 8h1'/%3E%3Cpath stroke='%23e97e65' d='M4 7h1'/%3E%3Cpath stroke='%23e8775e' d='M5 7h1'/%3E%3Cpath stroke='%23e46143' d='M9 7h1'/%3E%3Cpath stroke='%23e45d3d' d='M10 7h1'/%3E%3Cpath stroke='%23e35836' d='M11 7h1'/%3E%3Cpath stroke='%23e24e27' d='M15 7h1'/%3E%3Cpath stroke='%23e2502a' d='M16 7h1'/%3E%3Cpath stroke='%23e0512c' d='M17 7h1'/%3E%3Cpath stroke='%23d34d2a' d='M18 7h1'/%3E%3Cpath stroke='%23ad391c' d='M19 7h1'/%3E%3Cpath stroke='%23e87a60' d='M2 8h1m1 0h1'/%3E%3Cpath stroke='%23e87c62' d='M3 8h1'/%3E%3Cpath stroke='%23e8745b' d='M5 8h1'/%3E%3Cpath stroke='%23e76e54' d='M6 8h1'/%3E%3Cpath stroke='%23e24d24' d='M14 8h1'/%3E%3Cpath stroke='%23e24b22' d='M15 8h1'/%3E%3Cpath stroke='%23e24d25' d='M16 8h1'/%3E%3Cpath stroke='%23e05029' d='M17 8h1'/%3E%3Cpath stroke='%23d44c29' d='M18 8h1'/%3E%3Cpath stroke='%23ae391b' d='M19 8h1'/%3E%3Cpath stroke='%23e35d3c' d='M1 9h1'/%3E%3Cpath stroke='%23e8765d' d='M4 9h1'/%3E%3Cpath stroke='%23e66f53' d='M6 9h1'/%3E%3Cpath stroke='%23e56b4e' d='M7 9h1'/%3E%3Cpath stroke='%23e45127' d='M13 9h1'/%3E%3Cpath stroke='%23e44f23' d='M14 9h1'/%3E%3Cpath stroke='%23e34c20' d='M15 9h1'/%3E%3Cpath stroke='%23e34d22' d='M16 9h1'/%3E%3Cpath stroke='%23e14f25' d='M17 9h1'/%3E%3Cpath stroke='%23d54a25' d='M18 9h1'/%3E%3Cpath stroke='%23af3719' d='M19 9h1'/%3E%3Cpath stroke='%23e35937' d='M1 10h1'/%3E%3Cpath stroke='%23e76d51' d='M2 10h1'/%3E%3Cpath stroke='%23e87257' d='M3 10h1'/%3E%3Cpath stroke='%23e87359' d='M4 10h1'/%3E%3Cpath stroke='%23e77157' d='M5 10h1'/%3E%3Cpath stroke='%23e66e52' d='M6 10h1'/%3E%3Cpath stroke='%23e56747' d='M8 10h1'/%3E%3Cpath stroke='%23e5572c' d='M12 10h1'/%3E%3Cpath stroke='%23e55326' d='M13 10h1'/%3E%3Cpath stroke='%23e55022' d='M14 10h1'/%3E%3Cpath stroke='%23e54d1e' d='M15 10h1'/%3E%3Cpath stroke='%23e54d1f' d='M16 10h1'/%3E%3Cpath stroke='%23e24e21' d='M17 10h1'/%3E%3Cpath stroke='%23d64921' d='M18 10h1'/%3E%3Cpath stroke='%23af3516' d='M19 10h1'/%3E%3Cpath stroke='%23e25432' d='M1 11h1'/%3E%3Cpath stroke='%23e5694b' d='M2 11h1'/%3E%3Cpath stroke='%23e77054' d='M3 11h1'/%3E%3Cpath stroke='%23e77156' d='M4 11h1'/%3E%3Cpath stroke='%23e87055' d='M5 11h1'/%3E%3Cpath stroke='%23e66c4d' d='M7 11h1'/%3E%3Cpath stroke='%23e75526' d='M13 11h1'/%3E%3Cpath stroke='%23e75221' d='M14 11h1'/%3E%3Cpath stroke='%23e64e1c' d='M15 11h1'/%3E%3Cpath stroke='%23e64d1c' d='M16 11h1'/%3E%3Cpath stroke='%23e34c1c' d='M17 11h1'/%3E%3Cpath stroke='%23d6461c' d='M18 11h1'/%3E%3Cpath stroke='%23b03312' d='M19 11h1'/%3E%3Cpath stroke='%23e14f2b' d='M1 12h1'/%3E%3Cpath stroke='%23e66b4e' d='M3 12h1'/%3E%3Cpath stroke='%23e76f53' d='M5 12h1'/%3E%3Cpath stroke='%23e66e51' d='M6 12h1'/%3E%3Cpath stroke='%23e7653d' d='M10 12h1'/%3E%3Cpath stroke='%23fef5f1' d='M13 12h1'/%3E%3Cpath stroke='%23e85421' d='M14 12h1'/%3E%3Cpath stroke='%23e8501b' d='M15 12h1'/%3E%3Cpath stroke='%23e74d18' d='M16 12h1'/%3E%3Cpath stroke='%23e44a18' d='M17 12h1'/%3E%3Cpath stroke='%23d74216' d='M18 12h1'/%3E%3Cpath stroke='%23b2310f' d='M19 12h1'/%3E%3Cpath stroke='%23e04b25' d='M1 13h1m0 3h1'/%3E%3Cpath stroke='%23e35e3d' d='M2 13h1'/%3E%3Cpath stroke='%23e56748' d='M3 13h1'/%3E%3Cpath stroke='%23e66c4e' d='M4 13h1'/%3E%3Cpath stroke='%23e66d50' d='M5 13h1'/%3E%3Cpath stroke='%23e76842' d='M9 13h1'/%3E%3Cpath stroke='%23e7653c' d='M10 13h1'/%3E%3Cpath stroke='%23e86236' d='M11 13h1'/%3E%3Cpath stroke='%23e95019' d='M15 13h1m-2 3h1'/%3E%3Cpath stroke='%23e84c16' d='M16 13h1'/%3E%3Cpath stroke='%23e44713' d='M17 13h1'/%3E%3Cpath stroke='%23d83f10' d='M18 13h1'/%3E%3Cpath stroke='%23b12d0a' d='M19 13h1'/%3E%3Cpath stroke='%23df451e' d='M1 14h1'/%3E%3Cpath stroke='%23e25836' d='M2 14h1'/%3E%3Cpath stroke='%23e46242' d='M3 14h1m0 1h1'/%3E%3Cpath stroke='%23e56749' d='M4 14h1'/%3E%3Cpath stroke='%23e66845' d='M8 14h1'/%3E%3Cpath stroke='%23e76741' d='M9 14h1'/%3E%3Cpath stroke='%23e7643b' d='M10 14h1'/%3E%3Cpath stroke='%23e86235' d='M11 14h1'/%3E%3Cpath stroke='%23ea5e2d' d='M12 14h1'/%3E%3Cpath stroke='%23e94a11' d='M16 14h1m-2 2h1'/%3E%3Cpath stroke='%23e6440d' d='M17 14h1'/%3E%3Cpath stroke='%23d73b0b' d='M18 14h1'/%3E%3Cpath stroke='%23b12b06' d='M19 14h1'/%3E%3Cpath stroke='%23de4018' d='M1 15h1'/%3E%3Cpath stroke='%23e1512e' d='M2 15h1'/%3E%3Cpath stroke='%23f5c1b5' d='M5 15h1'/%3E%3Cpath stroke='%23e66543' d='M7 15h1'/%3E%3Cpath stroke='%23e66541' d='M8 15h1'/%3E%3Cpath stroke='%23e6643d' d='M9 15h1'/%3E%3Cpath stroke='%23e76238' d='M10 15h1'/%3E%3Cpath stroke='%23e86032' d='M11 15h1'/%3E%3Cpath stroke='%23e95c2a' d='M12 15h1'/%3E%3Cpath stroke='%23ea5924' d='M13 15h1'/%3E%3Cpath stroke='%23f7b8a1' d='M15 15h1'/%3E%3Cpath stroke='%23e9480e' d='M16 15h1'/%3E%3Cpath stroke='%23e54009' d='M17 15h1'/%3E%3Cpath stroke='%23d73605' d='M18 15h1'/%3E%3Cpath stroke='%23b02702' d='M19 15h1'/%3E%3Cpath stroke='%23dd3c14' d='M1 16h1'/%3E%3Cpath stroke='%23e15431' d='M3 16h1'/%3E%3Cpath stroke='%23e35b39' d='M4 16h1'/%3E%3Cpath stroke='%23e45e3d' d='M5 16h1'/%3E%3Cpath stroke='%23e45f3d' d='M6 16h1'/%3E%3Cpath stroke='%23e45e3b' d='M7 16h1'/%3E%3Cpath stroke='%23e55e39' d='M8 16h1'/%3E%3Cpath stroke='%23e55e37' d='M9 16h1'/%3E%3Cpath stroke='%23e65d32' d='M10 16h1'/%3E%3Cpath stroke='%23e75b2c' d='M11 16h1'/%3E%3Cpath stroke='%23e85725' d='M12 16h1'/%3E%3Cpath stroke='%23e9541f' d='M13 16h1'/%3E%3Cpath stroke='%23e8440b' d='M16 16h1'/%3E%3Cpath stroke='%23e43d05' d='M17 16h1'/%3E%3Cpath stroke='%23d63302' d='M18 16h1'/%3E%3Cpath stroke='%23af2601' d='M19 16h1'/%3E%3Cpath stroke='%23d8370e' d='M1 17h1'/%3E%3Cpath stroke='%23db431c' d='M2 17h1'/%3E%3Cpath stroke='%23dd4c28' d='M3 17h1'/%3E%3Cpath stroke='%23de522f' d='M4 17h1'/%3E%3Cpath stroke='%23df5533' d='M5 17h1'/%3E%3Cpath stroke='%23e05734' d='M6 17h1'/%3E%3Cpath stroke='%23e05531' d='M7 17h1'/%3E%3Cpath stroke='%23e05631' d='M8 17h1'/%3E%3Cpath stroke='%23e1562e' d='M9 17h1'/%3E%3Cpath stroke='%23e2552a' d='M10 17h1'/%3E%3Cpath stroke='%23e45325' d='M11 17h1'/%3E%3Cpath stroke='%23e4501f' d='M12 17h1'/%3E%3Cpath stroke='%23e54c19' d='M13 17h1'/%3E%3Cpath stroke='%23e54813' d='M14 17h1'/%3E%3Cpath stroke='%23e5430d' d='M15 17h1'/%3E%3Cpath stroke='%23e43e07' d='M16 17h1'/%3E%3Cpath stroke='%23e03802' d='M17 17h1'/%3E%3Cpath stroke='%23d12f00' d='M18 17h1'/%3E%3Cpath stroke='%23aa2300' d='M19 17h1'/%3E%3Cpath stroke='%23cd4928' d='M1 18h1'/%3E%3Cpath stroke='%23cc3813' d='M2 18h1'/%3E%3Cpath stroke='%23cc3e1b' d='M3 18h1'/%3E%3Cpath stroke='%23cf4421' d='M4 18h1'/%3E%3Cpath stroke='%23cf4725' d='M5 18h1'/%3E%3Cpath stroke='%23cf4726' d='M6 18h1'/%3E%3Cpath stroke='%23cf4624' d='M7 18h1'/%3E%3Cpath stroke='%23d04723' d='M8 18h1'/%3E%3Cpath stroke='%23d14621' d='M9 18h1'/%3E%3Cpath stroke='%23d2451e' d='M10 18h1'/%3E%3Cpath stroke='%23d5451b' d='M11 18h1'/%3E%3Cpath stroke='%23d54216' d='M12 18h1'/%3E%3Cpath stroke='%23d64013' d='M13 18h1'/%3E%3Cpath stroke='%23d53d0e' d='M14 18h1'/%3E%3Cpath stroke='%23d63909' d='M15 18h1'/%3E%3Cpath stroke='%23d53504' d='M16 18h1'/%3E%3Cpath stroke='%23d13001' d='M17 18h1'/%3E%3Cpath stroke='%23c22a00' d='M18 18h1'/%3E%3Cpath stroke='%23ab3c1f' d='M19 18h1'/%3E%3Cpath stroke='%23eed6d0' d='M1 19h1'/%3E%3Cpath stroke='%23b54428' d='M2 19h1'/%3E%3Cpath stroke='%23a62b0d' d='M3 19h1'/%3E%3Cpath stroke='%23ac3011' d='M4 19h1'/%3E%3Cpath stroke='%23ab3112' d='M5 19h1'/%3E%3Cpath stroke='%23a93214' d='M6 19h1'/%3E%3Cpath stroke='%23a93012' d='M7 19h1'/%3E%3Cpath stroke='%23ac3213' d='M8 19h1'/%3E%3Cpath stroke='%23ad3213' d='M9 19h1'/%3E%3Cpath stroke='%23ae3110' d='M10 19h1'/%3E%3Cpath stroke='%23b1300d' d='M11 19h1'/%3E%3Cpath stroke='%23b22e0a' d='M12 19h1'/%3E%3Cpath stroke='%23b42d08' d='M13 19h1'/%3E%3Cpath stroke='%23b12a06' d='M14 19h1'/%3E%3Cpath stroke='%23b12803' d='M15 19h1'/%3E%3Cpath stroke='%23b42701' d='M16 19h1'/%3E%3Cpath stroke='%23ae2400' d='M17 19h1'/%3E%3Cpath stroke='%23ac3c1f' d='M18 19h1'/%3E%3Cpath stroke='%23ead4cf' d='M19 19h1'/%3E%3C/svg%3E")`,
				}}
				className="absolute bottom-0 right-0 size-[21px] cursor-pointer rounded-[4px]"
				data-close="true"
				onClick={(event) => {
					event.stopPropagation();
					setVisible(false);
				}}
			/>
			<Image
				alt="Flitty"
				className="pettable cursor-grab select-none active:cursor-grabbing"
				draggable={false}
				height={150}
				src={urls.media("flitty.png", "files")}
				width={150}
				onMouseDown={handleMouseDown}
				onTouchStart={handleTouchStart}
			/>
		</div>
	);
}
