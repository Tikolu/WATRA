import mongoose from "mongoose"
import * as Text from "modules/text.js"

import Funkcja from "modules/schemas/funkcja.js"

import { FunkcjaType, UnitType, FunkcjaNames } from "modules/types.js"

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
	funkcje = [
		{
			type: String,
			ref: "Funkcja"
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
	
	/** Add user to unit with a funkcja, any existing funkcja in the unit gets overwritten */
	async setFunkcja(user, funkcjaType=FunkcjaType.SZEREGOWY) {
		// Populate funkcje
		await this.populate("funkcje")

		let funkcja
		
		// Value is a Funkcja instance: add the funkcja	directly
		if(funkcjaType instanceof Funkcja) funkcja = funkcjaType

		// Value is a FunkcjaType: create new funkcja with said type
		else if(Object.values(FunkcjaType).includes(funkcjaType)) {
			funkcja = new Funkcja({
				type: funkcjaType
			})

		} else throw Error("Nieprawidłowy typ funkcji")

		// Attempt to find existing funkcja of user in this unit
		const existingFunkcja = this.funkcje.find(f => f.user.id == user.id)
		if(existingFunkcja) {
			// Check if existing funkcja is the same
			if(existingFunkcja.type === funkcja.type) throw Error(`Użytkownik już ma tą funkcję`)
			
			funkcja = new Funkcja({
				...funkcja.toObject(),
				_id: existingFunkcja.id
			})
			funkcja.$isNew = false
		}

		funkcja.user = user.id
		funkcja.unit = this.id

		// Only one drużynowy per unit, only one (pod)zastępowy per zastęp
		if(funkcja.type == 2 || (this.type == UnitType.ZASTĘP && funkcja.type == 1)) {
			const funkcjaGłówna = this.funkcje.find(f => f.type == funkcja.type)
			if(funkcjaGłówna) {
				await funkcjaGłówna.populate("unit")
				throw Error(`${this.typeName} ma już funkcję: ${funkcjaGłówna.displayName}`)
			}
		}

		// Add funkcja to unit, unless already added
		if(!this.funkcje.hasID(funkcja.id)) {
			this.funkcje.push(funkcja)
		}
		
		// Add funkcja to user, unless already added
		const userFunkcjeKey = funkcja.eventFunkcja ? "eventFunkcje" : "funkcje"
		if(!user[userFunkcjeKey].hasID(funkcja.id)) {
			user[userFunkcjeKey].push(funkcja.id)
		}

		await funkcja.save()
		await this.save()
		await user.save()

		// Delete any szeregowy funkcje in upper units
		for await(const upperUnit of this.getUpperUnitsTree()) {
			const existingFunkcja = await user.getFunkcjaInUnit(upperUnit)
			if(existingFunkcja?.type === FunkcjaType.SZEREGOWY) {
				await existingFunkcja.delete()
			}
		}
		

		return funkcja
	}

	/** Add user as szeregowy */
	async addMember(user) {
		await this.setFunkcja(user)
	}

	/** Check if user is in unit */
	async hasMember(user) {
		await this.populate("funkcje")
		return this.funkcje.some(f => f.user.id == user.id)
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

	/** Returns a list of possible funkcja levels and names for this unit */
	getFunkcjaOptions(funkcjaNames=FunkcjaNames[this.type]) {
		const funkcjaOptions = []
		for(const funkcjaLevel in funkcjaNames) {
			for(const funkcjaName of funkcjaNames[funkcjaLevel]) {
				funkcjaOptions.push([funkcjaLevel, funkcjaName])
			}
		}
		return funkcjaOptions
	}

	/** Sorts funkcje based on type and user name */
	async sortFunkcje() {
		await this.populate({"funkcje": "user"})
		this.funkcje.sort((a, b) => {
			// Place users with highest funkcja at the start
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
		await this.populate({"funkcje": "user"}, {exclude})
		const users = []
		for(const funkcja of this.funkcje) {
			if(exclude.hasID(funkcja.user.id)) continue
			exclude.push(funkcja.user.id)
			users.push(funkcja.user)
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
		"funkcje": "user"
	})
	
	// Chose primary upper unit
	const primaryUpperUnit = this.upperUnits[0]
	if(!primaryUpperUnit) throw Error("Nie można usunąć units bez jednostek nadrzędnych")

	// Add all members to primary upper unit
	for(const funkcja of this.funkcje) {
		// Skip adding if user already has a funkcja in the primary upper unit
		if(await funkcja.user.hasFunkcjaInUnits(f => f >= FunkcjaType.SZEREGOWY, primaryUpperUnit)) continue
		await primaryUpperUnit.addMember(funkcja.user)
	}
	
	// Delete funkcje
	await Funkcja.deleteMany({unit: this.id})

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

schema.permissions = {
	async ACCESS(user) {
		// Members can access their unit
		if(await this.hasMember(user)) return true

		// Przyboczni of all upper units and sub units can access
		if(await user.hasFunkcjaInUnits(f => f >= FunkcjaType.PRZYBOCZNY, this.getUpperUnitsTree(), this.getSubUnitsTree())) return true

		return false
	},

	async MODIFY(user) {
		// Drużynowy of this and all upper units can modify
		if(await user.hasFunkcjaInUnits(FunkcjaType.DRUŻYNOWY, this, this.getUpperUnitsTree())) return true
		return false
	},

	async DELETE(user) {
		// Drużynowy of upper units can delete
		if(await user.hasFunkcjaInUnits(FunkcjaType.DRUŻYNOWY, this.getUpperUnitsTree())) return true
		return false
	}
}

export default mongoose.model("Unit", schema, "units")