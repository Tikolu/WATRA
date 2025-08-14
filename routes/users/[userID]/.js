import HTTPError from "modules/server/error.js"
import User from "modules/schemas/user.js"
import html from "modules/html.js"

export default async function({user, targetUser}) {
	// Populate funkcje, and jednostki of funkcje
	await targetUser.populate({
		"funkcje": "jednostka",
		"funkcjeWyjazdowe": "jednostka"
	})

	// Populate parents or children
	await targetUser.populate(targetUser.isParent ? "children" : "parents")

	// Check permissions
	await user.requirePermission(targetUser.PERMISSIONS.ACCESS)
	if(await user.checkPermission(targetUser.PERMISSIONS.MODIFY)) {
		await user.checkPermission(targetUser.PERMISSIONS.DELETE)
		await user.checkPermission(targetUser.PERMISSIONS.ADD_PARENT)
	}
	
	// Load wyjazd invites
	if(await user.checkPermission(targetUser.PERMISSIONS.APPROVE)) {
		await targetUser.populate("wyjazdInvites")
	}
	

	return html("user/page", {user, targetUser})
}