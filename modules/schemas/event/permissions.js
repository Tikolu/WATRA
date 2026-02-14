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

	// "manageEventInvite" roles in any invited unit can access
	await this.populate({"invitedUnits": "unit"})
	for(const i of this.invitedUnits) {
		if(await user.hasRoleInUnits("manageEventInvite", i.unit)) return true
	}

	return false
}

/** Accessing the event's participants' profiles */
export async function ACCESS_PARTICIPANTS(user) {
	// Lack of ACCESS permission denies ACCESS_PARTICIPANTS
	if(await user.checkPermission(this.PERMISSIONS.ACCESS, true) === false) return false

	// "accessUser" roles in event can access participants
	if(await user.hasRoleInUnits("accessUser", this)) return true

	// Approvers can access participants
	if(await user.checkPermission(this.PERMISSIONS.APPROVE)) return true

	return false
}

/** Modifying the event's details */
export async function EDIT(user) {
	// Lack of ACCESS permission denies EDIT
	if(await user.checkPermission(this.PERMISSIONS.ACCESS, true) === false) return false

	// "manageEvent" roles in event and direct upperUnits can edit
	if(await user.hasRoleInUnits("manageEvent", this.traverse("upperUnits", {depth: 1, includeSelf: true}))) return true

	return false
}

/** Deleting the event details */
export async function DELETE(user) {
	// Lack of EDIT permission denies DELETE
	if(await user.checkPermission(this.PERMISSIONS.EDIT, true) === false) return false

	// Cannot delete event with accepted participants
	if(this.participants.some(p => p.state == "accepted")) return false
	
	// "manageEvent" roles in direct upperUnits can delete
	if(await user.hasRoleInUnits("manageEvent", this.traverse("upperUnits", {depth: 1}))) return true

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

	// "manageEvent" roles in direct upperUnits can set roles
	if(await user.hasRoleInUnits("manageEvent", this.traverse("upperUnits", {depth: 1}))) return true

	return false
}

/** Inviting units to the event */
export async function INVITE_PARTICIPANT(user) {
	// Lack of EDIT permission denies INVITE_PARTICIPANT
	if(await user.checkPermission(this.PERMISSIONS.EDIT, true) === false) return false

	// "manageEvent" roles in event and direct upper unit can invite units
	if(await user.hasRoleInUnits("manageEvent", this.traverse("upperUnits", {depth: 1, includeSelf: true}))) return true

	return false
}

/** Approving the event */
export function APPROVE(user) {
	// Users with roles on the approvers list can approve the event
	for(const approver of this.approvers) {
		if(user.roles.hasID(approver.role.id)) return true
	}
	
	return false
}