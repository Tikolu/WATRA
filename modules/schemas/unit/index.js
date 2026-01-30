import mongoose from "mongoose"
import * as Text from "modules/text.js"

import Role from "modules/schemas/role.js"

import Config from "modules/config.js"

export class UnitClass {
	/* * Properties * */
	
	name = {
		type: String,
		trim: true,
		set: value => {
			value ||= ""
			return value.replaceAll("\n", "")
		}
	}
	type = {
		type: String,
		enum: Object.keys(Config.units)
	}
	org = {
		type: String,
		enum: Object.keys(Config.orgs)
	}
	roles = [
		{
			type: String,
			ref: "Role"
		}
	]
	subUnits = [
		{
			type: String,
			ref: "Unit"
		}
	]
	upperUnits = [
		{
			type: String,
			ref: "Unit"
		}
	]
	events = [
		{
			type: String,
			ref: "Event"
		}
	]
	eventInvites = [
		{
			type: String,
			ref: "Event"
		}
	]


	/** * Getters * */

	/** Returns the unit type object from config */
	get config() {
		const config = Config.units[this.type]
		if(!config) throw new Error(`Invalid unit type: ${this.type}`)
		return config
	}

	/** Returns the full unit name */
	get displayName() {
		return this.name || `(${this.typeName.toLowerCase()} bez nazwy)`
	}
	
	/** Returns the unit type name */
	get typeName() {
		const nameConfig = this.config.name
		return nameConfig[this.org] || nameConfig["default"]
	}


	/** Methods */
	
	/** Add user to unit with a role, any existing role in the unit gets overwritten */
	async setRole(user, roleType=this.config.defaultRole, save=true) {
		// Populate roles
		await this.populate("roles")

		let role
		
		if(!roleType) throw Error(`Jednostka "${this.typeName}" nie ma skonfigurowanych funkcji`)
		
		// Value is a Role instance: add the role directly
		else if(roleType instanceof Role) role = roleType

		// Value is a role type: create new role with said type
		else if(this.config.roles.includes(roleType)) {
			role = new Role({
				type: roleType
			})

		} else throw Error(`Nieprawidłowy typ funkcji "${roleType}"`)

		// Attempt to find existing role of user in this unit
		const existingRole = this.roles.find(f => f.user.id == user.id)
		if(existingRole) {
			// Check if existing role is the same
			if(existingRole.type === role.type) throw Error(`Użytkownik ${user.displayName} już ma tą funkcję`)
			
			const newRole = role
			role = existingRole
			for(const key in newRole.toObject()) {
				if(key == "_id") continue
				role[key] = newRole[key]
			}
		} 

		role.user = user
		role.unit = this

		// Check org mismatch
		if(this.org && this.org != user.org) {
			throw Error(`Nie można przypisać użytkownika z organizacji "${Config.orgs[user.org].name}" do jednostki z organizacji "${Config.orgs[this.org].name}"`)
		}

		// Enforce role count limit
		if("limit" in role.config) {
			const otherRolesOfType = this.roles.filter(f => f.type == role.type && f.user.id != user.id)
			if(otherRolesOfType.length >= role.config.limit) {
				if(role.config.limit == 1) throw Error(`W jednostce jest już ${role.displayName.toLowerCase()}`)
				throw Error(`Przekroczono limit (${role.config.limit}) funkcji typu "${role.displayName}"`)
			}
		}

		// Enforce role age limits
		const userAge = user.age
		if(userAge !== null) {
			if(userAge < (role.config.minAge || 0)) {
				throw Error(`Użytkownik ${user.displayName} nie spełnia wymaganego wieku dla "${role.displayName}"`)
			}
			if(userAge > (role.config.maxAge || Infinity)) {
				throw Error(`Użytkownik ${user.displayName} przekracza maksymalny wiek dla "${role.displayName}"`)
			}
		}

		// Add role to unit, unless already added
		if(!this.roles.hasID(role.id)) {
			this.roles.push(role)
		}
		
		// Add role to user, unless already added
		const userRolesKey = role.eventRole ? "eventRoles" : "roles"
		if(!user[userRolesKey].hasID(role.id)) {
			user[userRolesKey].push(role.id)
		}

		if(save) {
			await role.save()
			await this.save()
			await user.save()
		}

		return role
	}

	/** Add user as szeregowy */
	async addMember(user) {
		await this.setRole(user)
	}

	/** Check if user is in unit */
	async hasMember(user) {
		await this.populate("roles")
		return this.roles.some(f => f.user.id == user.id)
	}
	
	/** Link an existing unit as subUnit */
	async addSubUnit(subUnit) {
		// Check unit type compatibility
		if(subUnit.config.rank >= this.config.rank) throw Error("Nie można dodać jednostki o wyższym lub równym typie")
		
		// Check subUnit max units
		if(subUnit.upperUnits.length >= subUnit.config.maxUpperUnits) {
			throw Error(`Przekroczono limit jednostek nadrzędnych dla ${subUnit.displayName}`)
		}
		
		// Add subUnit to subUnits, unless already added
		if(!this.subUnits.hasID(subUnit.id)) {
			this.subUnits.push(subUnit.id)
		}

		// Add unit to subUnit's upperUnits, unless already added
		if(!subUnit.upperUnits.hasID(this.id)) {
			subUnit.upperUnits.push(this.id)
		}

		await this.save()
		await subUnit.save()
	}

	/** Gets all events in all subUnits */
	async * getSubUnitEvents(skipPast=false) {
		const exclude = []
		for await(const subUnit of this.getSubUnitsTree()) {
			await subUnit.populate("events", {
				filter: skipPast ? {"dates.end": {$gte: new Date()}} : undefined
			})
			for(const event of subUnit.events) {
				if(exclude.hasID(event.id)) continue
				exclude.push(event.id)
				yield event
			}
		}
	}

	/** Removes a subUnit */
	async removeSubUnit(subUnit) {
		// Ensure subUnit has other upperUnits
		if(subUnit.upperUnits.length <= 1) {
			throw Error("Nie można usunąć jednostki bo ma tylko jedną jednostkę nadrzędną")
		}

		// Remove subUnit from subUnits
		this.subUnits = this.subUnits.filter(j => j.id != subUnit.id)

		// Remove this unit from subUnit's upperUnits
		subUnit.upperUnits = subUnit.upperUnits.filter(j => j.id != this.id)

		await this.save()
		await subUnit.save()
	}

	/** Returns a list of possible subUnit types for this unit */
	getSubUnitOptions() {
		const options = []
		for(const unitTypeID in Config.units) {
			const unitType = Config.units[unitTypeID]
			// Exclude units with equal or higher rank
			if(unitType.rank >= this.config.rank) continue
			options.push(unitType)
		}
		return options
	}

	/** Sorts roles based on type and user name */
	async sortRoles(sortByType=true) {
		await this.populate({"roles": "user"})
		this.roles.sort((a, b) => {
			// Place users with highest role at the start
			if(sortByType) {
				const aType = Config.roles[a.type].rank
				const bType = Config.roles[b.type].rank
				if(aType != bType) return bType - aType
			}

			// Place users without a name at the end
			const aNoName = Object.isEmpty(a.user.name.toObject())
			const bNoName = Object.isEmpty(b.user.name.toObject())

			if(aNoName && bNoName) return 0
			if(aNoName) return 1
			if(bNoName) return -1
			
			return a.user.displayName.localeCompare(b.user.displayName)
		})
	}

	/** List of subUnits in the given org */
	orgSubUnits(org=this.org) {
		const subUnits = []
		for(const subUnit of this.subUnits) {
			// If org is given, and subUnit's org (if present) is different, skip it
			if(org && subUnit.org && subUnit.org != org) continue
			subUnits.push(subUnit)
		}
		return subUnits
	}

	/** List of the unit's upper units */
	async getUpperUnits() {
		await this.populate("upperUnits")
		return this.upperUnits
	}

	/** Recursive generator of all upperUnits */
	async * getUpperUnitsTree(exclude=[], condition) {
		exclude = [...exclude]

		for(const upperUnit of await this.getUpperUnits()) {
			if(exclude.hasID(upperUnit.id)) continue
			// exclude.push(upperUnit.id)
			if(condition && !await condition(upperUnit)) continue
			yield upperUnit
			yield * upperUnit.getUpperUnitsTree(exclude, condition)
		}
	}

	/** Recursive generator of all subUnits */
	async * getSubUnitsTree(exclude=[], org=this.org, condition) {
		exclude = [...exclude]
		await this.populate("subUnits", {exclude})

		for(const subUnit of this.orgSubUnits(org)) {
			if(exclude.hasID(subUnit.id)) continue
			// exclude.push(subUnit.id)
			if(condition && !await condition(subUnit)) continue
			yield subUnit
			yield * subUnit.getSubUnitsTree(exclude, org, condition)
		}
	}

	/** List of all direct members */
	async getMembers(exclude=[]) {
		exclude = [...exclude]
		await this.populate({"roles": "user"}, {exclude})
		const users = []
		for(const role of this.roles) {
			if(exclude.hasID(role.user.id)) continue
			// exclude.push(role.user.id)
			users.push(role.user)
		}
		return users
	}

	/** Recursive list of all members (including members of subUnits) */
	async * getSubMembers(exclude=[]) {
		exclude = [...exclude]
		// Yield all members of this unit
		for(const member of await this.getMembers(exclude)) {
			exclude.push(member.id)
			yield member
		}
		// Yield all members of the all subUnits
		for await(const subUnit of await this.getSubUnitsTree()) {
			for(const member of await subUnit.getMembers(exclude)) {
				if(exclude.hasID(member.id)) continue
				exclude.push(member.id)
				yield member
			}
		}
	}

	/** Counts the amount of members */
	countMembers(recursive=false) {
		let count = this.roles.length
		if(recursive) {
			for(const subUnit of this.subUnits) {
				count += subUnit.countMembers?.(true) || 0
			}
		}
		return count
	}
}

const schema = mongoose.Schema.fromClass(UnitClass)

schema.beforeDelete = async function() {
	await this.populate({
		"upperUnits": {},
		"subUnits": {},
		"roles": "user"
	})
	
	if(this.upperUnits.length == 0) throw Error("Nie można usunąć jednostki bez jednostek nadrzędnych")

	// Add all members to upper unit
	for(const role of this.roles) {
		// Determine upper unit
		let upperUnit = this.upperUnits.find(u => u.org == this.org)
		upperUnit ||= this.upperUnits[0]
		// Skip adding if user already has a role in upper unit
		if(await upperUnit.hasMember(role.user)) continue
		await upperUnit.addMember(role.user)
	}
	
	// Delete roles
	await Role.deleteMany({unit: this.id})

	// Remove self from all upperUnits
	for(const upperUnit of this.upperUnits) {
		upperUnit.subUnits = upperUnit.subUnits.filter(j => j.id != this.id)
		await upperUnit.save()
	}

	// Remove self from all subUnits and transfer subUnits to upper unit
	for(const subUnit of this.subUnits) {
		subUnit.upperUnits = subUnit.upperUnits.filter(j => j.id != this.id)

		// Determine upper unit
		let upperUnit = this.upperUnits.find(u => u.org == subUnit.org)
		upperUnit ||= this.upperUnits[0]
		
		// Skip transfer if subUnit has other upperUnits or if upper unit already has the subUnit
		if(subUnit.upperUnits.length || upperUnit.subUnits.hasID(subUnit.id)) {
			await subUnit.save()
			continue
		}

		await upperUnit.addSubUnit(subUnit)
	}
}

schema.permissions = await import("./permissions.js")

export default mongoose.model("Unit", schema, "units")