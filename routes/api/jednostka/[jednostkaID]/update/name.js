export default async function({targetJednostka, input}) {
	// Update name
	await targetJednostka.updateName(input.name)

	return {
		name: targetJednostka.name,
		displayName: targetJednostka.displayName
	}
}