import mongoose from "npm:mongoose"
import { default as Funkcja, FunkcjaType } from "modules/schemas/funkcja.js";

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
			if(!funkcja) funkcja = new Funkcja({
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
			if(subJednostka.type >= this.type) {
				throw "Nie można dodać jednostki o wyższym lub równym typie"
			}
			
			// Add subJednostka to subJednostki, unless already added
			if(!this.subJednostki.hasID(subJednostka.id)) {
				this.subJednostki.push(subJednostka.id)
			}

			// Add jednostka to subJednostka's upperJednostki, unless already added
			if(!subJednostka.upperJednostki.hasID(this.id)) {
				subJednostka.upperJednostki.push(this.id)
			}

			await this.save()
		}
	},

	virtuals: {
		displayName: {
			get() {
				return this.name || "(brak nazwy)"
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

schema.pre("deleteOne", {document: true}, async function() {
	// Remove self from all upperJednostki
	await this.populate("upperJednostki")
	for(const upperJednostka of this.upperJednostki) {
		await upperJednostka.removeSubJednostka(this)
	}
	
	// Remove funkcje from all members
	await this.populate("members")
	for(const member of this.members) {
		await member.removeFunkcjeInJednostka(this)
	}
})

export default mongoose.model("Jednostka", schema, "jednostki")