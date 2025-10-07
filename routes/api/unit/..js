import HTTPError from "modules/server/error.js";

export function open({user}) {
	if(!user) throw new HTTPError(403)
}