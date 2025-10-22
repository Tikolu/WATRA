import * as Text from "modules/text.js"

export default async function({targetUser, phone}) {
	targetUser.phone = phone
	
	await targetUser.save()

	return {
		phone: Text.formatPhone(targetUser.phone, targetUser.phone.startsWith("+353"))
	}
}