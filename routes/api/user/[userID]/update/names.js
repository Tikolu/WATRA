export default async function({targetUser, firstName, lastName}) {
	if(firstName) targetUser.name.first = firstName
	if(lastName) targetUser.name.last = lastName
	
	await targetUser.save()

	return {
		firstName: targetUser.name.first || "",
		lastName: targetUser.name.last || "",
		displayName: targetUser.displayName
	}
}