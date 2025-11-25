import mongoose from "mongoose"

import randomID from "modules/randomID.js"

export class ReportClass {
	/* * Properties * */
	message = {
		type: String,
		required: true
	}

	files = [
		{
			type: String,
			ref: "File"
		}
	]
}

const schema = mongoose.Schema.fromClass(ReportClass)

schema.permissions = {
	/** List all reports */
	async LIST(user) {
		// Users with "listReports" role in any unit can list
		await user.populate("roles")
		return user.roles.some(role => role.hasTag("listReports"))
	}
}

export default mongoose.model("Report", schema)