export default async function({user, targetJednostka, targetSubJednostka}) {
	await targetJednostka.removeSubJednostka(targetSubJednostka);
}