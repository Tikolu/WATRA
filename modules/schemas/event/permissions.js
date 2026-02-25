import Config from "modules/config.js"

/** Accessing the event's page */
export async function ACCESS(user) {
	// Block access from archived users
	if(user.archived) return false

	// Block access if user has no passkeys
	if(Config.passkeyRequired && user.auth.keys.length == 0) return false
	
	// Invited users can access
	if(this.participants.hasID(user.id)) return true

	// Parents of invited users can access
	await user.populate("children")
	for(const child of user.children) {
		if(this.participants.hasID(child.id)) return true
	}

	// "manageEvent" roles in event and upperUnit can access
	if(await user.hasRoleInUnits("manageEvent", this.traverse("upperUnits", {includeSelf: true}))) return true

	// "manageEventInvite" roles in any invited unit (or upper units) can access
	await this.populate({"invitedUnits": "unit"})
	for(const i of this.invitedUnits) {
		if(await user.hasRoleInUnits("manageEventInvite", i.unit.traverse("upperUnits", {includeSelf: true}))) return true
	}

	return false
}

/** Accessing the event's participants' profiles */
export async function ACCESS_PARTICIPANTS(user) {
	// Lack of ACCESS permission denies ACCESS_PARTICIPANTS
	if(await user.checkPermission(this.PERMISSIONS.ACCESS, true) === false) return false

	// "accessUser" roles in event and upper units can access participants
	if(await user.hasRoleInUnits("accessUser", this.traverse("upperUnits", {includeSelf: true}))) return true

	// Approvers can access participants
	if(await user.checkPermission(this.PERMISSIONS.APPROVE)) return true

	return false
}

/** Modifying the event's details */
export async function EDIT(user) {
	// Lack of ACCESS permission denies EDIT
	if(await user.checkPermission(this.PERMISSIONS.ACCESS, true) === false) return false

	// "manageEvent" roles in event and upperUnits can edit
	if(await user.hasRoleInUnits("manageEvent", this.traverse("upperUnits", {includeSelf: true}))) return true

	return false
}

/** Deleting the event details */
export async function DELETE(user) {
	// Lack of EDIT permission denies DELETE
	if(await user.checkPermission(this.PERMISSIONS.EDIT, true) === false) return false

	// Cannot delete event with accepted participants
	if(this.participants.some(p => p.state == "accepted")) return false
	
	// "manageEvent" roles in upperUnits can delete
	if(await user.hasRoleInUnits("manageEvent", this.traverse("upperUnits"))) return true

	return false
}

/** Setting roles of users within the event */
export async function SET_ROLE(user) {
	// Lack of ACCESS permission denies SET_ROLE
	if(await user.checkPermission(this.PERMISSIONS.ACCESS, true) === false) return false

	// Cannot set role if event has no configured roles
	if(!this.config.roles?.length) return false

	// "setRole" roles in this event can set roles
	if(await user.hasRoleInUnits("setRole", this)) return true

	// "manageEvent" roles in upperUnits can set roles
	if(await user.hasRoleInUnits("manageEvent", this.traverse("upperUnits"))) return true

	return false
}

/** Inviting units to the event */
export async function INVITE_PARTICIPANT(user) {
	// Lack of EDIT permission denies INVITE_PARTICIPANT
	if(await user.checkPermission(this.PERMISSIONS.EDIT, true) === false) return false

	// Cannot invite once event has started
	if(this.isPast) return false

	// "manageEvent" roles in event and upper units can invite units
	if(await user.hasRoleInUnits("manageEvent", this.traverse("upperUnits", {includeSelf: true}))) return true

	return false
}

/** Approving the event */
export async function APPROVE(user) {
	// Lack of ACCESS permission denies APPROVE
	if(!await user.checkPermission(this.PERMISSIONS.ACCESS)) return false

	// Cannot approve past events
	if(this.isPast) return false
	
	// Users with roles on the approvers list can approve the event
	for(const approver of this.approvers) {
		if(user.roles.hasID(approver.role.id)) return true
	}
	
	return false
}

/** Accessing forms within the event */
export async function ACCESS_FORMS(user) {
	// Allow access by users who have accepted invitation to the event
	if(this.participants.id(user.id)?.state == "accepted") return true

	// Allow access by parent whose child have accepted invitation to the event
	await user.populate("children")
	for(const child of user.children) {
		if(this.participants.id(child.id)?.state == "accepted") return true
	}

	// Allow access by users who have MANAGE_FORMS permission in the event
	if(await user.checkPermission(this.PERMISSIONS.MANAGE_FORMS)) return true

	return false
}

/** Creating and managing forms within the event */
export async function MANAGE_FORMS(user) {
	// Lack of ACCESS permission denies MANAGE_FORMS
	if(await user.checkPermission(this.PERMISSIONS.ACCESS, true) === false) return false

	// "manageForms" roles in this event and upper units can manage forms
	if(await user.hasRoleInUnits("manageForms", this.traverse("upperUnits", {includeSelf: true}))) return true
}