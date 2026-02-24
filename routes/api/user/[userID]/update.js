import * as datetime from "jsr:@std/datetime"
import * as Text from "modules/text.js"
import HTTPError from "modules/server/error.js"

export async function _open({user, targetUser}) {
	// Check permissions
	await user.requirePermission(targetUser.PERMISSIONS.EDIT)
}

export async function names({targetUser, firstName, lastName}) {
	if(firstName) targetUser.name.first = firstName
	if(lastName) targetUser.name.last = lastName
	
	await targetUser.save()

	return {
		firstName: targetUser.name.first || "",
		lastName: targetUser.name.last || "",
		displayName: targetUser.displayName
	}
}

export async function dateOfBirth({targetUser, date}) {
	targetUser.dateOfBirth = date
	
	await targetUser.save()

	if(targetUser.dateOfBirth) {
		return {
			date: formatDate(targetUser.dateOfBirth),
			age: targetUser.age
		}
	}
}

export async function email({targetUser, email}) {
	targetUser.email = email

	await targetUser.save()

	return {
		email: targetUser.email
	}
}

export async function phone({targetUser, phone}) {
	targetUser.phone = phone
	
	await targetUser.save()

	return {
		phone: Text.formatPhone(targetUser.phone, targetUser.phone?.startsWith("+353"))
	}
}

export async function org({user, targetUser, org}) {
	await user.requirePermission(targetUser.PERMISSIONS.SET_ORG)

	if(!org) throw new HTTPError(400)

	targetUser.org = org
	
	await targetUser.save()
	
	return {
		org: targetUser.org
	}
}