/** Accessing the unit's page and any unit details */
export function ACCESS(user) {
	return true
}

/** Accessing the unit's members */
export async function ACCESS_MEMBERS(user) {
	// "accessUser" roles in this unit or upper units can access members
	if(await user.hasRoleInUnits("accessUser", this, this.getUpperUnitsTree())) return true

	return false
}

/** Editing key unit details, such as name and type, and deleting the unit */
export async function EDIT(user) {
	// Lack of ACCESS permission denies EDIT
	if(await user.checkPermission(this.PERMISSIONS.ACCESS, true) === false) return false

	// "editUnit" roles in this unit can edit
	if(await user.hasRoleInUnits("editUnit", this)) return true

	// "manageSubUnit" roles in upper units can edit
	if(await user.hasRoleInUnits("manageSubUnit", this.getUpperUnitsTree())) return true

	return false
}

/** Creating subUnits or adding existing subUnits to the unit */
export async function ADD_SUBUNIT(user) {
	// Lack of ACCESS permission denies ADD_SUBUNIT
	if(await user.checkPermission(this.PERMISSIONS.ACCESS, true) === false) return false

	// Cannot add subUnits if option list is empty
	if(this.getSubUnitOptions().length == 0) return false

	// "manageSubUnit" roles in this unit or upper units can add subUnits
	if(await user.hasRoleInUnits("manageSubUnit", this, this.getUpperUnitsTree())) return true

	return false
}

/** Accept or decline invites to events */
export async function MANAGE_INVITES(user) {
	// Lack of ACCESS permission denies MANAGE_INVITES
	if(await user.checkPermission(this.PERMISSIONS.ACCESS, true) === false) return false

	// "manageEventInvite" roles in this unit or upper units can create new users
	if(await user.hasRoleInUnits("manageEventInvite", this, this.getUpperUnitsTree())) return true

	return false
}

/** Creating events within a unit */
export async function CREATE_EVENT(user) {
	// Lack of ACCESS permission denies CREATE_EVENT
	if(await user.checkPermission(this.PERMISSIONS.ACCESS, true) === false) return false

	// Cannot create event in unit without "create" eventRule
	if(!this.config.eventRules.create) return false

	// "createEvent" roles in this unit or upper units can create new users
	if(await user.hasRoleInUnits("manageEvent", this, this.getUpperUnitsTree())) return true

	return false
}

/** Creating users in the unit */
export async function CREATE_USER(user) {
	// Lack of ACCESS permission denies CREATE_USER
	if(await user.checkPermission(this.PERMISSIONS.ACCESS, true) === false) return false

	// Cannot create users in a unit without a configured defaultRole
	if(!this.config.defaultRole) return false

	// "manageUser" roles in this unit or upper units can create new users
	if(await user.hasRoleInUnits("manageUser", this, this.getUpperUnitsTree())) return true

	return false
}

/** Setting roles of users within the unit */
export async function SET_ROLE(user) {
	// Lack of ACCESS permission denies SET_ROLE
	if(await user.checkPermission(this.PERMISSIONS.ACCESS, true) === false) return false

	// "setRole" roles in this unit or upper units can set roles
	if(await user.hasRoleInUnits("setRole", this, this.getUpperUnitsTree())) return true

	return false
}