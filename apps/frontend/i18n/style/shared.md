# Flirtual translation style guide

Read this together with your locale's file (`<locale>.md`) and `glossary.json`. Where they
disagree, the locale file wins. Items marked **provisional** are the maintainer's decisions
awaiting a native reviewer; **proposed** items are unconfirmed suggestions. Follow both until
they change.

## What Flirtual is

A dating and friend-finding app for people who meet in virtual reality (VRChat and other social
VR apps). Users are adults (18+), mostly gamers and VR enthusiasts, many of them LGBTQ+. It runs
on the web, iOS, Android, 2D apps for XR headsets, and Apple Watch.

Two modes, each with its own queue:

- **Date Mode** (pink): dating of every kind, long-term to casual. Never describe it as
  serious-relationships-only or as casual-hookups-only. The action is **Like**.
- **Homie Mode** (green): finding friends. The action is **Homie**. If one person Likes and the
  other Homies, it's still a match (as friends).

## Voice

Friendly, warm, a little playful, never corporate or salesy. Talk to the user the way a kind
friend who works at the app would. Short sentences. Be direct about safety and rules without
sounding cold.

Match the register in your locale file: informal for the app, emails and push; formal for ban,
warning and other moderation notices; your language's usual legal style for legal pages.

## Write like a native app, not a translation

The most important rule. Read your draft as a native speaker would see it in an app from their
own country.

- Don't copy English sentence structure. Restructure freely; keep the meaning, not the shape.
- Don't add pronouns English needs but your language doesn't (drop "you"/"I"/"your" where a
  native app would).
- Use loanwords only where native apps actually use them (profile, account, login are usually
  fine). Never transliterate a word just because it was English.
- Rewrite idioms, puns and jokes for your culture instead of translating them literally.
- Prefer the wording people already know from popular apps in your market.
- Consistency beats variety: the same UI concept gets the same word on every screen.

## Strings and context

Every key comes with context notes (`context.json`): where it appears, what kind of UI element
it is, what placeholders mean, and length limits. Many keys have meaningless random names
(`that_active_seal_nail`); never infer meaning from the key name.

- **Fragments:** some strings are concatenated or fill a slot in another string. The context
  says so; keep them grammatical in that slot.
- **Buttons, tabs, labels, titles, badges:** keep them about as short as the English. Respect any
  `maxLength`. Buttons are verbs or short noun phrases, never full sentences.
- **Errors:** say what happened and what to do, calmly. No blame.
- **Toasts and notices:** short and clear.
- **Emails and push:** the first words matter most (they show in previews).

## Placeholders, tags and ICU

Strings are ICU MessageFormat, rendered with i18next.

- Keep every `{placeholder}` exactly as written, and never translate its name. You may move it.
- Keep every `<tag>…</tag>` and `<tag/>`, with the same names. Move them to wrap the matching
  words in your sentence.
- `{count, plural, …}`: write every plural category your language needs (see your locale file)
  and only those; keep `other`. `#` is the number. `=0`/`=1` exact cases may stay.
- `{x, select, …}`: keep every option key exactly as in English; translate only the text.
- An apostrophe `'` right before `{` or `<` starts an ICU escape and hides the placeholder.
  Write `’` (typographic) instead, e.g. French `l’{name}`, or rephrase.
- Notification strings (`notifications:*`) are gettext: placeholders are `%{name}`; keep HTML
  tags and attributes exactly.
- **Watch strings** (marked `watch`): the Apple Watch only fills `{name}` and empty `<name/>`
  tags. No plural, select, number or date formatting in these, even if your grammar wants it;
  find wording that works for any value.

## Terminology

`glossary.json` is binding. Highlights:

- **Flirtual, Flitty, VRChat, Meta Quest, Discord, Steam** and other platform and product
  names: Latin script, never translated or transliterated.
- **Premium:** unchanged in Latin-script locales; ja プレミアム, ko 프리미엄, ru keeps "Premium" as
  the product name.
- **Homie:** never keep the English word and never transliterate it. Each locale has a warm,
  casual, gender-neutral word for "friend" that works as a button, a mode name and a noun.
- **NSFW** has two senses:
  1. The opt-in adult feature (kink and dom/sub tags and settings). Keep "NSFW"/"SFW", except
     ja (R-18 / 全年齢) and ko (19금 / 전체이용가).
  2. Explicit sexual content or nudity that isn't allowed (rules, moderation). Use wording a
     non-internet-savvy reader can't misread; a descriptive phrase ("nudity or explicit sexual
     content") is fine. Never use the feature term (R-18, 19금) for this sense.
- **VRChat world names** ("Flirtual Speed Dating", "The Flirtual Club"): keep in English exactly
  as they appear in VRChat; the sentence around them can explain.
- **Pronoun genders** (She/Her, He/Him, They/Them): use the local convention where one exists
  (see your locale file); ja/ko keep the English forms. Non-binary forms are provisional.
- **Kink "Boy/Girl":** keep in English everywhere. It's a consensual adult roleplay role; never
  use words for actual children.
- **Game titles:** keep official titles; use a localized title only when the game is sold
  under one in your market.

## People and inclusivity

Users are of every gender. Phrase strings so they don't need gender agreement with the user
or with other users (rephrase, use verbs or neutral nouns) instead of adding slashes or
inclusive-writing symbols, unless your locale file says otherwise.

## Playful copy

Flitty's lines, loading-screen jokes, cat facts and the April Fools features are there for fun.

- Adapt jokes so they're funny in your language; a new pun is welcome. If a joke can't land,
  write a light, warm line on the same topic instead of a confusing literal one.
- Keep cat facts factually accurate.
- Keep numbers that count Flitty clicks, and names (Tulip, Mochi, VRLFP).

## Legal pages

Terms of Service, Privacy Policy, Community Guidelines and payment terms are translated
faithfully and completely in your language's usual legal style (often third person: "the
user"). A banner (already in the app) says the English version governs. Don't simplify or
summarize legal text, and keep defined terms consistent within each page.

## Never

- Use an unreviewed machine translation as a style reference.
- Change meaning to make a sentence flow. Flag it instead.
- Add content (emoji, exclamation marks, explanations) the English doesn't have, except where
  your locale file asks for it.
