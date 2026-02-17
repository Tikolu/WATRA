import Config from "modules/config.js"

/** Accessing the unit's page and any unit details */
export function ACCESS(user) {
	// Block access from archived users
	if(user.archived) return false

	// Block access if user has no passkeys
	if(Config.passkeyRequired && user.auth.keys.length == 0) return false

	return true
}

/** Accessing the unit's members */
export async function ACCESS_MEMBERS(user) {
	// Lack of ACCESS permission denies EDIT
	if(await user.checkPermission(this.PERMISSIONS.ACCESS, true) === false) return false

	// "accessUser" roles in this unit or upper units can access members
	if(await user.hasRoleInUnits("accessUser", this.traverse("upperUnits", {includeSelf: true}))) return true

	return false
}

/** Accessing archived members */
export async function ACCESS_ARCHIVED_MEMBERS(user) {
	// Lack of ACCESS_MEMBERS permission denies ACCESS_ARCHIVED_MEMBERS
	if(await user.checkPermission(this.PERMISSIONS.ACCESS_MEMBERS, true) === false) return false

	// "manageUser" roles in this unit or upper units can access archived members
	if(await user.hasRoleInUnits("manageUser", this.traverse("upperUnits", {includeSelf: true}))) return true

	return false
}

/** Editing key unit details, such as name and type, and deleting the unit */
export async function EDIT(user) {
	// Lack of ACCESS permission denies EDIT
	if(await user.checkPermission(this.PERMISSIONS.ACCESS, true) === false) return false

	// "editUnit" roles in this unit can edit
	if(await user.hasRoleInUnits("editUnit", this)) return true

	// "manageSubUnit" roles in upper units can edit
	if(await user.hasRoleInUnits("manageSubUnit", this.traverse("upperUnits"))) return true

	return false
}

/** Creating subUnits or adding existing subUnits to the unit */
export async function ADD_SUBUNIT(user) {
	// Lack of ACCESS permission denies ADD_SUBUNIT
	if(await user.checkPermission(this.PERMISSIONS.ACCESS, true) === false) return false

	// Cannot add subUnits if option list is empty
	if(this.getSubUnitOptions().length == 0) return false

	// "manageSubUnit" roles in this unit or upper units can add subUnits
	if(await user.hasRoleInUnits("manageSubUnit", this.traverse("upperUnits", {includeSelf: true}))) return true

	return false
}

/** Accept or decline invites to events */
export async function MANAGE_INVITES(user) {
	// Lack of ACCESS permission denies MANAGE_INVITES
	if(await user.checkPermission(this.PERMISSIONS.ACCESS, true) === false) return false

	// Cannot manage invites in unit without "invite" eventRule
	if(!this.config.eventRules.invite) return false

	// "manageEventInvite" roles in this unit or upper units can manage invites
	if(await user.hasRoleInUnits("manageEventInvite", this.traverse("upperUnits", {includeSelf: true}))) return true

	return false
}

/** Accessing the unit's activity log */
export async function ACCESS_ACTIVITY(user) {
	// Lack of ACCESS permission denies ACCESS_ACTIVITY
	if(await user.checkPermission(this.PERMISSIONS.ACCESS, true) === false) return false

	// "accessActivity" roles in this unit or upper units can access activity log
	if(await user.hasRoleInUnits("accessActivity", this.traverse("upperUnits", {includeSelf: true}))) return true

	return false
}

/** Displaying events of a unit (and subUnits) */
export async function ACCESS_EVENTS(user) {
	// Lack of ACCESS permission denies CREATE_EVENT
	if(await user.checkPermission(this.PERMISSIONS.ACCESS, true) === false) return false

	// CREATE_EVENT permission implies ACCESS_EVENTS
	if(await user.checkPermission(this.PERMISSIONS.CREATE_EVENT, true)) return true

	// MANAGE_INVITES permission implies ACCESS_EVENTS
	if(await user.checkPermission(this.PERMISSIONS.MANAGE_INVITES, true)) return true
	
	// "manageEvent" roles in this unit and upper units can access events
	if(await user.hasRoleInUnits("manageEvent", this.traverse("upperUnits", {includeSelf: true}))) return true

	return false
}

/** Creating events within a unit */
export async function CREATE_EVENT(user) {
	// Lack of ACCESS permission denies CREATE_EVENT
	if(await user.checkPermission(this.PERMISSIONS.ACCESS, true) === false) return false

	// Cannot create event in unit without "create" eventRule
	if(!this.config.eventRules.create) return false

	// "manageEvent" roles in this unit and upper units can create events
	if(await user.hasRoleInUnits("manageEvent", this.traverse("upperUnits", {includeSelf: true}))) return true

	return false
}

/** Creating users in the unit */
export async function CREATE_USER(user) {
	// Lack of ACCESS permission denies CREATE_USER
	if(await user.checkPermission(this.PERMISSIONS.ACCESS, true) === false) return false

	// Cannot create users in a unit without a configured defaultRole
	if(!this.config.defaultRole) return false

	// "manageUser" roles in this unit or upper units can create new users
	if(await user.hasRoleInUnits("manageUser", this.traverse("upperUnits", {includeSelf: true}))) return true

	return false
}

/** Setting roles of users within the unit */
export async function SET_ROLE(user) {
	// Lack of ACCESS permission denies SET_ROLE
	if(await user.checkPermission(this.PERMISSIONS.ACCESS, true) === false) return false

	// Cannot set role if unit has no configured roles
	if(!this.config.roles?.length) return false

	// Cannot set role if unit has no members and no subUnits
	if(this.roles.length == 0 && this.subUnits.length == 0) return false

	// "setRole" roles in this unit or upper units can set roles
	if(await user.hasRoleInUnits("setRole", this.traverse("upperUnits", {includeSelf: true}))) return true

	// "manageSubUnit" roles upper units can set roles
	if(await user.hasRoleInUnits("manageSubUnit", this.traverse("upperUnits"))) return true

	return false
}

/** Accessing forms within the unit */
export async function ACCESS_FORMS(user) {
	// Lack of ACCESS permission denies ACCESS_FORMS
	if(await user.checkPermission(this.PERMISSIONS.ACCESS, true) === false) return false

	// MANAGE_FORMS permission implies ACCESS_FORMS
	if(await user.checkPermission(this.PERMISSIONS.MANAGE_FORMS, true)) return true

	// Allow access by users who belongs to the unit
	for await(const unit of user.listUnits(true)) {
		if(this.id == unit.id) return true
	}

	// Allow access by parent whose child belongs to the unit
	await user.populate("children")
	for(const child of user.children) {
		for await(const unit of child.listUnits(true)) {
			if(this.id == unit.id) return true
		}
	}

	return false
}

/** Creating and managing forms within the unit */
export async function MANAGE_FORMS(user) {
	// Lack of ACCESS permission denies MANAGE_FORMS
	if(await user.checkPermission(this.PERMISSIONS.ACCESS, true) === false) return false

	// "manageForms" roles in this unit and upper units can manage forms
	if(await user.hasRoleInUnits("manageForms", this.traverse("upperUnits", {includeSelf: true}))) return true
}