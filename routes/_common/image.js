import html from "modules/html.js"

export async function image({user, set}) {
	const target = this.routeData.targetUser || this.routeData.targetUnit || this.routeData.targetEvent

	let setting = false
	if(!set) {
		setting = await user.checkPermission(target.PERMISSIONS.SET_IMAGE)
	}

	return html("image", {
		user,
		target: target,
		setting
	})
}