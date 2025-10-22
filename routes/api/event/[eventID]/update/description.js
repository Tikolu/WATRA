export default async function({targetEvent, description}) {	
	targetEvent.description = description

	await targetEvent.save()

	return {
		description: targetEvent.description
	}
}