import mongoose from "mongoose"
import * as Text from "modules/text.js"

import Role from "modules/schemas/role.js"

import { RoleType, UnitType, RoleNames } from "modules/types.js"

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
		type: Number,
		enum: Object.values(UnitType)
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
	eventInvites = [
		{
			type: String,
			ref: "Event"
		}
	]


	/* * Getters * */

	/** Returns the full unit name */
	get displayName() {
		return this.name || `(${this.typeName.toLowerCase()} bez nazwy)`
	}
	
	/** Returns the unit type name */
	get typeName() {
		const type = Object.keys(UnitType)[this.type] || "unit"
		return Text.capitalise(type)
	}


	/* Methods */
	
	/** Add user to unit with a role, any existing role in the unit gets overwritten */
	async setRole(user, roleType=RoleType.SZEREGOWY) {
		// Populate roles
		await this.populate("roles")

		let role
		
		// Value is a Role instance: add the role	directly
		if(roleType instanceof Role) role = roleType

		// Value is a RoleType: create new role with said type
		else if(Object.values(RoleType).includes(roleType)) {
			role = new Role({
				type: roleType
			})

		} else throw Error("Nieprawidłowy typ funkcji")

		// Attempt to find existing role of user in this unit
		const existingRole = this.roles.find(f => f.user.id == user.id)
		if(existingRole) {
			// Check if existing role is the same
			if(existingRole.type === role.type) throw Error(`Użytkownik już ma tą funkcję`)
			
			role = new Role({
				...role.toObject(),
				_id: existingRole.id
			})
			role.$isNew = false
		}

		role.user = user.id
		role.unit = this.id

		// Only one drużynowy per unit, only one (pod)zastępowy per zastęp
		if(role.type == 2 || (this.type == UnitType.ZASTĘP && role.type == 1)) {
			const roleGłówna = this.roles.find(f => f.type == role.type)
			if(roleGłówna) {
				await roleGłówna.populate("unit")
				throw Error(`${this.typeName} ma już funkcję: ${roleGłówna.displayName}`)
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

		await role.save()
		await this.save()
		await user.save()

		// Delete any szeregowy roles in upper units
		for await(const upperUnit of this.getUpperUnitsTree()) {
			const existingRole = await user.getRoleInUnit(upperUnit)
			if(existingRole?.type === RoleType.SZEREGOWY) {
				await existingRole.delete()
			}
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
		if(subUnit.type >= this.type) throw Error("Nie można dodać jednostki o wyższym lub równym typie")
		
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

	/** Returns a list of possible role levels and names for this unit */
	getRoleOptions(roleNames=RoleNames[this.type]) {
		const roleOptions = []
		for(const roleLevel in roleNames) {
			for(const roleName of roleNames[roleLevel]) {
				roleOptions.push([roleLevel, roleName])
			}
		}
		return roleOptions
	}

	/** Sorts roles based on type and user name */
	async sortRoles() {
		await this.populate({"roles": "user"})
		this.roles.sort((a, b) => {
			// Place users with highest role at the start
			if(a.type != b.type) return b.type - a.type

			// Place users without a name at the end
			const aNoName = Object.isEmpty(a.user.name.toObject())
			const bNoName = Object.isEmpty(b.user.name.toObject())

			if(aNoName && bNoName) return 0
			if(aNoName) return 1
			if(bNoName) return -1
			
			return a.user.displayName.localeCompare(b.user.displayName)
		})
	}

	/** Recursive generator of all upperUnits */
	async * getUpperUnitsTree(exclude=[], condition) {
		exclude = [...exclude]
		await this.populate("upperUnits", {exclude})

		for(const upperUnit of this.upperUnits) {
			if(exclude.hasID(upperUnit.id)) continue
			exclude.push(upperUnit.id)
			if(condition && !await condition(upperUnit)) continue
			yield upperUnit
			yield * upperUnit.getUpperUnitsTree(exclude, condition)
		}
	}

	/** Recursive generator of all subUnits */
	async * getSubUnitsTree(exclude=[], condition) {
		exclude = [...exclude]
		await this.populate("subUnits", {exclude})

		for(const subUnit of this.subUnits) {
			if(exclude.hasID(subUnit.id)) continue
			exclude.push(subUnit.id)
			if(condition && !await condition(subUnit)) continue
			yield subUnit
			yield * subUnit.getSubUnitsTree(exclude, condition)
		}
	}

	/* Recursive list of all units (sub and upper) */
	async * getUnitsTree(exclude=[], condition) {
		exclude = [...exclude]
		exclude.push(subUnit.id)
		yield this
		for(const subUnit of this.getSubUnitsTree(exclude, condition)) {
			if(exclude.hasID(subUnit.id)) continue
			exclude.push(subUnit.id)
			yield subUnit
		}
		for(const upperUnit of this.getUpperUnitsTree(exclude, condition)) {
			if(exclude.hasID(upperUnit.id)) continue
			exclude.push(upperUnit.id)
			yield upperUnit
			yield * upperUnit.getUnitsTree(exclude, condition)
		}
	}

	/** List of all direct members */
	async getMembers(exclude=[]) {
		exclude = [...exclude]
		await this.populate({"roles": "user"}, {exclude})
		const users = []
		for(const role of this.roles) {
			if(exclude.hasID(role.user.id)) continue
			exclude.push(role.user.id)
			users.push(role.user)
		}
		return users
	}

	/* Recursive list of all members (including members of subUnits) */
	async * getSubMembers(exclude=[]) {
		exclude = [...exclude]
		// Yield all members of this unit
		for(const member of await this.getMembers(exclude)) {
			exclude.push(member.id)
			yield member
		}
		// Yield all members of the all subUnits
		for await(const subUnit of this.getSubUnitsTree()) {
			for(const member of await subUnit.getMembers(exclude)) {
				if(exclude.hasID(member.id)) continue
				exclude.push(member.id)
				yield member
			}
		}
	}
}

const schema = mongoose.Schema.fromClass(UnitClass)

schema.beforeDelete = async function() {
	await this.populate({
		"upperUnits": {},
		"subUnits": {},
		"roles": "user"
	})
	
	// Chose primary upper unit
	const primaryUpperUnit = this.upperUnits[0]
	if(!primaryUpperUnit) throw Error("Nie można usunąć units bez jednostek nadrzędnych")

	// Add all members to primary upper unit
	for(const role of this.roles) {
		// Skip adding if user already has a role in the primary upper unit
		if(await role.user.hasRoleInUnits(f => f >= RoleType.SZEREGOWY, primaryUpperUnit)) continue
		await primaryUpperUnit.addMember(role.user)
	}
	
	// Delete roles
	await Role.deleteMany({unit: this.id})

	// Remove self from all upperUnits
	for(const upperUnit of this.upperUnits) {
		upperUnit.subUnits = upperUnit.subUnits.filter(j => j.id != this.id)
		await upperUnit.save()
	}

	// Remove self from all subUnits and transfer subUnits to primary upper unit
	for(const subUnit of this.subUnits) {
		subUnit.upperUnits = subUnit.upperUnits.filter(j => j.id != this.id)
		// Skip transfer if subUnit has other upperUnits or if primary upper unit already has subUnit
		if(subUnit.upperUnits.length || primaryUpperUnit.subUnits.hasID(subUnit.id)) {
			await subUnit.save()
			continue
		}

		await primaryUpperUnit.addSubUnit(subUnit)
	}
}

schema.permissions = await import("./permissions.js")

export default mongoose.model("Unit", schema, "units")