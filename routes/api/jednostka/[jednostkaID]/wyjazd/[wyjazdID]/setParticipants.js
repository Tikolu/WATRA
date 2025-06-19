import HTTPError from "modules/server/error.js"

export default async function({user, targetJednostka, targetWyjazd, participants=[]}) {
	// First remove any participants already set
	targetWyjazd.participants = targetWyjazd.participants.filter(p => p.jednostka != targetJednostka.id)

	// Get jednostka members
	const members = await Array.fromAsync(targetJednostka.getSubMembers())

	// Get wyjazd funkcje
	await targetWyjazd.populate("funkcje")

	// Add new participants
	for(const participantID of participants) {
		if(!members.some(m => m.id == participantID)) {
			throw new HTTPError(400, "Nie można dodać uczestnika, który nie jest członkiem jednostki.")
		}

		// Check if participant already added
		if(targetWyjazd.participants.some(p => p.user == participantID)) {
			continue
		}

		// Check if participant has funkcja in wyjazd
		if(targetWyjazd.funkcje.some(f => f.user == participantID)) {
			continue
		}
		
		targetWyjazd.participants.push({
			user: participantID,
			jednostka: targetJednostka.id
		})
	}

	await targetWyjazd.save()
}