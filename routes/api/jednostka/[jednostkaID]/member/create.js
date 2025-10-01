import HTTPError from "modules/server/error.js"
import * as Text from "modules/text.js"

import User from "modules/schemas/user"

export default async function({user, targetJednostka, firstName="", lastName="", createParent=false}) {
	// Check permissions
	await user.requirePermission(targetJednostka.PERMISSIONS.MODIFY)

	// Create user
	const newUser = new User({
		name: {
			first: Text.formatName(firstName),
			last: Text.formatName(lastName)
		}
	})

	// Add user as member
	await targetJednostka.addMember(newUser)

	// Create parent
	if(createParent) {
		const parent = new User()
		await newUser.addParent(parent)
	}

	return {
		userID: newUser.id
	}
}