export default async function({targetEvent, location}) {	
	// Update location
	await targetEvent.updateLocation(location)

	return {
		location: targetEvent.location
	}
}