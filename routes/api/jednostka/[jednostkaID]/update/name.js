export default async function({targetJednostka, name}) {
	// Update name
	await targetJednostka.updateName(name)

	return {
		name: targetJednostka.name,
		displayName: targetJednostka.displayName
	}
}