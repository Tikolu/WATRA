export default async function({targetEvent, name}) {	
	// Update name
	await targetEvent.updateName(name)

	return {
		name: targetEvent.name,
		displayName: targetEvent.displayName
	}
}