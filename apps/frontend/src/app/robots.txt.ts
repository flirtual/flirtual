import { development, preview, siteOrigin } from "~/const";

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

User-Agent: *
${development || preview
	? "Disallow"
	: "Allow"}: /

Host: ${siteOrigin}
Sitemap: ${siteOrigin}/sitemap.xml
`.trim();

export const loader = () => data;
