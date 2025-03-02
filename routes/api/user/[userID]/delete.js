import User from "modules/schemas/user.js";

export default async function({userID}) {
	await User.findByIdAndDelete(userID)
}