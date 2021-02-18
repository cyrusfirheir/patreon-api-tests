export const baseHost = "https://www.patreon.com";
export const basePath = "api/oauth2";

export enum Paths {
	v1 = "api",
	v2 = "v2",
	token = "token"
}

/** Creates `&` separated query string from input object. Optionally prepending `?` to string. */
export function toQueryString(params: {
	[key: string]: string | string[];
}, query = true): string {
	return (query ? "?" : "") + encodeURI(
		Object.entries(params)
			.map(([key, val]) => `${key}=${typeof val === "string" ? val : toCommaList(val)}`)
			.join("&")
	);
}

/** Creates `,` separated list from input array. */
export function toCommaList(list: string[]): string {
	return list.join(",");
}

