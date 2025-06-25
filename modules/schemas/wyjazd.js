import mongoose from "mongoose"
import * as Text from "modules/text.js"
import * as datetime from "jsr:@std/datetime"

import Funkcja from "modules/schemas/funkcja.js"

import { JednostkaClass } from "modules/schemas/jednostka.js"
import { FunkcjaType, WyjazdoweFunkcjaNames } from "modules/types.js"

export class WyjazdClass extends JednostkaClass {
	/* * Properties * */

	upperJednostki = undefined
	subJednostki = undefined
	type = undefined
	wyjazdInvites = undefined

	dates = {
		start: {
			type: Date,
			min: MIN_DATE,
			max: MAX_DATE
		},
		end: {
			type: Date,
			min: MIN_DATE,
			max: MAX_DATE
		}
	}

	invitedJednostki = [
		{
			jednostka: {
				type: String,
				ref: "Jednostka"
			},
			state: {
				type: String,
				enum: ["pending", "accepted", "declined"],
				default: "pending"
			}
		}
	]

	participants = [
		{
			user: {
				type: String,
				ref: "User"
			},
			jednostka: {
				type: String,
				ref: "Jednostka"
			},
			state: {
				type: "String",
				enum: ["pending", "accepted", "declined"],
				default: "pending"
			}
		}
	]


	/* * Getters * */
	
	/** Returns wyjazd type name, based on its length */
	get typeName() {
		const length = this.length
		if(length === null) return "Wyjazd"
		if(length < 1) return "Akcja"
		if(length < 4) return "Biwak"
		return "Obóz"
	}

	/** Gets the length of the wyjazd in days */
	get length() {
		if(!this.dates.start || !this.dates.end) return null
		const difference = datetime.difference(this.dates.start, this.dates.end)
		return difference.days
	}

	/* * Methods * */

	/** Sets a funkcja for a wyjazd */
	async setFunkcja(user, funkcjaType) {
		const funkcja = new Funkcja({
			type: funkcjaType,
			wyjazdowa: true
		})
		
		await super.setFunkcja(user, funkcja)
	}

	/** Sets the dates for the wyjazd */
	async updateDates(startDate, endDate) {
		this.dates.start = startDate ? new Date(startDate) : undefined
		this.dates.end = endDate ? new Date(endDate) : undefined

		if(this.dates.start && this.dates.end && this.dates.start >= this.dates.end) throw new Error("Data rozpoczęcia musi być przed datą końca")

		await this.save()
	}

	/** Returns possible funkcje for a wyjazd */
	getFunkcjaOptions() {
		return super.getFunkcjaOptions(WyjazdoweFunkcjaNames)
	}

	getUpperJednostkiTree() {
		return []
	}
}

const schema = mongoose.Schema.fromClass(WyjazdClass)

schema.beforeDelete = async function() {
	await this.populate({"funkcje": "user"})

	// Delete funkcje
	await Funkcja.deleteMany({jednostka: this.id, wyjazdowa: true})

	// Delete invites
	await this.populate({"invitedJednostki": "jednostka"})
	for(const invite of this.invitedJednostki) {
		invite.jednostka.wyjazdInvites = invite.jednostka.wyjazdInvites.filter(i => i.id != this.id)
		await invite.jednostka.save()
	}
}

schema.permissions = {
	async CREATE(user) {
		// Kadra of a jednostka can create a wyjazd
		await user.populate("funkcje")
		return user.funkcje.some(f => f.type >= FunkcjaType.PRZYBOCZNY)
	},
	
	async ACCESS(user) {
		// Kadra of a wyjazd can access
		const userFunkcja = await user.getFunkcjaInJednostka(this)
		if(userFunkcja?.type >= FunkcjaType.KADRA) return true

		return false
	},

	async MODIFY(user) {
		if(!await user.checkPermission(this.PERMISSIONS.ACCESS)) return false

		// Komendant of a wyjazd can modify
		const userFunkcja = await user.getFunkcjaInJednostka(this)
		if(userFunkcja?.type == FunkcjaType.KOMENDANT) return true

		return true
	},

	async DELETE(user) {
		if(!await user.checkPermission(this.PERMISSIONS.MODIFY)) return false
		
		return true
	}
}

export default mongoose.model("Wyjazd", schema, "wyjazdy")