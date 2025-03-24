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
			this.accessCode = randomID(8, "numeric")
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

		getFunkcjeInJednostka(jednostka) {
			const funkcje = []
			for(const funkcja of this.funkcje) {
				if(funkcja.jednostka == jednostka.id) funkcje.push(funkcja.funkcja)
			}

			return funkcje
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
		}
	}
})

schema.beforeDelete = function() {
	// Delete all funkcje
	Funkcja.deleteMany({user: this.id})
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
		// Drużynowy can access members of their drużyna
		await user.populate({
			path: "funkcje",
			populate: "jednostka"
		})
		for(const funkcja of user.funkcje) {
			if(funkcja.type < FunkcjaType.PRZYBOCZNY) continue
			if(funkcja.jednostka.hasMember(this)) return true
		}
		return false
	},

	async MODIFY(user) {
		if(!await user.checkPermission(this.PERMISSIONS.ACCESS)) return false
		return true
	},

	async DELETE(user) {
		if(!await user.checkPermission(this.PERMISSIONS.ACCESS)) return false
		return false
	}
}

export default mongoose.model("User", schema)