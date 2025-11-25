import html from "modules/html.js"
import Report from "modules/schemas/report.js"

export default async function({user}) {
	if(!user) throw new HTTPError(403)
	await user.requirePermission(Report.PERMISSIONS.LIST)
	
	return html("report/list")
}