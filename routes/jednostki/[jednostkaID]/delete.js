import html from "modules/html.js"

export default async function({user, targetJednostka}) {
	// Check for permissions
	await user.requirePermission(targetJednostka.PERMISSIONS.DELETE)
	
	// Check permissions for upperJednostki
	await targetJednostka.populate("upperJednostki")
	for(const upperJednostka of targetJednostka.upperJednostki) {
		await user.checkPermission(upperJednostka.PERMISSIONS.MODIFY)
	}
	
	return html("jednostka/delete", {
		user,
		targetJednostka
	})
}