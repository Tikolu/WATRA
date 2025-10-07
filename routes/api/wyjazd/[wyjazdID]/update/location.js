export default async function({targetWyjazd, location}) {	
	// Update location
	await targetWyjazd.updateLocation(location)

	return {
		location: targetWyjazd.location
	}
}