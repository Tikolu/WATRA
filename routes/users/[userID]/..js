import html from "modules/html.js"
import User from "modules/schemas/user"
import HTTPError from "modules/server/error.js"

export async function _open({user, userID}) {
	// Get user from DB, and check if exists
	const targetUser = await User.findById(userID)
	if(!targetUser) throw new HTTPError(404, "Użytkownik nie istnieje")

	await user.requirePermission(targetUser.PERMISSIONS.ACCESS, "Nie masz dostępu do tego użytkownika")

	this.addRouteData({targetUser})
}

export default async function({user, targetUser}) {
	await targetUser.populate({
		"roles": "unit",
		"eventRoles": "unit",
		"eventInvites": {},
		"children": {
			"roles": "unit"
		},
		"parents": {
			"roles": "unit"
		}
	})

	// Check all permissions
	await user.checkPermission(targetUser.PERMISSIONS)
	
	if(user.id == targetUser.id) {
		await targetUser.auth.populate("keys")

		// Check child permissions
		for(const child of targetUser.children) {
			await user.checkPermission(child.PERMISSIONS.APPROVE)
		}
	}

	// Load parents and children if user has access
	const children = [], parents = []
	for(const child of targetUser.children) {
		if(await user.checkPermission(child.PERMISSIONS.ACCESS)) children.push(child)
	}
	for(const parent of targetUser.parents) {
		if(await user.checkPermission(parent.PERMISSIONS.ACCESS)) parents.push(parent)
	}

	// Load roles
	const roles = []
	for(const role of targetUser.roles) {
		if(!user.hasPermission(targetUser.PERMISSIONS.ACCESS_DETAILS) && !role.hasTag("public")) continue
		roles.push(role)
		await role.unit.populate("upperUnits")
	}

	// Process event roles
	const eventRoles = [], eventInvites = []
	for(const role of targetUser.eventRoles) {
		if(!user.hasPermission(targetUser.PERMISSIONS.ACCESS_DETAILS) && !role.hasTag("public")) continue
		if(!await user.checkPermission(role.unit.PERMISSIONS.ACCESS)) continue
		const inviteState = role.unit.participants.id(targetUser.id)?.state
		if(inviteState != "accepted") continue
		eventRoles.push(role)
	}

	if(user.hasPermission(targetUser.PERMISSIONS.ACCESS_DETAILS)) {
		for(const event of targetUser.eventInvites) {
			const inviteState = event.participants.id(targetUser.id)?.state
			// Skip invites in which user has role (will be shown in eventRoles section)
			if(inviteState == "accepted" && targetUser.eventRoles.some(role => role.unit.id == event.id)) continue
			// Skip invites for events which have closed registration and user has declined
			if(event.registrationClosed && inviteState == "declined") continue
			eventInvites.push({event, inviteState})
		}
	}

	// Sort parents and children
	targetUser.parents.sort((a, b) => a.displayName.localeCompare(b.displayName))
	targetUser.children.sort((a, b) => a.displayName.localeCompare(b.displayName))

	return html("user/page/main", {
		user,
		targetUser,
		roles,
		eventRoles,
		eventInvites,
		children,
		parents
	})
}

export {image} from "routes/image.js"