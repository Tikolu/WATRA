import { RoleType } from "modules/types.js"

export async function ACCESS(user) {
	// User can access themselves
	if(user.id == this.id) return true

	// Parent can access their children
	if(user.children.hasID(this.id)) return true

	// Child can access their parents
	if(user.parents.hasID(this.id)) return true

	// Przyboczni of member unit and of all upper units can access
	if(await user.hasRoleInUnits(f => f >= RoleType.PRZYBOCZNY, this.getUnitsTree())) return true

	// Kadra of event can access
	await this.populate("eventInvites")
	for(const event of this.eventInvites) {
		const invite = event.findUserInvite(this)
		if(invite?.state != "accepted") continue
		if(user.hasRoleInUnits(f => f >= RoleType.PRZYBOCZNY, event)) return true
	}

	// Przyboczni of child's member unit and of all upper units can access
	await this.populate("children")
	for(const child of this.children) {
		if(await user.hasRoleInUnits(f => f >= RoleType.PRZYBOCZNY, child.getUnitsTree())) return true
	}

	return false
}

export async function MODIFY(user) {
	if(!await user.checkPermission(this.PERMISSIONS.ACCESS)) return false
	// Niepełnoletni with parents cannot modify their own details
	if(user.id == this.id) {
		if(this.age && this.age < 18 && this.parents?.length > 0) return false
		return true
	}
	// Parent can modify their children
	if(user.children.hasID(this.id)) return true
	// Druyżynowi of member unit and of all upper units can modify
	if(await user.hasRoleInUnits(RoleType.DRUŻYNOWY, this.getUnitsTree())) return true
	// Druyżynowi of child's member unit and of all upper units can modify
	if(this.isParent) {
		await this.populate("children")
		for(const child of this.children) {
			if(await user.hasRoleInUnits(RoleType.DRUŻYNOWY, child.getUnitsTree())) return true
		}
	}
	return false
}

export async function ADD_PARENT(user) {
	// Cannot add parent to adult
	if(this.age && this.age >= 18) return false
	
	// Druyżynowi of member unit and of all upper units can add parents
	if(await user.hasRoleInUnits(RoleType.DRUŻYNOWY, this.getUnitsTree())) return true

	return false
}

export async function DELETE(user) {
	// User can never delete themselves
	if(user.id == this.id) return false
	// A parent of a user which can be deleted can also be deleted
	await this.populate("children")
	for(const child of this.children) {
		if(await user.checkPermission(child.PERMISSIONS.DELETE)) return true
	}
	// Druyżynowi of member unit and of all upper units can delete
	if(await user.hasRoleInUnits(RoleType.DRUŻYNOWY, this.getUnitsTree())) return true
	return false
}

export async function APPROVE(user) {
	if(!await user.checkPermission(this.PERMISSIONS.ACCESS)) return false
	// Niepełnoletni cannot approve themselves
	if(user.id == this.id) {
		if(this.age && this.age < 18) return false
		return true
	}
	// Parent can approve their children
	if(user.children.hasID(this.id)) return true
}