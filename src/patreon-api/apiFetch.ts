import { fetch } from "cross-fetch";
import { baseHost, basePath, Paths, toQueryString, toCommaList } from "./utils";


export function loginOAuthUrl({ client_id, redirect_uri, scope, state }: {
	client_id: string;
	redirect_uri: string;
	scope?: string[];
	state?: string;
}) {
	const params: {
		[key: string]: string;
	} = {
		response_type: "code",
		client_id, redirect_uri
	};

	if (scope) params.scope = toCommaList(scope);
	if (state) params.state = state;

	return [
		baseHost, "oauth2/authorize",
		toQueryString(params)
	].join("/");
}


export interface OAuthTokens {
	access_token: string;
	expires_in: number;
	refresh_token: string;
	scope: string;
	token_type: string;
}

export async function getOAuthTokens({ code, client_id, client_secret, redirect_uri }: {
	code: string;
	client_id: string;
	client_secret: string;
	redirect_uri: string;
}) {
	const params = {
		grant_type: "authorization_code",
		code, client_id, client_secret, redirect_uri
	};

	const tokens = await fetch([
		baseHost, basePath, Paths.token
	].join("/"), {
		method: "POST",
		headers: {
			"Content-type": "application/x-www-form-urlencoded"
		},
		body: toQueryString(params, false)
	});
	
	if (tokens.ok) return tokens.json() as Promise<OAuthTokens>;
	else throw new Error(tokens.statusText);
}


export async function patreon({ access_token, version, endpoint, query }: {
	access_token: string;
	version: Paths.v1 | Paths.v2;
	endpoint: string;
	query?: {
		[key: string]: string | string[];
	}
}) {
	const apiReturn = await fetch([
		baseHost, basePath, version, endpoint
	].join("/") + (query ? toQueryString(query) : ""), {
		headers: {
			Authorization: `Bearer ${access_token}`
		}
	});

	if (apiReturn.ok) return apiReturn.json();
	else throw new Error(apiReturn.statusText);
}