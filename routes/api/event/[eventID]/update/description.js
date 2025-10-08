export default async function({targetEvent, description}) {	
	// Update description
	await targetEvent.updateDescription(description)

	return {
		description: targetEvent.description
	}
}