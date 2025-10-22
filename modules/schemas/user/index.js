import mongoose from "mongoose"
import randomID from "modules/randomID.js"
import * as Text from "modules/text.js"
import * as datetime from "jsr:@std/datetime"

import Role from "modules/schemas/role.js"
import Event from "modules/schemas/event.js"
import Log from "modules/schemas/log.js"

import { RoleType } from "modules/types.js"
import HTTPError from "modules/server/error.js"

import userMedical from "./medical.js"

export class UserClass {
	/* * Static functions * */

	/** Finds a user by their access code */
	static findByAccessCode(code) {
		if(!/^\d+$/.test(code)) return null
		return this.findOne({ accessCode: code })
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
		validate: function(value) {
			if(this.isParent && this.age < 18) {
				throw Error("Rodzic / opiekun musi być osobą pełnoletnią")
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
			phone = phone.replaceAll(" ", "")
			phone = phone.replace(/^00/, "+")
			if(!phone.startsWith("+") && phone.length > 10) phone = `+${phone}`
			if(phone.startsWith("8") && phone.length == 9) phone = `+353${phone}`
			if(phone.startsWith("08")) phone = `+353${phone.slice(1)}`
			return phone
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

	/** Checks if the user has a role in any of the given units */
	async hasRoleInUnits(requiredRole, ...units) {
		for(const unit of units) {
			if(unit instanceof Array || Symbol.asyncIterator in unit) {
				for await(const asyncUnit of unit) {
					if(await this.hasRoleInUnits(requiredRole, asyncUnit)) return true
				}
			} else {
				const role = await this.getRoleInUnit(unit)
				if(typeof requiredRole == "function") {
					const checkResult = await requiredRole(role?.type)
					if(checkResult === true) return true
				} else if(requiredRole instanceof Array) {
					if(requiredRole.includes(role?.type)) return true
				} else if(role?.type === requiredRole) return true
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
		await this.populate("roles")
		for(const role of this.roles) {
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
		const invite = event.findUserInvite(this)
		if(!invite) continue
		await invite.delete()
		await event.save()
	}

	// Delete all roles
	await Role.deleteMany({user: this.id})
}

schema.permissions = await import("./permissions.js")

export default mongoose.model("User", schema)