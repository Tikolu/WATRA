import User from "modules/schemas/user.js";

export default async function({targetUser}) {
	// await User.findByIdAndDelete(userID)
	await targetUser.deleteOne()
}