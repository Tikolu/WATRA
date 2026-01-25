import User from "modules/schemas/user"
import HTTPError from "modules/server/error.js"
import Config from "modules/config.js"

export async function create({user, targetUser, firstName, lastName}) {
	// Check permissions
	await user.requirePermission(targetUser.PERMISSIONS.ADD_PARENT)
	
	// Create user
	const newUser = new User({
		name: {
			first: firstName,
			last: lastName
		}
	})

	// Add user as parent
	await targetUser.addParent(newUser)

	return {
		userID: newUser.id
	}
}

export async function link({user, targetUser, parentID}) {
	// Check permissions
	await user.requirePermission(targetUser.PERMISSIONS.ADD_PARENT)
	
	// Load parent user
	const parentUser = await User.findById(parentID)

	// Ensure parent exists
	if(!parentUser || parentUser.id == targetUser.id) throw new HTTPError(400, "Rodzic nie istnieje.")
	// Ensure parent is not already linked
	if(targetUser.parents.some(parent => parent.id == parentUser.id)) {
		throw new HTTPError(400, "Podany użytkownik jest już rodzicem tego użytkownika.")
	}
	// Ensure parent is adult
	if(parentUser.age !== null && parentUser.age < Config.adultAge) {
		throw new HTTPError(400, "Podany użytkownik nie jest osobą dorosłą.")
	}
	// Ensure user has permission to link this parent
	await user.requirePermission(parentUser.PERMISSIONS.ADD_AS_PARENT)


	// Add user as parent
	await targetUser.addParent(parentUser)

	return {
		userID: parentUser.id
	}
}