export default async function({targetWyjazd, name}) {	
	// Update name
	await targetWyjazd.updateName(name)

	return {
		name: targetWyjazd.name,
		displayName: targetWyjazd.displayName
	}
}