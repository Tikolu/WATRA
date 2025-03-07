import mongoose from "npm:mongoose"

import User from "modules/schemas/user.js"

const schema = new mongoose.Schema({
	name: String,
	members: [
		{
			type: String,
			ref: "User"
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
		
		async addMember(user) {
			// Add member to jednostka, unless already added
			if(!this.members.hasID(user.id)) {
				this.members.push(user.id)
			}

			// Add funkcja szeregowego to user
			await user.addFunkcja(this, "szeregowy")

			await this.save()
		},
		
		async addSubJednostka(subJednostka) {
			// Add subJednostka to subJednostki, unless already added
			if(!this.subJednostki.hasID(subJednostka.id)) {
				this.subJednostki.push(subJednostka.id)
			}

			// Add jednostka to subJednostka's upperJednostki
			await subJednostka.addUpperJednostka(this)

			await this.save()
		},

		async addUpperJednostka(upperJednostka) {
			// Add upperJednostka to upperJednostki, unless already added
			if(!this.upperJednostki.hasID(upperJednostka.id)) {
				this.upperJednostki.push(upperJednostka.id)
			}

			await this.save()
		},

		async removeUpperJednostka(upperJednostka) {
			// Return if upperJednostka is not in upperJednostki
			if(!this.upperJednostki.hasID(upperJednostka.id)) return
			// Remove upperJednostka from upperJednostki
			this.upperJednostki = this.upperJednostki.filter(j => j != upperJednostka.id)
			// Remove self from upperJednostka's subJednostki
			upperJednostka.removeSubJednostka(this)
			await this.save()
		},

		async removeSubJednostka(subJednostka) {
			// Return if subJednostka is not in subJednostki
			if(!this.subJednostki.hasID(subJednostka.id)) return
			// Remove subJednostka from subJednostki
			this.subJednostki = this.subJednostki.filter(j => j != subJednostka.id)
			// Remove self from subJednostka's upperJednostki
			subJednostka.removeUpperJednostka(this)
			await this.save()
		}
	},

	virtuals: {
		displayName: {
			get() {
				return this.name || "(brak nazwy)"
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

	// Remove self 
	
	// Remove funkcje from all members
	await this.populate("members")
	for(const member of this.members) {
		await member.removeFunkcjeInJednostka(this)
	}
})

export default mongoose.model("Jednostka", schema, "jednostki")