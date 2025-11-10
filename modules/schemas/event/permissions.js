/** Accessing the event's page */
export async function ACCESS(user) {
	// Invited users can access
	if(this.findUserInvite(user)) return true

	// Parents of invited users can access
	await user.populate("children")
	for(const child of user.children) {
		if(this.findUserInvite(child)) return true
	}

	// "manageEvent" roles in any upperUnit can access
	if(await user.hasRoleInUnits("manageEvent", this.getUpperUnitsTree())) return true

	// "manageEventInvite" roles in any invited unit can access
	await this.populate({"invitedUnits": "unit"})
	for(const i of this.invitedUnits) {
		if(await user.hasRoleInUnits("manageEventInvite", i.unit)) return true
	}

	return false
}

export async function PARTICIPANT_ACCESS(user) {
	if(await user.hasRoleInUnits("accessParticipant")) return true

	return false
}

export async function APPROVE(user) {
	// "approveEvent" roles in any upperUnit can access
	if(await user.hasRoleInUnits("approveEvent", this.getUpperUnitsTree())) return true

	return false
}

export async function EDIT(user) {
	// "modifyEvent" roles in event and upperUnits
	if(await user.hasRoleInUnits("manageEvent", this, this.getUpperUnitsTree())) return true

	return false
}