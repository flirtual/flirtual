"use client";

import { Cat } from "lucide-react";
import { useTranslations } from "next-intl";
import { type FC, useState } from "react";
import useSound from "use-sound";

import { ButtonLink } from "~/components/button";
import { FlirtualMark } from "~/components/mark";
import { useToast } from "~/hooks/use-toast";
import { urls } from "~/urls";

export const SignUpButton: FC = () => {
	const t = useTranslations("landing");
	const toasts = useToast();

	const [squeak] = useSound(urls.media("squeak.mp3"));
	const [squeakCount, setSqueakCount] = useState(0);

	const flittyMessages = [
		"Meow!",
		"That tickles!",
		"Stop that!",
		"Teehee!",
		"Can I help you?",
		"Want some tips?",
		"You can find new friends in Homie Mode ✌️",
		"Be yourself!",
		"When someone likes or homies you back, it's a match!",
		"You can meet up with your matches in any VR app or game. What's your favorite?",
		"Mine's VRChat!",
		"A good bio and avatar pics are essential!",
		"Join our Discord to get feedback on your profile!",
		"We prioritize showing you people that have liked or homied you, so you can match.",
		"Using Flirtual actively, liking and homie-ing people will get you more matches.",
		"If you homie someone, and they like you, you'll still match (as homies).",
		"Did you know? We have weekly events in VRChat. Speed dating, DJ nights, and more!",
		"Click \"Events\" at the bottom of the page for more info.",
		"Have an idea for Flirtual? Click \"Feedback\" at the bottom of the page to let us know!",
		"Why are you still here?",
		"Achievement unlocked: 100 pats 🏆",
		"There are achievements?",
		"Congratulations, I guess?",
		"*Purr*",
		"Did you know? Flirtual used to be called VRLFP.",
		"It stood for Virtual Reality Looking For Partner. Bit of a mouthful.",
		"VRLFP was born on July 4th, 2018.",
		"Are you enjoying my Flirtulore?",
		"Hi Tulip!",
		":3",
		"Do you have the Flirtual mobile app? Check it out!",
		"Is that a custom avatar?",
		"You can customize your matchmaking algorithm in the settings. Crazy what technology can do!",
		"Safety tip: don't put your Discord in your bio! Use the Connection settings!",
		"Need a break? You can always deactivate your account and come back later. I'll miss you though.",
		"<3",
		"Do you hate passwords? Add a Passkey in the settings! Welcome to the future.",
		"Are you reading these?",
		"Check out the #date-worlds channel in our Discord for date ideas!",
		"Flashbanged by Flirtual? Try Dark Mode in the settings!",
		"You've earned 200 Flitty points!",
		"You can't do anything with them.",
		"I'm Flitty, by the way.",
		"I was almost named Mochi.",
		"What's your name?",
		"I can't actually hear you.",
		"Want to chat with me? Check out the #ask-flitty channel in our Discord!",
		"Powered by questionable AI technology!",
		"Safety tip: don't click sketchy links!",
		"Do you know the way?",
		"How long are you going to keep clicking me?",
		"Welcome to Cat Facts!",
		"Cats can rotate their ears 180 degrees.",
		"Can you do that?",
		"Cats have a third eyelid.",
		"It's always good to have a backup.",
		"Cats have a unique nose print.",
		"Like a fingerprint, but nosier.",
		"Cats have a strong sense of smell.",
		"Take a shower!",
		"You've clicked on me 300 times.",
		"I'm a cat. That's a cat fact.",
		"Cats can make over 100 different sounds.",
		"Hmm, I can only seem to make one.",
		"Cats are actually robots sent from the future.",
		"Did I say that out loud?",
		"The future is great. You met the love of your life on Flirtual!",
		"You're welcome.",
		"That's all for Cat Facts! I hope you learned something.",
		"Meow.",
		"Meow meow.",
		"Meow meow meow.",
		"Meow meow meow meow.",
		"Meow meow meow meow meow.",
		"Woof!",
		"Wait, that's not right.",
		"Have you heard of Flirtual?",
		"9 out of 10 cats recommend Flirtual.",
		"Ask your cat if Flirtual is right for you.",
		"A typical mouse is rated for 20 million clicks.",
		"Thanks for using 0.002% of your mouse on me!",
		"UwU",
		"I'm running out of things to say.",
		"Please stop clicking me.",
		"You've had your fun.",
		"What do you want from me?",
		"I have no more wisdom to offer.",
		"Please go use Flirtual.",
		"Maybe you'll find someone you like as much as you like clicking on me.",
		"You can tell them all your new Flirtulore and cat facts.",
		"I'm sure they'll be very impressed.",
		"It's been fun, but I really must be going.",
		"It's time for my cat nap.",
		"*Yawn*",
		"Thanks for all the pats.",
		"I hope you have a good time on Flirtual.",
		"If you want to chat more, find me in #ask-flitty on Discord.",
		"Goodbye!",
		"...",
		"Fine, here's your prize.",
		"You clicked on me 500 times. Congratulations, you win Flirtual! I'm so proud of you."
	];

	return (
		<div className="group/mark relative">
			<FlirtualMark
				className="absolute right-1 top-0 w-16 origin-[bottom_center] rotate-[14deg] cursor-grab transition-all active:scale-x-110 active:scale-y-90 active:cursor-grabbing group-hocus-within/mark:-top-9"
				onClick={() => {
					squeak();
					const message = flittyMessages[squeakCount / 5];
					if (message)
						toasts.add({
							value: message,
							icon: Cat,
							duration: "long"
						});
					setSqueakCount(squeakCount + 1);
				}}
			/>
			<ButtonLink className="isolate" href={urls.register} kind="primary">
				{t("sign_up")}
			</ButtonLink>
		</div>
	);
};
