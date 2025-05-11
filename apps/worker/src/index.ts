import * as jose from "jose"

const secret = jose.base64url.decode("...")
const cookieMetadata = "Domain=flirtual.com; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=7776000";

export default {
  async fetch(request, env) {
    const { origin, pathname, href, searchParams } = new URL(request.url);

    if (origin === "https://flirtual.com") {
      const cookie = request.headers.get("cookie");
      const transferToken = searchParams.get("transfer-token");

      // complete the transfer, we've received the token.
      if (transferToken) {
        const { payload } = await jose.jwtDecrypt(transferToken, secret);

        const url = new URL(href);
        url.searchParams.delete("transfer-token");
        
        const cookies = ((payload.cookie as string | null) ?? "")
          .split("; ")
          .filter(Boolean)
          .map((cookie) => cookie.split("=")) as Array<[key: string, value:string]>;

        const headers = new Headers([
          ["location", url.href],
          ["set-cookie", `transfer-complete=true; ${cookieMetadata}`],
          ...cookies.map(([key, value]) => [`set-cookie`, `${key}=${value}; ${cookieMetadata}`])
        ])

        return new Response(null, {
          status: 302,
          headers
        });
      }

      // start the transfer.
      if (!cookie) {
        const query = new URLSearchParams({ to: href });
        return Response.redirect(`https://flirtu.al/~transfer?${query}`, 302);
      }
    }
    
    if (origin === "https://flirtu.al" && pathname === "/~transfer") {  
      const cookie = request.headers.get("cookie");
      const to = searchParams.get("to")!;
      
      const token = await new jose.EncryptJWT({ cookie })
        .setProtectedHeader({ alg: "dir", enc: "A128CBC-HS256" })
        .setIssuedAt()
        .setExpirationTime("1h")
        .encrypt(secret);

      const url = new URL(to);
      url.searchParams.set("transfer-token", token);

      return Response.redirect(url.href, 302);
    }

    return fetch(request);
  },
} satisfies ExportedHandler<Env>;
