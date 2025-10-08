import mongoose from "mongoose"
import randomID from "modules/randomID.js"
import * as Text from "modules/text.js"
import * as datetime from "jsr:@std/datetime"

import Funkcja from "modules/schemas/funkcja.js"
import Event from "modules/schemas/event.js"
import Log from "modules/schemas/log.js"
import userMedical from "modules/schemas/user/medical.js"

import { FunkcjaType } from "modules/types.js"
import HTTPError from "modules/server/error.js"
import { medicalCategories } from "modules/medical.js"

export class UserClass {
	/* * Static functions * */

	/** Finds a user by their access code */
	static findByAccessCode(code) {
		if(!/^\d+$/.test(code)) return null
		return this.findOne({ accessCode: code })
	}
	
	
	/* * Properties * */

	name = {
		first: String,
		last: String
	}
	dateOfBirth = {
		type: Date,
		min: MIN_DATE,
		max: Date.now
	}
	email = {
		type: String,
		lowercase: true,
		trim: true,
		match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
	}
	phone = {
		type: String,
		trim: true,
		match: /^\+\d{1,3}\d{9}$/
	}
	
	parents = [
		{
			type: String,
			ref: "User"
		}
	]
	children = [
		{
			type: String,
			ref: "User"
		}
	]

	funkcje = [
		{
			type: String,
			ref: "Funkcja"
		}
	]
	eventFunkcje = [
		{
			type: String,
			ref: "Funkcja"
		}
	]

	eventInvites = [
		{
			type: String,
			ref: "Event"
		}
	]
	eventApprovalRequests = [
		{
			type: String,
			ref: "Event"
		}
	]

	medical = userMedical

	accessCode = String

	/* * Getters * */

	/** Returns the user's name in the format "First Last" */
	get displayName() {
		let name = this.name.first
		if(!name) return this.defaultName || "(brak imienia)"
		else if(this.name.last) name += " " + this.name.last
		return name
	}

	/** Returns the floor of the user's age in years */
	get age() {
		if(!this.dateOfBirth) return null
		const age = datetime.difference(new Date(), this.dateOfBirth)
		return age.years
	}

	/** True if the user has children */
	get isParent() {
		return this.children.length > 0
	}


	/* * Methods * */

	/** Generates, saves and returns an access code for a user */
	async generateAccessCode() {
		this.accessCode = randomID(2, "numeric")
		await this.save()
		return this.accessCode
	}

	/** Updates the user's first an last name */
	async updateName(first="", last="") {
		this.name.first = Text.formatName(first)
		this.name.last = Text.formatName(last)
		await this.save()
	}

	/** Updates the date of birth and checks for any issues */
	async updateDateOfBirth(date) {
		if(!date) throw Error("Nie prawidłowa data urodzenia")
		this.dateOfBirth = date
		if(this.isParent && this.age < 18) {
			throw Error("Rodzic / opiekun musi być osobą pełnoletnią")
		}
		await this.save()
	}

	/** Updates the user's email */
	async updateEmail(email) {
		this.email = email
		try {
			await this.validate()
		} catch {
			throw Error("Nieprawidłowy adres e-mail")
		}
		
		await this.save()
	}

	/** Updates the user's phone number */
	async updatePhone(phone) {
		phone = phone.replaceAll(" ", "")
		phone = phone.replace(/^00/, "+")
		if(!phone.startsWith("+") && phone.length > 10) phone = `+${phone}`
		if(phone.startsWith("8") && phone.length == 9) phone = `+353${phone}`
		if(phone.startsWith("08")) phone = `+353${phone.slice(1)}`

		this.phone = phone
		try {
			await this.validate()
		} catch {
			throw Error("Nieprawidłowy numer telefonu")
		}
		
		await this.save()
	}

	/** Adds the provided user as a parent to the user */
	async addParent(parent) {
		if(this.parents.hasID(parent.id)) return
		this.parents.push(parent.id)

		parent.children.push(this.id)

		await parent.save()
		await this.save()
	}

	/** Returns the user's funkcja in the given unit */
	async getFunkcjaInUnit(unit) {
		await unit.populate("funkcje")
		for(const funkcja of unit.funkcje) {
			if(this.id == funkcja.user.id) {
				return funkcja
			}
		}
	}

	/** Checks if the user has a funkcja in any of the given units */
	async hasFunkcjaInUnits(requiredFunkcja, ...units) {
		for(const unit of units) {
			if(unit instanceof Array || Symbol.asyncIterator in unit) {
				for await(const asyncUnit of unit) {
					if(await this.hasFunkcjaInUnits(requiredFunkcja, asyncUnit)) return true
				}
			} else {
				const funkcja = await this.getFunkcjaInUnit(unit)
				if(typeof requiredFunkcja == "function") {
					const checkResult = await requiredFunkcja(funkcja?.type)
					if(checkResult === true) return true
				} else if(requiredFunkcja instanceof Array) {
					if(requiredFunkcja.includes(funkcja?.type)) return true
				} else if(funkcja?.type === requiredFunkcja) return true
			}
		}
		return false
	}

	/** Checks permission and returns the result. The result is cached for future calls */
	async checkPermission(permission) {
		this.$locals.permissionCache ||= []
		for(const cacheEntry of this.$locals.permissionCache) {
			if(cacheEntry[0] == permission) return cacheEntry[1]
		}
		const permissionState = await permission(this)
		this.$locals.permissionCache.push([permission, permissionState])
		return permissionState
	}

	/** Checks permission and throws a 403 error if denied */
	async requirePermission(permission, message) {
		if(await this.checkPermission(permission)) return
		throw new HTTPError(403, message)
	}

	/** Returns the permission state from cache. Will throw an error if permission is not in cache */
	hasPermission(permission) {
		this.$locals.permissionCache ||= []
		for(const cacheEntry of this.$locals.permissionCache) {
			if(cacheEntry[0] == permission) return cacheEntry[1]
		}
		throw Error(`Permission ${permission.name.replace(/^bound /, "")} not checked`)
		// return false
	}

	/** Sets the state of a permission in cache */
	overridePermission(permission, state) {
		this.$locals.permissionCache ||= []
		for(const cacheEntry of this.$locals.permissionCache) {
			if(cacheEntry[0] == permission) {
				cacheEntry[1] = state
				return
			}
		}
		this.$locals.permissionCache.push([permission, state])
	}

	/** Lists all checked permissions */
	* listPermissions() {
		for(const cacheEntry of this.$locals.permissionCache || []) {
			const permission = {
				source: cacheEntry[0].permissionSource,
				name: cacheEntry[0].name.replace(/^bound /, ""),
				state: cacheEntry[1]
			}
			yield permission
		}
	}

	/** Returns an asynchronous list of all user's units and upper units */
	async * getUnitsTree() {
		await this.populate("funkcje")
		for(const funkcja of this.funkcje) {
			await funkcja.populate("unit")
			yield funkcja.unit
			yield * funkcja.unit.getUpperUnitsTree()
		}
	}

	/** Adds an entry to the user's activity log */
	async logEvent(eventType, options={}) {
		const {targetUser, targetEvent, targetUnit, data} = options
		const logEntry = new Log({
			user: this.id,
			eventType,
			targetUser,
			targetEvent,
			targetUnit,
			data
		})
		await logEntry.save()
	}
}

const schema = mongoose.Schema.fromClass(UserClass)

schema.beforeDelete = async function() {	
	// Delete parents
	await this.populate("parents")
	for(const parent of this.parents) {
		// Keep parents with funkcje
		if(parent.funkcje.length > 0) continue
		// Keep parents other children
		if(parent.children.length > 1) continue
		await parent.delete()
	}

	// Remove self as parent in all children
	await this.populate("children")
	for(const child of this.children) {
		child.parents = child.parents.filter(p => p.id != this.id)
		await child.save()
	}

	// Remove self from all events
	await this.populate("eventInvites")
	
	for(const event of this.eventInvites) {
		const invite = event.findUserInvite(this)
		if(!invite) continue
		await invite.delete()
		await event.save()
	}

	// Delete all funkcje
	await Funkcja.deleteMany({user: this.id})
}

schema.permissions = {
	async ACCESS(user) {
		// User can access themselves
		if(user.id == this.id) return true

		// Parent can access their children
		if(user.children.hasID(this.id)) return true

		// Child can access their parents
		if(user.parents.hasID(this.id)) return true

		// Przyboczni of member unit and of all upper units can access
		if(await user.hasFunkcjaInUnits(f => f >= FunkcjaType.PRZYBOCZNY, this.getUnitsTree())) return true

		// Kadra of event can access
		await this.populate("eventInvites")
		for(const event of this.eventInvites) {
			const invite = event.findUserInvite(this)
			if(invite?.state != "accepted") continue
			if(user.hasFunkcjaInUnits(f => f >= FunkcjaType.PRZYBOCZNY, event)) return true
		}

		// Przyboczni of child's member unit and of all upper units can access
		await this.populate("children")
		for(const child of this.children) {
			if(await user.hasFunkcjaInUnits(f => f >= FunkcjaType.PRZYBOCZNY, child.getUnitsTree())) return true
		}

		return false
	},

	async MODIFY(user) {
		if(!await user.checkPermission(this.PERMISSIONS.ACCESS)) return false
		// Niepełnoletni with parents cannot modify their own details
		if(user.id == this.id) {
			if(this.age && this.age < 18 && this.parents?.length > 0) return false
			return true
		}
		// Parent can modify their children
		if(user.children.hasID(this.id)) return true
		// Druyżynowi of member unit and of all upper units can modify
		if(await user.hasFunkcjaInUnits(FunkcjaType.DRUŻYNOWY, this.getUnitsTree())) return true
		// Druyżynowi of child's member unit and of all upper units can modify
		if(this.isParent) {
			await this.populate("children")
			for(const child of this.children) {
				if(await user.hasFunkcjaInUnits(FunkcjaType.DRUŻYNOWY, child.getUnitsTree())) return true
			}
		}
		return false
	},

	async ADD_PARENT(user) {
		// Druyżynowi of member unit and of all upper units can add parents
		if(await user.hasFunkcjaInUnits(FunkcjaType.DRUŻYNOWY, this.getUnitsTree())) return true

		return false
	},

	async DELETE(user) {
		// User can never delete themselves
		if(user.id == this.id) return false
		// A parent of a user which can be deleted can also be deleted
		await this.populate("children")
		for(const child of this.children) {
			if(await user.checkPermission(child.PERMISSIONS.DELETE)) return true
		}
		// Druyżynowi of member unit and of all upper units can delete
		if(await user.hasFunkcjaInUnits(FunkcjaType.DRUŻYNOWY, this.getUnitsTree())) return true
		return false
	},

	async APPROVE(user) {
		if(!await user.checkPermission(this.PERMISSIONS.ACCESS)) return false
		// Niepełnoletni cannot approve themselves
		if(user.id == this.id) {
			if(this.age && this.age < 18) return false
			return true
		}
		// Parent can approve their children
		if(user.children.hasID(this.id)) return true
	}
}

export default mongoose.model("User", schema)