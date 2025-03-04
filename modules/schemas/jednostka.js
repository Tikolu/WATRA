import mongoose from "npm:mongoose"

import User from "modules/schemas/user.js"

const schema = new mongoose.Schema({
	name: String,
	members: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		}
	]
},
{
	methods: {
		async updateName(name) {
			this.name = name
			await this.save()
		},
		
		async addMember(user) {
			// Add member to jednostka, unless already added
			if(!this.members.includes(user.id)) {
				this.members.push(user.id)
			}

			// Add funkcja szeregowego to user
			await user.addFunkcja(this, "szeregowy")

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
	// Remove funkcje from all members
	await this.populate("members")
	for(const member of this.members) {
		await member.removeFunkcjeInJednostka(this)
	}
})

export default mongoose.model("Jednostka", schema, "jednostki")