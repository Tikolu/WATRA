import html from "modules/html.js"
import User from "modules/schemas/user.js";

export default async function() {
	// Get list of all users
	const users = await User.find()
	
	return html("user/list", {
		users
	})
}