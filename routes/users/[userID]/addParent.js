import html from "modules/html.js"
import Config from "modules/config.js"

export default async function({user, targetUser, action}) {
	// Check for permissions
	await user.requirePermission(targetUser.PERMISSIONS.ADD_PARENT)
	
	// Find users that can be linked as parents
	const users = []
	await user.populate("roles")
	for(const role of user.roles) {
		// Skip roles without "manageSubUnit" tag
		if(!role.hasTag("manageSubUnit")) continue
		await role.populate("unit")
		// Get all members and their parents
		const unitMembers = await Array.fromAsync(role.unit.getSubMembers())
		await unitMembers.populate("parents")
		for(const member of unitMembers) {
			users.push(member)
			users.push(...member.parents)
		}
	}
	// Find other parents of user's children
	await user.populate("children")
	for(const child of user.children) {
		await child.populate("parents")
		users.push(...child.parents)
	}

	// Filter users
	const usersForLinking = []
	for(const user of users) {
		// Skip self
		if(user.id == targetUser.id) continue
		// Skip users which are not adults
		if(user.age !== null && user.age < Config.adultAge) continue
		// Skip users who are already parents of user
		if(targetUser.parents.some(parent => parent.id == user.id)) continue
		// Skip duplicates
		if(usersForLinking.some(u => u.id == user.id)) continue
		// Add user to list
		usersForLinking.push(user)
	}
	await usersForLinking.populate("children")

	// Sort, priorising same last name
	usersForLinking.sort((a, b) => {
		if(!a.name.last || !b.name.last) return 0
		if(!a.name.first || !b.name.first) return 0
		const aSameLastName = (a.name.last == targetUser.name.last) ? 1 : 0
		const bSameLastName = (b.name.last == targetUser.name.last) ? 1 : 0
		if(aSameLastName != bSameLastName) return bSameLastName - aSameLastName
		return a.name.last.localeCompare(b.name.last) || a.name.first.localeCompare(b.name.first)
	})

	return html("user/addParent", {
		user,
		targetUser,
		usersForLinking,
		action
	})
}