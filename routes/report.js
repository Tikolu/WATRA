import html from "modules/html.js"
import Report from "modules/schemas/report.js"
import HTTPError from "modules/server/error.js"

export function submit() {
	return html("report/submit")
}

export async function list({user}) {
	if(!user) throw new HTTPError(403)
	await user.requirePermission(Report.PERMISSIONS.LIST)
	
	return html("report/list")
}