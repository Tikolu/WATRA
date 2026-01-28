import mongoose from "mongoose"
import * as Text from "modules/text.js"
import * as datetime from "jsr:@std/datetime"

import Role from "modules/schemas/role.js"
import Event from "modules/schemas/event"
import Log from "modules/schemas/log.js"

import Config from "modules/config.js"
import HTTPError from "modules/server/error.js"

import userMedical from "./medical.js"
import userAuth from "./auth.js"
import * as Crypto from "modules/crypto.js"

export class UserClass {
	/* * Static functions * */

	/** Finds a user by their access code */
	static findByAccessCode(code) {
		if(!/^\d+$/.test(code)) return null
		return this.findOne({ "auth.accessCode": code })
	}
	
	
	/* * Properties * */

	name = {
		first: {
			type: String,
			set: value => {
				return Text.formatName(value)
			}
		},
		last: {
			type: String,
			set: value => {
				return Text.formatName(value)
			}
		}
	}
	dateOfBirth = {
		type: Date,
		min: MIN_DATE,
		max: Date.now,
		validate: async function(value) {
			if(!value) return true
			
			// Enforce parents to be adults
			if(this.isParent && this.age < Config.adultAge) {
				throw Error("Rodzic / opiekun musi być osobą pełnoletnią")
			}

			// Enforce role age restrictions
			await this.populate(["roles", "eventRoles"])
			for(const role of [...this.roles, ...this.eventRoles]) {
				if(this.age < (role.config.minAge || 0) || this.age > (role.config.maxAge || Infinity)) {
					throw Error(`Data urodzin nie jest kompatybilna z grupą wiekową "${role.config.name.default}"`)
				}
			}
		}
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
		match: /^\+\d{1,3}\d{9}$/,
		set: phone => {
			if(!phone) return undefined
			
			phone = phone.replaceAll(" ", "")
			phone = phone.replace(/^00/, "+")
			if(!phone.startsWith("+") && phone.length > 10) phone = `+${phone}`
			if(phone.startsWith("8") && phone.length == 9) phone = `+353${phone}`
			if(phone.startsWith("08") && phone.length == 10) phone = `+353${phone.slice(1)}`
			return phone
		}
	}
	signature = {
		type: {
			name: String,
			time: Date
		}
	}

	org = {
		type: String,
		enum: Object.keys(Config.orgs),
		required: function() {
			// Not required for users without role
			if(this.roles.length == 0) return false

			// Otherwise, required if orgs are configures
			else if(Object.keys(Config.orgs).length > 1) return true
		}
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

	roles = [
		{
			type: String,
			ref: "Role"
		}
	]
	eventRoles = [
		{
			type: String,
			ref: "Role"
		}
	]

	eventInvites = [
		{
			type: String,
			ref: "Event"
		}
	]

	medical = userMedical
	auth = userAuth

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

	/** List of required missing details */
	get missingDetails() {
		// Required for all users
		const missingDetails = Array.conditional(
			!this.name.first || !this.name.last, "name"
		)

		// Required for parents
		if(this.isParent) missingDetails.push(...Array.conditional(
			!this.email, "email",
			!this.phone, "phone"
		))

		// Required for users with roles
		if(this.roles.length > 0) {
			missingDetails.push(...Array.conditional(
				!this.dateOfBirth, "dob"
			))
			// Required for adults
			if(this.age >= Config.adultAge) {
				missingDetails.push(...Array.conditional(
					!this.email, "email",
					!this.phone, "phone"
				))
			}
		}

		return missingDetails
	}

	/** Checks if profile is confirmed (signed) */
	get confirmed() {
		if(this.signature?.name && this.signature?.time) return true
		else return false
	}

	/** Checks if profile is complete (no missing details) */
	get profileComplete() {
		// Users with roles require confirmation
		if(this.roles.length > 0) return this.confirmed
		// Users without roles require no missing details
		else return this.missingDetails.length == 0
	}

	/* * Methods * */

	/** Adds the provided user as a parent to the user */
	async addParent(parent) {
		if(this.parents.hasID(parent.id)) return
		this.parents.push(parent.id)

		parent.children.push(this.id)

		await parent.save()
		await this.save()
	}

	/** Returns the user's role in the given unit */
	async getRoleInUnit(unit) {
		await unit.populate("roles")
		for(const role of unit.roles) {
			if(this.id == role.user.id) {
				return role
			}
		}
	}

	/** Checks if the user has a role with the given tag in any of the given units */
	async hasRoleInUnits(requiredRole, ...units) {
		for(let unit of units) {
			if(unit instanceof Promise) unit = await unit
			if(unit instanceof Array || Symbol.asyncIterator in unit) {
				for await(const asyncUnit of unit) {
					if(await this.hasRoleInUnits(requiredRole, asyncUnit)) return true
				}
			} else {
				const role = await this.getRoleInUnit(unit)
				if(!role) continue
				else if(typeof requiredRole == "function") {
					const checkResult = await requiredRole(role)
					if(checkResult === true) return true
				} else if(requiredRole instanceof Array) {
					if(requiredRole.some(tag => role.hasTag(tag))) return true
				} else if(role.hasTag(requiredRole)) return true
			}
		}
		return false
	}

	/** Checks permission and returns the result. The result is cached for future calls */
	async checkPermission(permission, fromCache=false) {
		if(!(permission instanceof Function)) {
			if(permission instanceof Object) {
				for(const index in permission) {
					await this.checkPermission(permission[index], fromCache)
				}
				return
			} else {
				throw Error(`Invalid permission "${permission}"`)
			}
		}
		this.$locals.permissionCache ||= []
		for(const cacheEntry of this.$locals.permissionCache) {
			if(cacheEntry[0] == permission) return cacheEntry[1]
		}
		if(fromCache) return undefined
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
		if(!(permission instanceof Function)) {
			throw Error("Invalid permission")
		}
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
		await this.populate("roles")
		for(const role of this.roles) {
			if(!role.unit) continue
			await role.populate("unit")
			yield role.unit
			yield * role.unit.getUpperUnitsTree()
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

	/** Verifies a signature */
	async verifySignature(signature) {
		if(!signature) throw Error("Podpis jest wymagany")
		
		// Verify server signature
		const serverSignature = signature.sign
		delete signature.sign
		if(!await Crypto.verify(JSON.stringify(signature), serverSignature)) {
			throw Error("Błąd weryfikacji podpisu")
		}

		// Check signature time
		const expiryTime = signature.time + 60000
		if(!expiryTime || expiryTime < Date.now()) {
			throw Error("Ważność podpisu wygasła. Spróbuj ponownie")
		}

		// Check signature name
		if(signature.name !== this.displayName) {
			throw Error("Nieprawidłowe imię na podpisie")
		}

		return true
	}
	
	/** Confirms and locks details */
	async confirmDetails(signature) {
		if(!signature || this.signature) return

		// Check completeness
		if(!this.medical.complete) throw Error("Brakujące dane medyczne")
		if(this.missingDetails.length > 0) throw Error("Brakujące dane profilu")
		await this.populate("parents")
		for(const parent of this.parents) {
			if(!parent.profileComplete) {
				if(parent.roles.length > 0) throw Error(`Najpierw zatwierdź dane profilu ${parent.displayName}`)
				else throw Error(`Brakujące dane profilu ${parent.displayName}`)
			}
		}
		
		this.signature = signature
		
		// Save user
		await this.save()
	}
	
	/** Removes confirmation and unlocks details */
	async unconfirmDetails() {
		if(!this.signature) return
		this.signature = undefined

		// Also unconfirm if any child is confirmed
		await this.populate("children")
		for(const child of this.children) {
			if(child.confirmed) await child.unconfirmDetails()
		}
	
		// Save user
		await this.save()
	}
	
}

const schema = mongoose.Schema.fromClass(UserClass)

schema.beforeDelete = async function() {	
	// Delete parents
	await this.populate("parents")
	for(const parent of this.parents) {
		// Keep parents with roles
		if(parent.roles.length > 0) continue
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
		const invite = event.participants.id(this.id)
		if(!invite) continue
		await invite.delete()
		await event.save()
	}

	// Delete all roles
	await Role.deleteMany({user: this.id})
}

schema.permissions = await import("./permissions.js")

export default mongoose.model("User", schema)