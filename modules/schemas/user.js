import mongoose from "mongoose"
import randomID from "modules/randomID.js"
import * as Text from "modules/text.js"
import * as datetime from "jsr:@std/datetime"

import Jednostka from "modules/schemas/jednostka.js"
import Funkcja from "modules/schemas/funkcja.js"
import { FunkcjaType } from "modules/types.js"
import HTTPError from "modules/server/error.js"

const schema = new mongoose.Schema({
	name: {
		first: String,
		last: String
	},
	dateOfBirth: {
		type: Date,
		max: Date.now
	},
	accessCode: String,
	parents: [
		{
			type: String,
			ref: "User"
		}
	],
	children: [
		{
			type: String,
			ref: "User"
		}
	],
	funkcje: [
		{
			type: String,
			ref: "Funkcja"
		}
	]
},
{
	statics: {
		findByAccessCode(code) {
			if(!/^\d+$/.test(code)) return null
			return this.findOne({ accessCode: code })
		}
	},
	methods: {
		async generateAccessCode() {
			this.accessCode = randomID(2, "numeric")
			await this.save()
			return this.accessCode
		},

		async updateName(first="", last="") {
			this.name.first = Text.formatName(first)
			this.name.last = Text.formatName(last)
			await this.save()
		},

		async updateDateOfBirth(date) {
			this.dateOfBirth = date
			if(this.isParent && this.age < 18) {
				throw Error("Rodzic / opiekun musi być osobą pełnoletnią")
			}
			await this.save()
		},

		async addParent(parent) {
			if(this.parents.length >= 2) throw Error("Limit dwóch rodziców / opiekunów")
			if(this.parents.hasID(parent.id)) return
			this.parents.push(parent.id)

			parent.children.push(this.id)

			await parent.save()
			await this.save()
		},

		async getFunkcjaInJednostka(jednostka) {
			await this.populate("funkcje")
			return this.funkcje.find(f => f.jednostka.id == jednostka.id)
		},

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
		},

		async checkPermission(permission) {
			this.$locals.permissionCache ||= []
			for(const cacheEntry of this.$locals.permissionCache) {
				if(cacheEntry[0] == permission) return cacheEntry[1]
			}
			const permissionState = await permission(this)
			this.$locals.permissionCache.push([permission, permissionState])
			return permissionState
		},

		async requirePermission(permission, message) {
			if(await this.checkPermission(permission)) return
			throw new HTTPError(403, message)
		},

		hasPermission(permission) {
			this.$locals.permissionCache ||= []
			for(const cacheEntry of this.$locals.permissionCache) {
				if(cacheEntry[0] == permission) return cacheEntry[1]
			}
			throw Error(`Permission ${permission.name.replace(/^bound /, "")} not checked`)
		}
	},
	virtuals: {
		displayName: {
			get() {
				let name = this.name.first
				if(!name) return "(brak imienia)"
				else if(this.name.last) name += " " + this.name.last
				return name
			}
		},

		age: {
			get() {
				if(!this.dateOfBirth) return null
				const age = datetime.difference(new Date(), this.dateOfBirth)
				return age.years
			}
		},

		isParent: {
			get() {
				return this.children.length > 0
			}
		},

		// Recursive list of all jednostki and upperJednostki of all funkcje
		jednostkiTree: {
			async * get() {
				await this.populate("funkcje")
				for(const funkcja of this.funkcje) {
					await funkcja.populate("jednostka")
					yield funkcja.jednostka
					yield * funkcja.jednostka.upperJednostkiTree
				}
			}
		}
	}
})

schema.beforeDelete = async function() {
	// Ensure no parents
	await this.populate("parents")
	for(const parent of this.parents) {
		if(parent.funkcje.length > 0) continue
		if(parent.children.length > 0) continue
		throw Error("Nie można usunąć użytkownika z rodzicem / opiekunem")
	}
	
	// Delete all funkcje
	await Funkcja.deleteMany({user: this.id})
}

schema.beforeValidate = function() {
	// Ensure at least one funkcja
	if(!this.isParent && this.funkcje.length == 0) throw Error("Użytkownik musi mieć przynajmniej jedną funkcję")
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
		if(await user.hasFunkcjaInJednostki(f => f >= FunkcjaType.PRZYBOCZNY, this.jednostkiTree)) return true
		// Przyboczni of child's member jednostka and of all upper jednostki can access
		await this.populate("children")
		for(const child of this.children) {
			if(await user.hasFunkcjaInJednostki(f => f >= FunkcjaType.PRZYBOCZNY, child.jednostkiTree)) return true
		}
		return false
	},

	async MODIFY(user) {
		if(!await user.checkPermission(this.PERMISSIONS.ACCESS)) return false
		// Niepełnoletni with parents cannot modify their own details
		if(user.id == this.id) {
			if(this.age >= 18) return true
			if(this.parents?.length > 0) return false
			return true
		}
		// Druyżynowi of member jednostka and of all upper jednostki can modify
		if(await user.hasFunkcjaInJednostki(FunkcjaType.DRUŻYNOWY, this.jednostkiTree)) return true
		return false
	},

	async DELETE(user) {
		// User can never delete themselves
		if(user.id == this.id) return false
		// Druyżynowi of member jednostka and of all upper jednostki can delete
		if(await user.hasFunkcjaInJednostki(FunkcjaType.DRUŻYNOWY, this.jednostkiTree)) return true
		return false
	}
}

export default mongoose.model("User", schema)