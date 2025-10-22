export default async function({targetEvent, location}) {	
	targetEvent.location = location

	await targetEvent.save()

	return {
		location: targetEvent.location
	}
}