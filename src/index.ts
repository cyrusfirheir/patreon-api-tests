import { Server } from "http";
import * as express from "express";
import * as open from "open";

import { loginOAuthUrl, getOAuthTokens, patreon } from "./patreon-api/apiFetch";
import { Paths } from "./patreon-api/utils";

require("dotenv").config();


const port = process.env.PORT ?? 8000;

const client_id = process.env.CLIENT_ID ?? "";
const client_secret = process.env.CLIENT_SECRET ?? "";

const redirect_uri = `http://localhost:${port}/oauth/redirect`; // has to be the exact same as the redirect uri register in the client - using localhost to test


const app = express();

const server = new Server(app);
server.listen(port, () => {
	console.log(`server running on port ${port}`);
});


const loginUrl = loginOAuthUrl({
	client_id, redirect_uri,
	scope: [
		"identity"
	]
});


// poor man's database
const database: Record<string, {
	id: string;
	access_token: string;
	refresh_token: string;
	expires_in: number;
}> = {};


app.get('/', (req, res) => {
	res.send(`<a href="${loginUrl}">Login with Patreon</a>`);
});

app.get('/oauth/redirect', async (req, res) => {
	const code = req.query.code as string;
	
	try {
		const { access_token, refresh_token, expires_in } = await getOAuthTokens({ code, client_id, client_secret, redirect_uri });

		const currentUser = await patreon({ access_token, version: Paths.v2, endpoint: "identity" });

		// do database stuff here
		const id = currentUser.data.id;
		if (!database[id]) {
			database[id] = {
				id,
				access_token,
				refresh_token,
				expires_in
			};
		}

		// redirect
		res.redirect(`/protected/${currentUser.data.id}`);
	} catch (err) {
		console.error(err);
		res.redirect("/");
	}
});

// handle redirect
app.get('/protected/:id', async (req, res) => {
	const { id } = req.params;

	// load the user from the database
	const user = database[id];
	if (user?.access_token) {
		const { access_token, refresh_token, expires_in } = database[id];
		try {
			const currentUser = await patreon({
				access_token, version: Paths.v2, endpoint: "identity",
				query: {
					include: "memberships.currently_entitled_tiers",
					"fields[user]": [
						"email",
						"full_name"
					],
					"fields[member]": [
						"currently_entitled_amount_cents",
						"last_charge_status",
						"lifetime_support_cents",
						"patron_status",
						"pledge_relationship_start"
					]
				}
			});

			res.send(`<pre><code>${JSON.stringify(currentUser, null, "\t")}</code></pre>`);
		} catch (err) {
			console.error(err);
			return res.redirect('/');
		}
	} else {
		return res.redirect('/');
	}
});


// launch
open(`http://localhost:${port}/`);