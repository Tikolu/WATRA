import mongoose from "npm:mongoose"
import randomID from "modules/randomID.js";
import * as Text from "modules/text.js";

import Jednostka from "modules/schemas/jednostka.js";

import shortID from "modules/database/shortID.js"


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
	funkcje: [
		{
			funkcja: String,
			jednostka: {
				type: String,
				ref: "Jednostka"
			}
		}
	]
},
{
	statics: {
		findByAccessCode(code) {
			if(!/^\d{8}$/.test(code)) return null
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
			await this.save()
		},
		
		async addFunkcja(jednostka, funkcja) {
			// Check if user already has this funkcja
			for(const f of this.funkcje) {
				if(f.funkcja === funkcja && f.jednostka == jednostka.id) {
					throw "Użytkownik już ma tę funkcję"
				}
			}
			
			// Add user to jednostka members, if not there already
			if(!jednostka.members.includes(this.id)) {
				jednostka.members.push(this.id)
				await jednostka.save()
			}

			// Add funkcja to user
			this.funkcje.push({
				funkcja,
				jednostka: jednostka.id
			})

			await this.save()
		},

		getFunkcjeInJednostka(jednostka) {
			const funkcje = []
			for(const funkcja of this.funkcje) {
				if(funkcja.jednostka == jednostka.id) funkcje.push(funkcja.funkcja)
			}

			return funkcje
		},

		async removeFunkcjeInJednostka(jednostka) {
			this.funkcje = this.funkcje.filter(funkcja => !funkcja.jednostka == jednostka.id)
			await this.save()
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
		}
	}
})

schema.pre("deleteOne", {document: true}, async function() {
	// Leave all jednostki
	for(const funkcja of this.funkcje) {
		const jednostka = await Jednostka.findById(funkcja.jednostka)
		if(!jednostka) continue
		jednostka.members = jednostka.members.filter(id => !id == this.id)
		await jednostka.save()
	}
})



export default mongoose.model("User", schema)