import { development, preview, siteOrigin } from "~/const";
import { locales } from "~/i18n";

const data = `
#              _________________________________________
#   __,_,     |                                         |
#  [_|_/      |   01100110 01101100 01101001 01110010   |
#   ||        |   01110100 01110101 01100001 01101100   |
#   //        |_________________________________________|
# _//    __  /
#(_|)   |@@|
# \\ \\__ \\--/ __
#  \\o__|----|  |   __
#      \\ }{ /\\ )_ / _\\
#      /\\__/\\ \\__O (__
#     (--/\\--)    \\__/
#     _)(  )(_
#    \`---''---\`

# As a condition of accessing this website,
# you agree to abide by the following
# content signals:

# (a)  If a content-signal = yes, you may
# collect content for the corresponding use.
# (b)  If a content-signal = no, you may not
# collect content for the corresponding use.
# (c)  If the website operator does not
# include a content signal for a
# corresponding use, the website operator
# neither grants nor restricts permission
# via content signal with respect to the
# corresponding use.

# The content signals and their meanings
# are:

# search: building a search index and
# providing search results (e.g., returning
# hyperlinks and short excerpts from your
# website's contents).  Search does not
# include providing AI-generated search
# summaries.
# ai-input: inputting content into one or
# more AI models (e.g., retrieval augmented
# generation, grounding, or other real-time
# taking of content for generative AI search
# answers).
# ai-train: training or fine-tuning AI
# models.

# ANY RESTRICTIONS EXPRESSED VIA CONTENT
# SIGNALS ARE EXPRESS RESERVATIONS OF RIGHTS
# UNDER ARTICLE 4 OF THE EUROPEAN UNION
# DIRECTIVE 2019/790 ON COPYRIGHT AND
# RELATED RIGHTS IN THE DIGITAL SINGLE
# MARKET.

${(development || preview)
	? `
User-Agent: *
Content-Signal: ai-train=no, search=no, ai-input=no
Disallow: /
`
	: `
${
	[
		"/*/about",
		"/*/events",
		"/*/guidelines",
		"/*/terms",
		"/*/privacy",
		...locales.map((locale) => `/${locale}`),
	]
		.map((pathname) => `
User-Agent: *
Content-Signal: ${pathname} ai-train=yes, search=yes, ai-input=yes
Allow: ${pathname}
`.trim())
		.join("\n\n")}

${
	locales
		.map((locale) => `
User-Agent: *
Content-Signal: /${locale}/* ai-train=no, search=yes, ai-input=yes
Allow: /${locale}/*
`.trim())
		.join("\n\n")}

User-Agent: *
Content-Signal: ai-train=no, search=yes, ai-input=yes
Allow: /

Host: ${siteOrigin}
`.trim()}`.trim();

export const loader = () => data;
