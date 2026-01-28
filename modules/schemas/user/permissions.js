import Config from "modules/config.js"

/** Accessing the user's profile page and any user details */
export async function ACCESS(user) {
	// User can access themselves
	if(user.id == this.id) return true
	
	// Block access if user has no passkeys
	if(Config.passkeyRequired && user.auth.keys.length == 0) return false

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
		const invite = event.participants.id(this.id)
		if(invite?.state != "accepted") continue
		if(await user.hasRoleInUnits("accessUser", event)) return true
	}

	// Parent can access other parents of their children
	for(const child of this.children) {
		if(user.children.hasID(child.id)) return true
	}

	return false
}

export async function MANAGE(user) {
	// Users with "manageUser" role in any unit/upperUnit of user can manage
	for await(const unit of this.getUnitsTree()) {
		// Get user's role in unit
		const userRole = await user.getRoleInUnit(unit)
		if(!userRole || !userRole.hasTag("manageUser")) continue
		// Get target user's role in unit
		const targetUserRole = await this.getRoleInUnit(unit)
		// Skip if target user has higher role
		if(userRole.config.rank < (targetUserRole?.config.rank || 0)) continue

		return true
	}
	
	return false
}

/** Editing user details, such as name, contact details, medical */
export async function EDIT(user) {
	// Lack of ACCESS permission denies EDIT
	if(await user.checkPermission(this.PERMISSIONS.ACCESS, true) === false) return false

	// Cannot edit a user with confirmed profile
	if(this.confirmed) return false

	// Cannot edit parent of confirmed child
	await this.populate("children")
	for(const child of this.children) {
		if(child.confirmed) return false
	}

	// Users can edit themselves if they are adults or have no set age
	if(user.id == this.id) {
		if(this.age === null) return true
		if(this.age >= Config.adultAge || 0) return true
		// if(this.parents?.length == 0) return true

	// Parent can edit their children
	} else if(user.children.hasID(this.id)) return true

	// Parent can edit other parents of their children
	for(const child of this.children) {
		if(user.children.hasID(child.id)) return true
	}

	// MANAGE permission grants EDIT
	if(await user.checkPermission(this.PERMISSIONS.MANAGE)) return true

	// MANAGE permission of any child can edit parent
	if(this.parent) {
		await this.populate("children")
		for(const child of this.children) {
			if(await user.checkPermission(child.PERMISSIONS.MANAGE)) return true
		}
	}

	return false
}

/** Creating parent users or adding existing users as parents to the user */
export async function ADD_PARENT(user) {
	// Lack of ACCESS permission denies ADD_PARENT
	if(await user.checkPermission(this.PERMISSIONS.ACCESS, true) === false) return false

	// Block adding parent if user has no passkeys
	if(Config.passkeyRequired && user.auth.keys.length == 0) return false

	// Non-adults cannot add parents to themselves
	if(user.id == this.id && this.age !== null && this.age < Config.adultAge) return false

	// Cannot add parent to confirmed user
	if(this.confirmed) return false

	// MANAGE permission grants ADD_PARENT
	if(await user.checkPermission(this.PERMISSIONS.MANAGE)) return true

	// Cannot add parents to user with existing, incomplete parent profiles
	await this.populate("parents")
	for(const parent of this.parents) {
		if(!parent.profileComplete) return false
	}

	// Cannot add parent to adult
	if(this.age !== null && this.age >= Config.adultAge) return false

	// Parents can add other parents
	if(this.parents.hasID(user.id)) return true

	return false
}

/** Deleting the user */
export async function DELETE(user) {
	// Lack of ACCESS permission denies DELETE
	if(await user.checkPermission(this.PERMISSIONS.ACCESS, true) === false) return false

	// User can never delete themselves
	if(user.id == this.id) return false

	// Parent can delete other parents of their children, unless they have previously signed in, or have roles
	if(!this.auth.lastLogin && this.roles.length == 0) {
		await this.populate("children")
		for(const child of this.children) {
			if(user.children.hasID(child.id)) return true
			// Users with MANAGE permission of any child can delete parent, if they have no set name
			if(await user.checkPermission(child.PERMISSIONS.MANAGE) && !this.name.first && !this.name.last) {
				return true
			}
		}
	}

	// "deleteUser" roles in user's unit or upper units can delete
	if(await user.hasRoleInUnits("deleteUser", this.getUnitsTree())) return true

	return false
}

/** Making important / legal decisions for the user */
export async function APPROVE(user) {
	// Lack of ACCESS permission denies APPROVE
	if(await user.checkPermission(this.PERMISSIONS.ACCESS, true) === false) return false

	if(user.id == this.id) {
		// Users without set age cannot approve themselves
		if(this.age === null) return false
		// Non-adults cannot approve themselves
		if(this.age < Config.adultAge) return false
		// Users without roles cannot approve themselves
		if(this.roles.length == 0) return false
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
	// Lack of ACCESS permission denies GENERATE_ACCESS_CODE
	if(await user.checkPermission(this.PERMISSIONS.ACCESS, true) === false) return false
	
	// Cannot generate for user with access keys
	if(this.auth.keys.length > 0) return false

	// Otherwise, can generate for themselves
	else if(user.id == this.id) return true

	// Parent can generate for their children
	if(user.children.hasID(this.id)) return true

	// MANAGE permission grants GENERATE_ACCESS_CODE
	if(await user.checkPermission(this.PERMISSIONS.MANAGE)) return true

	// User with MANAGE permission of any child can generate for parent
	if(this.parent) {
		await this.populate("children")
		for(const child of this.children) {
			if(await user.checkPermission(child.PERMISSIONS.MANAGE)) return true
		}
	}
	
	return false
}

/** Adding the user as a parent to another user */
export async function ADD_AS_PARENT(user) {
	// Lack of ACCESS permission denies ADD_AS_PARENT
	if(await user.checkPermission(this.PERMISSIONS.ACCESS, true) === false) return false

	// Non-adults cannot be added as parents
	if(this.age !== null && this.age < Config.adultAge) return false

	// Can add other parents of their children
	await this.populate("children")
	for(const child of this.children) {
		if(user.children.hasID(child.id)) return true
	}

	// MANAGE permission grants ADD_AS_PARENT
	if(await user.checkPermission(this.PERMISSIONS.MANAGE)) return true

	// User with MANAGE permission of any child can add parent as parent
	if(this.parent) {
		await this.populate("children")
		for(const child of this.children) {
			if(await user.checkPermission(child.PERMISSIONS.MANAGE)) return true
		}
	}

	return false
}