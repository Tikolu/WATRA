import mongoose from "npm:mongoose"

import { JednostkaType } from "modules/schemas/jednostka.js"

export const FunkcjaType = {
	SZEREGOWY: 0,

	PODZASTĘPOWY: 1,
	PRZYBOCZNY: 1,
	REFERENT: 1,

	ZASTĘPOWY: 2,
	KOMENDANT: 2,
	DRUŻYNOWY: 2
}

const schema = new mongoose.Schema({
	type: {
		type: Number,
		enum: Object.values(FunkcjaType),
		default: FunkcjaType.SZEREGOWY
	},
	user: {
		type: String,
		ref: "User"
	},
	jednostka: {
		type: String,
		ref: "Jednostka"
	}
},
{
	virtuals: {
		displayName: {
			get() {
				if(!this.populated("jednostka")) throw Error("Jednostka must be populated to derive funkcja name")
				if(!this.jednostka) return "(nieznana funkcja)"
				
				if(this.type == 0) {
					return "szeregowy"
				}
				if(this.type == 1) {
					if(this.jednostka.type == JednostkaType.ZASTĘP) return "podzastępowy"
					if(this.jednostka.type == JednostkaType.DRUŻYNA) return "przyboczny"
					if(this.jednostka.type == JednostkaType.HUFIEC) return "referent"
					if(this.jednostka.type == JednostkaType.CHORĄGIEW) return "referent"
					return "(nieznana funkcja drugorzędna)"
				}
				if(this.type == 2) {
					if(this.jednostka.type == JednostkaType.ZASTĘP) return "zastępowy"
					if(this.jednostka.type == JednostkaType.DRUŻYNA) return "drużynowy"
					if(this.jednostka.type == JednostkaType.HUFIEC) return "hufcowy"
					if(this.jednostka.type == JednostkaType.CHORĄGIEW) return "komendant chorągwi"
					return "(nieznana funkcja główna)"
				}
				return "(nieznana funkcja)"
			}
		}
	}
})

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