import mongoose from "mongoose"

import { FunkcjaType, FunkcjaNames } from "modules/types.js"

export class FunkcjaClass {
	/* * Properties * */

	type = {
		type: Number,
		enum: Object.values(FunkcjaType),
		default: FunkcjaType.SZEREGOWY
	}
	user = {
		type: String,
		ref: "User"
	}
	jednostka = {
		type: String,
		ref: "Jednostka"
	}


	/* * Getters * */

	/** Returns the funkcja type name. Will throw an error if the jednostka field is not populated */
	get displayName() {
		if(!this.populated("jednostka")) throw Error("Jednostka field must be populated to derive funkcja name")
		if(!this.jednostka) return "(nieznana funkcja)"
		
		return FunkcjaNames[this.jednostka.type]?.[this.type][0] || "(nieznana funkcja)"
	}
}

const schema = mongoose.Schema.fromClass(FunkcjaClass)

schema.beforeDelete = async function() {
	// Remove self from user
	await this.populate("user")
	this.user.funkcje = this.user.funkcje.filter(f => f.id != this.id)
	await this.user.save()

	// Remove self from jednostka
	await this.populate("jednostka")
	this.jednostka.funkcje = await this.jednostka.funkcje.filter(f => f.id != this.id)
	await this.jednostka.save()
}

export default mongoose.model("Funkcja", schema, "funkcje")