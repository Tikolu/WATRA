export default async function({targetJednostka, targetUser, funkcjaType}) {
	funkcjaType = Number(funkcjaType)
	
	await targetJednostka.setFunkcja(targetUser, funkcjaType)
}