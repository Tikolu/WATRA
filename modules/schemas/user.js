import mongoose from "npm:mongoose"
import randomID from "modules/randomID.js";
import * as Text from "modules/text.js";

import Jednostka from "modules/schemas/jednostka.js"
import Funkcja from "modules/schemas/funkcja.js"

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
			type: String,
			ref: "Funkcja"
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

		getFunkcjeInJednostka(jednostka) {
			const funkcje = []
			for(const funkcja of this.funkcje) {
				if(funkcja.jednostka == jednostka.id) funkcje.push(funkcja.funkcja)
			}

			return funkcje
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