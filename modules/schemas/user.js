import mongoose from "mongoose"
import randomID from "modules/randomID.js"
import * as Text from "modules/text.js"
import * as datetime from "jsr:@std/datetime"

import Funkcja from "modules/schemas/funkcja.js"
import { FunkcjaType } from "modules/types.js"
import HTTPError from "modules/server/error.js"
import Wyjazd from "modules/schemas/wyjazd.js"

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
	accessCode = String
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
	funkcjeWyjazdowe = [
		{
			type: String,
			ref: "Funkcja"
		}
	]
	wyjazdy = [
		{
			type: String,
			ref: "Wyjazd"
		}
	]


	/* * Getters * */

	/** Returns the user's name in the format "First Last" */
	get displayName() {
		let name = this.name.first
		if(!name) return "(brak imienia)"
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

	/** Adds the provided user as a parent to the user */
	async addParent(parent) {
		if(this.parents.hasID(parent.id)) return
		this.parents.push(parent.id)

		parent.children.push(this.id)

		await parent.save()
		await this.save()
	}

	/** Returns the user's funkcja in the given jednostka */
	async getFunkcjaInJednostka(jednostka) {
		const funkcjeKey = jednostka instanceof Wyjazd ? "funkcjeWyjazdowe" : "funkcje"
		await this.populate(funkcjeKey)
		return this[funkcjeKey].find(f => f.jednostka.id == jednostka.id)
	}

	/** Checks if the user has a funkcja in any of the given jednostki */
	async hasFunkcjaInJednostki(requiredFunkcja, ...jednostki) {
		for(const jednostka of jednostki) {
			if(jednostka instanceof Array || Symbol.asyncIterator in jednostka) {
				for await(const asyncJednostka of jednostka) {
					if(await this.hasFunkcjaInJednostki(requiredFunkcja, asyncJednostka)) return true
				}
			} else {
				const funkcja = await this.getFunkcjaInJednostka(jednostka)
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
	}

	/** Returns an asynchronous list of all user's jednostki and upper jednostki */
	async * getJednostkiTree() {
		await this.populate("funkcje")
		for(const funkcja of this.funkcje) {
			await funkcja.populate("jednostka")
			yield funkcja.jednostka
			yield * funkcja.jednostka.getUpperJednostkiTree()
		}
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

	// Remove self from all wyjazdy
	await this.populate("wyjazdy")
	for(const wyjazd of this.wyjazdy) {
		wyjazd.participants = wyjazd.participants.filter(p => p.user.id != this.id)
		await wyjazd.save()
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
		// Przyboczni of member jednostka and of all upper jednostki can access
		if(await user.hasFunkcjaInJednostki(f => f >= FunkcjaType.PRZYBOCZNY, this.getJednostkiTree())) return true
		// Przyboczni of child's member jednostka and of all upper jednostki can access
		await this.populate("children")
		for(const child of this.children) {
			if(await user.hasFunkcjaInJednostki(f => f >= FunkcjaType.PRZYBOCZNY, child.getJednostkiTree())) return true
		}
		return false
	},

	async MODIFY(user) {
		if(!await user.checkPermission(this.PERMISSIONS.ACCESS)) return false
		// Niepełnoletni with parents cannot modify their own details
		if(user.id == this.id) {
			if(this.age < 18 && this.parents?.length > 0) return true
			return true
		}
		// Parent can modify their children
		if(user.children.hasID(this.id)) return true
		// Druyżynowi of member jednostka and of all upper jednostki can modify
		if(await user.hasFunkcjaInJednostki(FunkcjaType.DRUŻYNOWY, this.getJednostkiTree())) return true
		// Druyżynowi of child's member jednostka and of all upper jednostki can modify
		if(this.isParent) {
			await this.populate("children")
			for(const child of this.children) {
				if(await user.hasFunkcjaInJednostki(FunkcjaType.DRUŻYNOWY, child.getJednostkiTree())) return true
			}
		}
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
		// Druyżynowi of member jednostka and of all upper jednostki can delete
		if(await user.hasFunkcjaInJednostki(FunkcjaType.DRUŻYNOWY, this.getJednostkiTree())) return true
		return false
	}
}

export default mongoose.model("User", schema)