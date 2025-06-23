import HTTPError from "modules/server/error.js"
import User from "modules/schemas/user.js";

export default async function({user, targetJednostka, targetWyjazd, participants=[]}) {
	// Ensure all participants belong to jednostka
	const members = await Array.fromAsync(targetJednostka.getSubMembers())
	for(const participantID of participants) {
		if(!members.some(m => m.id == participantID)) {
			throw new HTTPError(400, "Nie można dodać uczestnika, który nie jest członkiem jednostki.")
		}
	}

	// Load users
	const users = await User.find({_id: participants})

	// Get wyjazd funkcje
	await targetWyjazd.populate("funkcje")

	// Add new participants
	for(const participantID of participants) {
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
		
		const targetUser = users.find(u => u.id == participantID)
		if(!targetUser) throw new HTTPError(404, `Użytkownik ${participantID} nie istnieje`)
		targetUser.wyjazdy.push(targetWyjazd.id)
		await targetUser.save()
	}

	// Remove participants not on list
	for(const participantIndex in targetWyjazd.participants) {
		const participant = targetWyjazd.participants[participantIndex]

		if(participant.jednostka != targetJednostka.id) continue
		if(participants.includes(participant.user)) continue

		await participant.populate("user")
		participant.user.wyjazdy = participant.user.wyjazdy.filter(w => w.id != targetWyjazd.id)
		await participant.user.save()

		targetWyjazd.participants.splice(participantIndex, 1)
	}

	await targetWyjazd.save()
}