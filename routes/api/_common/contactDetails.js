import HTTPError from "modules/server/error.js"
import Config from "modules/config.js"

const contactMethods = ["email", "phone"]
const contactTargets = ["direct", "parents"]

export default async function({user, targetUnit, targetUsers, contactMethod, contactTarget}) {
	contactTarget = Array.create(contactTarget)

	if(!targetUsers.length) {
		throw new HTTPError(400, "Nie wybrano użytkowników")
	}

	if(!contactMethods.includes(contactMethod)) {
		throw new HTTPError(400, "Nieobsługiwana metoda kontaktu")
	}

	if(!contactTarget?.length || !contactTarget.every(t => contactTargets.includes(t))) {
		throw new HTTPError(400, "Nieobsługiwany grupa docelowa")
	}

	await targetUsers.populate("parents")

	const details = []
	for(const targetUser of targetUsers) {
		let parentFound = false
		if(!targetUser[contactMethod] || (contactTarget.includes("parents") && !targetUser.isAdult)) {
			for(const parent of targetUser.parents) {
				// Skip parents who have never logged in
				if(!parent.auth?.lastLogin) continue
				if(!parent[contactMethod]) continue
				details.push(parent[contactMethod])
				parentFound = true
			}
		}
		if(contactTarget.includes("direct") || !parentFound) {
			if(!targetUser[contactMethod]) continue
			details.push(targetUser[contactMethod])
		}
	}

	return {
		userIDs: targetUsers.map(u => u.id),
		details
	}
}