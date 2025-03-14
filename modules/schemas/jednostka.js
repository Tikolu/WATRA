import mongoose from "npm:mongoose"
import { default as Funkcja, FunkcjaType } from "modules/schemas/funkcja.js"
import * as Text from "modules/text.js"

export const JednostkaType = {
	ZASTĘP: 0,
	DRUŻYNA: 1,
	HUFIEC: 2,
	CHORĄGIEW: 3
}

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
			// Populate funkcje
			await this.populate("funkcje")
			
			// Find existing funkcja of user in this jednostka
			let funkcja = this.funkcje.find(f => f.user.id == user.id)
			
			// Alternatively, create new funkcja
			funkcja ||= new Funkcja({
				user: user.id,
				jednostka: this.id
			})

			// Ensure only one funkcja główna
			if(funkcjaType == 2) {
				const funkcjaGłówna = this.funkcje.find(f => f.type == 2)
				if(funkcjaGłówna) throw `${this.typeName} ma już funkcję: ${funkcjaGłówna.displayName}`
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

			await this.save()
			await funkcja.save()
			await user.save()
		},

		async addMember(user) {
			await this.setFunkcja(user)
		},
		
		async addSubJednostka(subJednostka) {
			// Check jednostka type compatibility
			if(subJednostka.type >= this.type) throw "Nie można dodać jednostki o wyższym lub równym typie"
			if(subJednostka.type < 0) throw `Nie można dodać jednostki pod ${this.typeName}`
			
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
	if(!primaryUpperJednostka) throw "Nie można usunąć jednostki bez jednostek nadrzędnych"

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

export default mongoose.model("Jednostka", schema, "jednostki")