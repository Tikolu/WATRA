import HTTPError from "modules/server/error.js"
import * as Text from "modules/text.js"

import User from "modules/schemas/user"

export default async function({user, targetUnit, firstName="", lastName="", createParent=false}) {
	// Check permissions
	await user.requirePermission(targetUnit.PERMISSIONS.CREATE_USER)

	// Create user
	const newUser = new User()

	// Set names
	newUser.name.first = firstName
	newUser.name.last = lastName

	// Add user as member
	await targetUnit.addMember(newUser)

	// Create parent
	if(createParent) {
		const parent = new User()
		await newUser.addParent(parent)
	}

	return {
		userID: newUser.id
	}
}