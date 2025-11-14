import mongoose from "mongoose"
import Config from "modules/config.js"

export class RoleClass {
	/* * Properties * */

	type = {
		type: String,
		enum: Object.keys(Config.roles)
	}
	user = {
		type: String,
		ref: "User"
	}
	unit = {
		type: String,
		ref: function() { return this.eventRole ? "Event" : "Unit" },
		alias: "event"
	}
	eventRole = {
		type: Boolean,
		index: true
	}


	/* * Getters * */

	/** Returns the role type object from config  */
	get config() {
		const config = Config.roles[this.type]
		if(!config) throw new Error(`Invalid role type: ${this.type}`)
		return config
	}

	/** Returns the role type name */
	get displayName() {
		const nameConfig = this.config.name
		return nameConfig[this.org] || nameConfig["default"]
	}

	/** Attempts to get the org of the role by looking at the user and unit */
	get org() {
		this.populate("user", {sync: true})
		return this.user.org || this.unit.org || null
	}

	/* Methods */

	/** Checks if the role has the given tag in config */
	hasTag(tag) {
		if(!(tag in Config.tags)) {
			throw new Error(`Unknown role tag "${tag}"`)
		}
		return this.config.tags.includes(tag)
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