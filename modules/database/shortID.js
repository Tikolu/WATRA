import randomID from "modules/randomID.js"

export default {
	type: String,
	unique: true,
	validate: /^[0-9a-f]{2,32}$/,
	default: () => randomID(8),
}