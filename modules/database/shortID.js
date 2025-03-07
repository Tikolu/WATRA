export default {
	type: String,
	unique: true,
	validate: /^[0-9a-f]{8}$/,
	default: () => Math.random().toString(16).substring(2, 10)
}