import html from "modules/html.js"
import HTTPError from "modules/server/error.js"

import User from "modules/schemas/user.js"

export default async function({userID}) {
	const savedUserIDs = this.request.token?.saved || []
	if(!savedUserIDs.includes(userID)) throw new HTTPError(403)

	const user = await User.findById(userID)
	
	// Render login page
	return html("login/verify", {
		user
	})
}