import mongoose from "mongoose"

import { FunkcjaType, FunkcjaNames, WyjazdoweFunkcjaNames} from "modules/types.js"

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
		ref: function() { return this.wyjazdowa ? "Wyjazd" : "Jednostka" },
	}
	wyjazdowa = Boolean


	/* * Getters * */

	/** Returns the funkcja type name. Will throw an error if the jednostka field is not populated */
	get displayName() {
		let funkcjaNames
		if(this.wyjazdowa) {
			funkcjaNames = WyjazdoweFunkcjaNames
		} else {
			if(!this.populated("jednostka") || !this.jednostka) return "funkcja"
			funkcjaNames = FunkcjaNames[this.jednostka.type]
		}
				
		return funkcjaNames?.[this.type][0] || "(nieznana funkcja)"
	}
}

const schema = mongoose.Schema.fromClass(FunkcjaClass)

schema.beforeDelete = async function() {
	// Remove self from user
	await this.populate("user")
	const funkcjeKey = this.wyjazdowa ? "funkcjeWyjazdowe" : "funkcje"
	this.user[funkcjeKey] = this.user[funkcjeKey].filter(f => f.id != this.id)
	await this.user.save()

	// Remove self from jednostka
	await this.populate("jednostka")
	this.jednostka.funkcje = await this.jednostka.funkcje.filter(f => f.id != this.id)
	await this.jednostka.save()
}

export default mongoose.model("Funkcja", schema, "funkcje")