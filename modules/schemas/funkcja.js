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
	unit = {
		type: String,
		ref: function() { return this.wyjazdowa ? "Wyjazd" : "Unit" },
	}
	wyjazdowa = {
		type: Boolean,
		index: true
	}


	/* * Getters * */

	/** Returns the funkcja type name. Will throw an error if the unit field is not populated */
	get displayName() {
		let funkcjaNames
		if(this.wyjazdowa) {
			funkcjaNames = WyjazdoweFunkcjaNames
		} else {
			if(!this.populated("unit") || !this.unit) return "funkcja"
			funkcjaNames = FunkcjaNames[this.unit.type]
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

	// Remove self from unit
	await this.populate("unit")
	this.unit.funkcje = await this.unit.funkcje.filter(f => f.id != this.id)
	await this.unit.save()
}

export default mongoose.model("Funkcja", schema, "funkcje")