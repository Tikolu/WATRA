import HTTPError from "modules/server/error.js"
import User from "modules/schemas/user"

export async function _open({userIDs}) {
	const users = Array.create(userIDs).unique()
	
	if(!users.length) {
		throw new HTTPError(400, "Nie wybrano użytkowników")
	}

	await users.populate({}, {
		ref: "User",
		placeholder: new HTTPError(404, "Nie znaleziono użytkownika")	
	})

	this.addRouteData({targetUsers: users})
}

export function _exit({user, targetUsers}) {
	return {
		userIDs: targetUsers.map(u => u.id),
		...this.lastOutput
	}
}