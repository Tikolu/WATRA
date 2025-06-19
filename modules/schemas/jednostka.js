import mongoose from "mongoose"
import * as Text from "modules/text.js"

import Funkcja from "modules/schemas/funkcja.js"

import { FunkcjaType, JednostkaType, FunkcjaNames } from "modules/types.js"

export class JednostkaClass {
	/* * Properties * */
	
	name = String
	type = {
		type: Number,
		enum: Object.values(JednostkaType)
	}
	funkcje = [
		{
			type: String,
			ref: "Funkcja"
		}
	]
	subJednostki = [
		{
			type: String,
			ref: "Jednostka"
		}
	]
	upperJednostki = [
		{
			type: String,
			ref: "Jednostka"
		}
	]


	/* * Getters * */

	/** Returns the full jednostka name */
	get displayName() {
		return this.name || `(${this.typeName.toLowerCase()} bez nazwy)`
	}
	
	/** Returns the jednostka type name */
	get typeName() {
		const type = Object.keys(JednostkaType)[this.type] || "jednostka"
		return Text.capitalise(type)
	}


	/* Methods */

	/** Updates the jednostka name */
	async updateName(name) {
		this.name = name.trim()
		await this.save()
	}
	
	/** Add user to jednostka with a funkcja, any existing funkcja in the jednostka gets overwritten */
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

		// Attempt to find existing funkcja of user in this jednostka
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
		funkcja.jednostka = this.id

		// Only one drużynowy per jednostka, only one (pod)zastępowy per zastęp
		if(funkcja.type == 2 || (this.type == JednostkaType.ZASTĘP && funkcja.type == 1)) {
			const funkcjaGłówna = this.funkcje.find(f => f.type == funkcja.type)
			if(funkcjaGłówna) {
				await funkcjaGłówna.populate("jednostka")
				throw Error(`${this.typeName} ma już funkcję: ${funkcjaGłówna.displayName}`)
			}
		}

		// Add funkcja to jednostka, unless already added
		if(!this.funkcje.hasID(funkcja.id)) {
			this.funkcje.push(funkcja)
		}
		
		// Add funkcja to user, unless already added
		const userFunkcjeKey = funkcja.wyjazdowa ? "funkcjeWyjazdowe" : "funkcje"
		if(!user[userFunkcjeKey].hasID(funkcja.id)) {
			user[userFunkcjeKey].push(funkcja.id)
		}

		await funkcja.save()
		await this.save()
		await user.save()

		// Delete any szeregowy funkcje in upper jednostki
		for await(const upperJednostka of this.getUpperJednostkiTree()) {
			const existingFunkcja = await user.getFunkcjaInJednostka(upperJednostka)
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

	/** Check if user is in jednostka */
	async hasMember(user) {
		await this.populate("funkcje")
		return this.funkcje.some(f => f.user.id == user.id)
	}
	
	/** Link an existing jednostka as subJednostka */
	async addSubJednostka(subJednostka) {
		// Check jednostka type compatibility
		if(subJednostka.type >= this.type) throw Error("Nie można dodać jednostki o wyższym lub równym typie")
		if(this.type == 0) throw Error("Nie można dodać jednostki pod zastęp") 
		
		// Add subJednostka to subJednostki, unless already added
		if(!this.subJednostki.hasID(subJednostka.id)) {
			this.subJednostki.push(subJednostka.id)
		}

		// Add jednostka to subJednostka's upperJednostki, unless already added
		if(!subJednostka.upperJednostki.hasID(this.id)) {
			subJednostka.upperJednostki.push(this.id)
		}

		await this.save()
		await subJednostka.save()
	}

	/** Returns a list of possible funkcja levels and names for this jednostka */
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

	/** Recursive generator of all upperJednostki */
	async * getUpperJednostkiTree(exclude=[]) {
		exclude = [...exclude]
		await this.populate("upperJednostki", {exclude})

		for(const upperJednostka of this.upperJednostki) {
			if(exclude.hasID(upperJednostka.id)) continue
			yield upperJednostka
			for await(const jednostka of upperJednostka.getUpperJednostkiTree(exclude)) {
				if(exclude.hasID(jednostka.id)) continue
				exclude.push(jednostka.id)
				yield jednostka
			}
		}
	}

	/** Recursive generator of all subJednostki */
	async * getSubJednostkiTree(exclude=[]) {
		exclude = [...exclude]
		await this.populate("subJednostki", {exclude})

		for(const subJednostka of this.subJednostki) {
			if(exclude.hasID(subJednostka.id)) continue
			yield subJednostka
			for await(const jednostka of subJednostka.getSubJednostkiTree(exclude)) {
				if(exclude.hasID(jednostka.id)) continue
				exclude.push(jednostka.id)
				yield jednostka
			}
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

	/* Recursive list of all members (including members of subJednostki) */
	async * getSubMembers(exclude=[]) {
		exclude = [...exclude]
		// Yield all members of this jednostka
		for(const member of await this.getMembers(exclude)) {
			exclude.push(member.id)
			yield member
		}
		// Yield all members of the all subJednostki
		for await(const subJednostka of this.getSubJednostkiTree()) {
			for(const member of await subJednostka.getMembers(exclude)) {
				if(exclude.hasID(member.id)) continue
				exclude.push(member.id)
				yield member
			}
		}
	}
}

const schema = mongoose.Schema.fromClass(JednostkaClass)

schema.beforeDelete = async function() {
	await this.populate([
		"upperJednostki",
		"subJednostki"
	])
	await this.populate({"funkcje": "user"})
	
	// Chose primary upper jednostka
	const primaryUpperJednostka = this.upperJednostki[0]
	if(!primaryUpperJednostka) throw Error("Nie można usunąć jednostki bez jednostek nadrzędnych")

	// Add all members to primary upper jednostka
	for(const funkcja of this.funkcje) {
		// Skip adding if user already has a funkcja in the primary upper jednostka
		if(await funkcja.user.hasFunkcjaInJednostki(f => f >= FunkcjaType.SZEREGOWY, primaryUpperJednostka)) continue
		await primaryUpperJednostka.addMember(funkcja.user)
	}
	
	// Delete funkcje
	await Funkcja.deleteMany({jednostka: this.id})

	// Remove self from all upperJednostki
	for(const upperJednostka of this.upperJednostki) {
		upperJednostka.subJednostki = upperJednostka.subJednostki.filter(j => j.id != this.id)
		await upperJednostka.save()
	}

	// Remove self from all subJednostki and transfer subJednostki to primary upper jednostka
	for(const subJednostka of this.subJednostki) {
		subJednostka.upperJednostki = subJednostka.upperJednostki.filter(j => j.id != this.id)
		await primaryUpperJednostka.addSubJednostka(subJednostka)
	}
}

schema.permissions = {
	async ACCESS(user) {
		// Members can access their jednostka
		if(await this.hasMember(user)) return true

		// Przyboczni of all upper jednostki and sub jednostki can access
		if(await user.hasFunkcjaInJednostki(f => f >= FunkcjaType.PRZYBOCZNY, this.getUpperJednostkiTree(), this.getSubJednostkiTree())) return true

		return false
	},

	async MODIFY(user) {
		// Drużynowy of this and all upper jednostki can modify
		if(await user.hasFunkcjaInJednostki(FunkcjaType.DRUŻYNOWY, this, this.getUpperJednostkiTree())) return true
		return false
	},

	async DELETE(user) {
		// Only drużynowi of direct upper jednostka can delete
		for(const upperJednostka of this.upperJednostki) {
			const funkcja = await user.getFunkcjaInJednostka(upperJednostka)
			if(funkcja?.type == FunkcjaType.DRUŻYNOWY) return true
		}
		return false
	}
}

export default mongoose.model("Jednostka", schema, "jednostki")