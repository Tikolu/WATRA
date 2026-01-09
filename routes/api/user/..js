import HTTPError from "modules/server/error.js";

export function _open({user}) {
	if(!user) throw new HTTPError(403)
}