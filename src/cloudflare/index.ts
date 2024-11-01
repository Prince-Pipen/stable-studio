/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

interface Env {
	MailLiteApiKey: string;
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const cookies = request.headers.get("cookie")?.split("; ") ?? [];
		const langCookie = cookies.find((cookie) => cookie.startsWith("lang="));
		const lang: string | undefined = langCookie?.split("=", 2)[1];
		
		const city = request.cf?.city || request.cf?.region || null;
		const country = request.cf?.country || null;
		const timezone = request.cf?.timezone || null;

		const origin = request.headers.get("origin");
		const headers = {
			"content-type": "application/json",
			"Access-Control-Allow-Origin": origin?.startsWith("http://localhost")
				? origin
				: "https://stablestudio.org",
			"Access-Control-Allow-Methods": "POST,OPTIONS",
			"Access-Control-Allow-Credentials": "true",
			"Access-Control-Max-Age": "86400",
		};
		async function handleOptions(request: Request) {
			if (
				origin !== null &&
				request.headers.get("Access-Control-Request-Method") !== null &&
				request.headers.get("Access-Control-Request-Headers") !== null
			) {
				// Handle CORS preflight requests.
				return new Response(null, {
					headers: {
						...headers,
						"Access-Control-Allow-Headers": request.headers.get(
							"Access-Control-Request-Headers",
						)!,
					},
				});
			} else {
				// Handle standard OPTIONS request.
				return new Response(null, {
					headers: {
						Allow: "POST, OPTIONS",
					},
				});
			}
		}

		let response = {
			success: false,
			message: "Unknown error",
		};
		if (!env.MailLiteApiKey) {
			response.message = "Internal error";
			return new Response(JSON.stringify(response), {
				status: 500,
				headers,
			});
		}
		const method = request.method;
		const contentType = request.headers.get("content-type");
		const ua = request.headers.get("user-agent");
		const referer = request.headers.get("referer");

		console.log({ ua, referer, city, country, timezone });

		if (request.method === "OPTIONS") {
			// Handle CORS preflight requests
			return handleOptions(request);
		}
		if (method !== "POST") {
			response.message = "Invalid method";
			return new Response(JSON.stringify(response), {
				status: 400,
				headers,
			});
		}
		if (contentType !== "application/json") {
			response.message = "Invalid content type";
			return new Response(JSON.stringify(response), {
				status: 400,
				headers,
			});
		}
		if (origin?.startsWith("http://localhost"))
			return new Response("ok", { headers, status: 201 });
		if (!ua?.includes("Mozilla") || !referer?.includes("stablestudio.org")) {
			response.message = "Invalid request";
			return new Response(JSON.stringify(response), {
				status: 403,
				headers,
			});
		}
		try {
			const body = (await request.json()) as {
				email: string;
				name: string;
				enquiry: string;
			};
			if (!body.email || !body.name || !body.enquiry) {
				response.message = "Invalid Data";
				return new Response(JSON.stringify(response), {
					status: 400,
					headers,
				});
			}
			const res = await fetch(
				"https://connect.mailerlite.com/api/subscribers",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
						Authorization: `Bearer ${env.MailLiteApiKey}`,
					},
					body: JSON.stringify({
						email: body.email,
						fields: {
							name: body.name,
							enquirymessage: body.enquiry,
							city,
							country,
							timezone,
							lang: lang || "en",
						},
						groups: ["135355636160399051"],
					}),
				},
			);
			return res;
		} catch (e) {
			response.message = "Internal error";
			return new Response(JSON.stringify(response), {
				status: 500,
				headers,
			});
		}
	},
} satisfies ExportedHandler<Env>;
