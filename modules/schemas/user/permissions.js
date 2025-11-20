import Config from "modules/config.js"

/** Accessing the user's profile page and any user details */
export async function ACCESS(user) {
	// User can access themselves
	if(user.id == this.id) return true

	// Parent can access their children
	if(user.children.hasID(this.id)) return true

	// Child can access their parents
	if(user.parents.hasID(this.id)) return true

	// Users with "accessUser" role in any unit/upperUnit of user can access
	if(await user.hasRoleInUnits("accessUser", this.getUnitsTree())) return true

	// Users with "accessUser" role in any unit/upperUnit of any child can access parent
	if(this.parent) {
		await this.populate("children")
		for(const child of this.children) {
			if(await user.hasRoleInUnits("accessUser", child.getUnitsTree())) return true
		}
	}

	// Users with "accessUser" role in events in which user is a participant can access
	await this.populate("eventInvites")
	for(const event of this.eventInvites) {
		const invite = event.findUserInvite(this)
		if(invite?.state != "accepted") continue
		if(user.hasRoleInUnits("accessUser", event)) return true
	}

	return false
}

/** Editing user details, such as name, contact details, medical */
export async function EDIT(user) {
	// Lack of ACCESS permission denies EDIT
	if(await user.checkPermission(this.PERMISSIONS.ACCESS, true) === false) return false

	// Users can edit themselves if they are adults or have no set age
	if(user.id == this.id) {
		if(this.age === null) return true
		if(this.age >= Config.adultAge || 0) return true
		// if(this.parents?.length == 0) return true

	// Parent can edit their children
	} else if(user.children.hasID(this.id)) return true

	// Cannot edit a user who has finished setup
	else if(user.profileComplete) return false

	// Users with "manageUser" role in any unit/upperUnit of user can edit
	if(await user.hasRoleInUnits("manageUser", this.getUnitsTree())) return true

	// Users with "manageUser" role in any unit/upperUnit of any child can edit parent
	if(this.parent) {
		await this.populate("children")
		for(const child of this.children) {
			if(await user.hasRoleInUnits("manageUser", child.getUnitsTree())) return true
		}
	}

	return false
}

/** Creating parent users or adding existing users as parents to the user */
export async function ADD_PARENT(user) {
	// Lack of EDIT permission denies ADD_PARENT
	if(await user.checkPermission(this.PERMISSIONS.EDIT, true) === false) return false

	// Cannot add parents to user with existing, incomplete parent profiles
	await this.populate("parents")
	for(const parent of this.parents) {
		if(!parent.profileComplete) return false
	}

	// Cannot add parent to adult
	if(this.age !== null && this.age >= Config.adultAge) return false

	// "manageUser" roles in user's unit or upper units can add parents
	if(await user.hasRoleInUnits("manageUser", this.getUnitsTree())) return true

	// Parents can add other parents
	if(this.parents.hasID(user.id)) return true

	return false
}

/** Deleting the user */
export async function DELETE(user) {
	// Lack of EDIT permission denies DELETE
	if(await user.checkPermission(this.PERMISSIONS.EDIT, true) === false) return false

	// User can never delete themselves
	if(user.id == this.id) return false

	// "deleteUser" roles in user's unit or upper units can add parents
	if(await user.hasRoleInUnits("deleteUser", this.getUnitsTree())) return true

	return false
}

/** Making important / legal decisions for the user */
export async function APPROVE(user) {
	// Lack of EDIT permission denies APPROVE
	if(await user.checkPermission(this.PERMISSIONS.EDIT, true) === false) return false

	// Non-adults, or users without set age cannot approve themselves
	if(user.id == this.id) {
		if(this.age === null) return false
		if(this.age < Config.adultAge) return false
		return true
	}
	
	// Parent can approve their children
	if(user.children.hasID(this.id)) return true

	return false
}

/** Accessing the user's activity log */
export async function ACCESS_ACTIVITY(user) {
	// Lack of ACCESS permission denies ACCESS_ACTIVITY
	if(await user.checkPermission(this.PERMISSIONS.ACCESS, true) === false) return false
	
	// "accessActivity" roles in any unit/upperUnit of user can access
	if(await user.hasRoleInUnits("accessActivity", this.getUnitsTree())) return true
	
	return false
}

/** Generating access code for the user */
export async function GENERATE_ACCESS_CODE(user) {
	// Cannot generate for user with access keys
	if(this.auth.keys.length > 0) return false

	// EDIT permission allows GENERATE_ACCESS_CODE
	if(await user.checkPermission(this.PERMISSIONS.EDIT)) return true

	return false
}