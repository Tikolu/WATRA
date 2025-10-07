import * as Text from "modules/text.js"

export default async function({targetUser, phone}) {
	// Update phone
	await targetUser.updatePhone(phone)

	return {
		phone: Text.formatPhone(targetUser.phone, targetUser.phone.startsWith("+353"))
	}
}