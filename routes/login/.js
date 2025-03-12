import html from "modules/html.js"

import User from "modules/schemas/user.js"

export default async function() {
	const savedUserIDs = this.request.token?.saved || []
	const savedUsers = await User.find({_id: savedUserIDs})
	
	// Render login page
	return html("login/main", {
		savedUsers
	})
}