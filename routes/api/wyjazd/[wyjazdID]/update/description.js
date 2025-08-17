export default async function({targetWyjazd, description}) {	
	// Update description
	await targetWyjazd.updateDescription(description)
}