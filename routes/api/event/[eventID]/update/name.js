export default async function({targetEvent, name}) {	
	targetEvent.name = name
	
	await targetEvent.save()

	return {
		name: targetEvent.name,
		displayName: targetEvent.displayName
	}
}