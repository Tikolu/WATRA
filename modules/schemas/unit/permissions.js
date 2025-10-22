import { RoleType } from "modules/types.js"

export async function ACCESS(user) {
	// Members can access their unit
	if(await this.hasMember(user)) return true

	// Przyboczni of all upper units and sub units can access
	if(await user.hasRoleInUnits(f => f >= RoleType.PRZYBOCZNY, this.getUpperUnitsTree(), this.getSubUnitsTree())) return true

	return false
}

export async function MODIFY(user) {
	// Drużynowy of this and all upper units can modify
	if(await user.hasRoleInUnits(RoleType.DRUŻYNOWY, this, this.getUpperUnitsTree())) return true
	return false
}

export async function MANAGE(user) {
	// Drużynowy of upper units can rename, unless unit is a top-level unit
	if(this.upperUnits.length) {
		if(await user.hasRoleInUnits(RoleType.DRUŻYNOWY, this.getUpperUnitsTree())) return true
	} else if(await user.hasRoleInUnits(RoleType.DRUŻYNOWY, this)) {
		return true
	}
	return false
}

export async function DELETE(user) {
	// Drużynowy of upper units can delete
	if(await user.hasRoleInUnits(RoleType.DRUŻYNOWY, this.getUpperUnitsTree())) return true
	return false
}