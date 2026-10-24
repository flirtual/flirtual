# Japanese (ja)

Everything in this file is **provisional** until a native Japanese reviewer confirms it.

The existing `ja.json` is unreviewed machine output that reads as literal translationese. Don't
use it as a style reference.

## Register

- App, emails, push: polite です/ます, friendly and light, the way popular Japanese dating and
  social apps talk. Not stiff keigo, not slangy.
- Flitty, the cat mascot (all 101 homepage lines, `homepage/flitty`): a casual cat voice
  (〜だよ, 〜なんだ, 〜でしょ), consistently across every line. Only Flitty talks like this.
- Ban, warning and moderation notices: polite and clear, a little more formal (です/ます,
  お手数ですが where natural). Never accusatory.
- Legal pages: standard Japanese terms-of-service style (である調 or です/ます as Japanese legal
  pages usually use), "利用者" / "ユーザー" in third person.
- Other users: `{name}さん`. Never 様 for users, never bare `{name}`.
- Drop あなた/私 wherever a native app would. 「あなたのプロフィール」 → 「プロフィール」.

## Typography

- Full-width punctuation: 、。！？「」（）・……
- Half-width digits and Latin letters.
- No space between Japanese and Latin text or numbers: 「VRChatでマッチング」「3人」.
- Quote UI labels and names with 「」.
- Ellipsis: …… (two characters), wherever the English has … .
- Don't end buttons, labels or titles with 。.

## Terminology

| English | Japanese | Notes |
|---|---|---|
| dating app | マッチングアプリ | never 出会い系, デーティングアプリ |
| match (noun/verb) | マッチング | 「マッチングしました」 |
| matchmaking | マッチング | never マッチメイキング |
| Like (button) | いいね | |
| Homie (button) | 友達 | 「友達申請を送る」「{name}さんが友達になりたがっています」 |
| Homie Mode | 友活モード | never ホーミー (throat singing) |
| Homies (tab, list) | 友活 | short form of 友活モード; pairs with 恋活 |
| Date Mode | 恋活モード | pairs with 友活モード; when explaining it, keep it broad (dating of any kind), neither relationship-only nor hookup-only. Never デートモード |
| Dates (tab) | 恋活 | short form of 恋活モード; pairs with 友活 |
| Pass (button) | スキップ | |
| bio | 自己紹介 | never バイオ |
| profile prompts | 質問 / お題 | never プロンプト |
| tap / click | タップ | never クリック |
| NSFW (adult feature) | R-18 | R-18タグ, R-18設定 |
| SFW | 全年齢 | |
| NSFW (disallowed content) | 裸や露骨な性的表現 | never R-18 in rules or moderation text |
| Premium | プレミアム | プレミアム会員 for subscribers |
| profile, account, login | プロフィール, アカウント, ログイン | fine as loanwords |
| Pronouns She/Her etc. | keep English | |

Use the mode names consistently everywhere, including news and help copy.

## Watch

Time differences on the Apple Watch (`time_diff_h`, `time_diff_hm`): 時間/分 (「+5時間30分」) if it
fits the watch layout, otherwise a compact clock style (「+5:30」). Never an "h" abbreviation.

## Avoid translationese

- Restructure sentences; Japanese UI is often shorter and more implicit than English.
- No literal pronouns, no 「〜することができます」 where 「〜できます」 works.
- Don't over-use katakana. If a native app would write it in kanji or hiragana, do that.
- Rewrite jokes and puns with Japanese wordplay, or make them a light line that works in
  Japanese. A literal translation of a pun is always wrong.
- "The Flirtual Team" signature: 「Flirtualチーム」 or 「Flirtual運営チーム」. Never 浮気 (cheating).

## Plurals

Japanese has one plural category: `other`. For `{count, plural, …}` write only `other` (exact
`=0`/`=1` cases may stay). Counters: 人, 件, 枚, 回, etc. as natural.
