import mongoose from "mongoose"

import { RoleType, RoleNames, EventRoleNames} from "modules/types.js"

export class RoleClass {
	/* * Properties * */

	type = {
		type: Number,
		enum: Object.values(RoleType),
		default: RoleType.SZEREGOWY
	}
	user = {
		type: String,
		ref: "User"
	}
	unit = {
		type: String,
		ref: function() { return this.eventRole ? "Event" : "Unit" },
	}
	eventRole = {
		type: Boolean,
		index: true
	}


	/* * Getters * */

	/** Returns the role type name. Will throw an error if the unit field is not populated */
	get displayName() {
		let roleNames
		if(this.eventRole) {
			roleNames = EventRoleNames
		} else {
			if(!this.populated("unit") || !this.unit) return "role"
			roleNames = RoleNames[this.unit.type]
		}
				
		return roleNames?.[this.type][0] || "(nieznana funkcja)"
	}
}

const schema = mongoose.Schema.fromClass(RoleClass)

schema.beforeDelete = async function() {
	// Remove self from user
	await this.populate("user")
	const rolesKey = this.eventRole ? "eventRoles" : "roles"
	this.user[rolesKey] = this.user[rolesKey].filter(f => f.id != this.id)
	await this.user.save()

	// Remove self from unit
	await this.populate("unit")
	this.unit.roles = await this.unit.roles.filter(f => f.id != this.id)
	await this.unit.save()
}

export default mongoose.model("Role", schema, "roles")