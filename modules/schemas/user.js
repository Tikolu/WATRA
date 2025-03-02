import mongoose from "npm:mongoose"
import randomID from "modules/randomID.js";
import * as Text from "modules/text.js";

const schema = new mongoose.Schema({
	name: {
		first: String,
		last: String
	},
	accessCode: String
},
{
	timestamps: true,
	statics: {
		findByAccessCode(code) {
			if(!/^\d{8}$/.test(code)) return null
			return this.findOne({ accessCode: code })
		}
	},
	methods: {
		generateAccessCode() {
			this.accessCode = randomID(8, "numeric")
			return this.accessCode
		},
		updateName(first="", last="") {
			this.name.first = Text.capitalise(first.trim())
			this.name.last = Text.capitalise(last.trim())
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

export default mongoose.model("User", schema)