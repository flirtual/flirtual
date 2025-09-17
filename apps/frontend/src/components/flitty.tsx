import React, { useCallback, useEffect, useRef, useState } from "react";
import Image1 from "virtual:remote/20f39ddf-1e5d-4aac-b919-4a31b5c8d05d";
import Image2 from "virtual:remote/709376dd-6f96-4026-8e18-9f29a730c064.svg";
import FlittyImage from "virtual:remote/flitty.png";

import { Image } from "~/components/image";
import { usePreferences } from "~/hooks/use-preferences";

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
	const [visible, setVisible] = usePreferences("assistant_visible", false);
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
	const [dialogueIndex, setDialogueIndex] = usePreferences("assistant_dialogue_index", 0);

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
			top: Math.floor(Math.max(0, event.clientY - dragData.current.offsetY)),
			bottom: "auto",
			left: Math.floor(Math.max(0, event.clientX - dragData.current.offsetX)),
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
			className="fixed z-[999] mb-[calc(42px+env(safe-area-inset-bottom))] w-[200px] pl-[60px] desktop:mb-0"
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
					<div
						style={{
							backgroundImage: `url(${Image1})`
						}}
						className="absolute left-full top-full ml-[-50px] mt-0 h-[16px] w-[10px] bg-[10px_0]"
					/>
				</div>
			)}

			<div
				style={{
					backgroundImage: `url(${Image2})`
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
				src={FlittyImage}
				width={150}
				onMouseDown={handleMouseDown}
				onTouchStart={handleTouchStart}
			/>
		</div>
	);
}
