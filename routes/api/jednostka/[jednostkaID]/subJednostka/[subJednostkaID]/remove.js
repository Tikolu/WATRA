export default async function({user, targetJednostka, targetSubJednostka}) {
	await targetJednostka.removeSubJednostka(targetSubJednostka);

	return {
		subJednostka: targetSubJednostka.id
	}
}