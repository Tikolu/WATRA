import mongoose from "npm:mongoose"
import randomID from "modules/randomID.js";

const schema = new mongoose.Schema({
	name: String,
	accessCode: String
},
{
	timestamps: true,
	statics: {
		findByAccessCode(code) {
			return this.findOne({ accessCode: code })
		}
	},
	methods: {
		generateAccessCode() {
			this.accessCode = randomID(8, "numeric")
			return this.accessCode
		}
	}
})

export default mongoose.model("User", schema)