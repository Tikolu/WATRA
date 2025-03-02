import HTTPError from "modules/server/error.js";
import User from "modules/schemas/user.js";

export default async function({input}) {
	// Create user
	const user = new User({
		name: input.name
	})

	// Save user to DB
	await user.save()

	// Return user ID
	return {
		userID: user.id
	}
}