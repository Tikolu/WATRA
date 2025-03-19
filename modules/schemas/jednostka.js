import mongoose from "mongoose"
import { default as Funkcja } from "modules/schemas/funkcja.js"
import * as Text from "modules/text.js"

import { FunkcjaType, JednostkaType, FunkcjaNames } from "modules/types.js"

const schema = new mongoose.Schema({
	name: String,
	type: {
		type: Number,
		enum: Object.values(JednostkaType),
		default: JednostkaType.HUFIEC
	},
	funkcje: [
		{
			type: String,
			ref: "Funkcja"
		}
	],
	subJednostki: [
		{
			type: String,
			ref: "Jednostka"
		}
	],
	upperJednostki: [
		{
			type: String,
			ref: "Jednostka"
		}
	],
},
{
	methods: {
		async updateName(name) {
			this.name = name.trim()
			await this.save()
		},
		
		async setFunkcja(user, funkcjaType=FunkcjaType.SZEREGOWY) {
			if(!Object.values(FunkcjaType).includes(funkcjaType)) throw Error("Nieprawidłowy typ funkcji")
			// Populate funkcje
			await this.populate("funkcje")
			
			// Find existing funkcja of user in this jednostka
			let funkcja = this.funkcje.find(f => f.user.id == user.id)
			if(funkcja?.type === funkcjaType) throw Error(`Użytkownik już ma tą funkcję`)
			
			// Alternatively, create new funkcja
			funkcja ||= new Funkcja({
				user: user.id,
				jednostka: this.id
			})

			// Only one drużynowy per jednostka, only one (pod)zastępowy per zastęp
			if(funkcjaType == 2 || (this.type == JednostkaType.ZASTĘP && funkcjaType == 1)) {
				const funkcjaGłówna = this.funkcje.find(f => f.type == funkcjaType)
				if(funkcjaGłówna) {
					await funkcjaGłówna.populate("jednostka")
					throw Error(`${this.typeName} ma już funkcję: ${funkcjaGłówna.displayName}`)
				}
			}
			funkcja.type = funkcjaType

			// Add funkcja to jednostka, unless already added
			if(!this.funkcje.hasID(funkcja.id)) {
				this.funkcje.push(funkcja.id)
			}
			// Add funkcja to user, unless already added
			if(!user.funkcje.hasID(funkcja.id)) {
				user.funkcje.push(funkcja.id)
			}

			// Sort funkcje
			this.funkcje.sort((a, b) => b.type - a.type)

			await funkcja.save()
			await this.save()
			await user.save()
		},

		async addMember(user) {
			await this.setFunkcja(user)
		},

		async hasMember(user) {
			await this.populate({path: "funkcje", forceRepopulate: false})
			return this.funkcje.some(f => f.user.id == user.id)
		},
		
		async addSubJednostka(subJednostka) {
			// Check jednostka type compatibility
			if(subJednostka.type >= this.type) throw Error("Nie można dodać jednostki o wyższym lub równym typie")
			if(subJednostka.type < 0) throw Error(`Nie można dodać jednostki pod ${this.typeName}`)
			
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
		},

		getFunkcjaOptions() {
			const funkcjaOptions = []
			for(const funkcjaLevel in FunkcjaNames[this.type]) {
				for(const funkcjaName of FunkcjaNames[this.type][funkcjaLevel]) {
					funkcjaOptions.push([funkcjaLevel, funkcjaName])
				}
			}
			return funkcjaOptions
		}
	},

	virtuals: {
		displayName: {
			get() {
				return this.name || `(${this.typeName.toLowerCase()} bez nazwy)`
			}
		},
		typeName: {
			get() {
				const type = Object.keys(JednostkaType)[this.type]
				return Text.capitalise(type)
			}
		}
	}
})

schema.beforeDelete = async function() {
	await this.populate([
		"upperJednostki",
		"subJednostki",
		{path: "funkcje", populate: "user"}
	])
	
	// Chose primary upper jednostka
	const primaryUpperJednostka = this.upperJednostki[0]
	if(!primaryUpperJednostka) throw Error("Nie można usunąć jednostki bez jednostek nadrzędnych")

	// Add all members to primary upper jednostka
	for(const funkcja of this.funkcje) {
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
		// Only members can access jednostki
		await this.hasMember(user)
		return true
	},

	async MODIFY(user) {
		// Only drużynowi can modify jednostki
		await user.populate("funkcje")
		for(const funkcja of user.funkcje) {
			if(funkcja.jednostka.id != this.id) continue
			if(funkcja.type >= FunkcjaType.DRUŻYNOWY) return true
		}
		return false
	},

	async DELETE(user) {
		// Only drużynowi of upper jednostki can delete
		await user.populate("funkcje")
		for(const funkcja of user.funkcje) {
			if(funkcja.type < FunkcjaType.DRUŻYNOWY) continue
			if(this.upperJednostki.hasID(funkcja.jednostka)) return true
		}
		return false
	}
}

export default mongoose.model("Jednostka", schema, "jednostki")