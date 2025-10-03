import * as Text from "modules/text.js"

export default async function({user, targetUser, phone}) {
	// Update phone
	await targetUser.updatePhone(phone)

	// Log event
	await user.logEvent("PHONE_UPDATE", {
		targetUser,
		data: targetUser.phone
	})

	return {
		phone: Text.formatPhone(targetUser.phone, targetUser.phone.startsWith("+353"))
	}
}