import HTTPError from "modules/server/error.js"
import * as Text from "modules/text.js"

import User from "modules/schemas/user"

export default async function({user, targetUnit, firstName="", lastName="", org, accessType}) {
	// Check permissions
	await user.requirePermission(targetUnit.PERMISSIONS.CREATE_USER)

	// Create user
	const newUser = new User({
		org
	})

	// Set names
	newUser.name.first = firstName
	newUser.name.last = lastName

	// Validate user
	await newUser.validate()

	// Add user as member
	await targetUnit.addMember(newUser)

	// Create parent
	if(accessType == "newParent") {
		const parent = new User()
		await newUser.addParent(parent)
	}

	this.addRouteData({targetUser: newUser})
	return {
		userID: newUser.id
	}
}