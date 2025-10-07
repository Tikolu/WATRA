import HTTPError from "modules/server/error.js"
import * as Text from "modules/text.js"

import User from "modules/schemas/user"

export default async function({user, targetUnit, firstName="", lastName="", createParent=false}) {
	// Check permissions
	await user.requirePermission(targetUnit.PERMISSIONS.MODIFY)

	// Create user
	const newUser = new User({
		name: {
			first: Text.formatName(firstName),
			last: Text.formatName(lastName)
		}
	})

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