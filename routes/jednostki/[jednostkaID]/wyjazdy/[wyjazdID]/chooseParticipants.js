import html from "modules/html.js"
import HTTPError from "modules/server/error.js"

export default async function({user, targetJednostka, targetWyjazd}) {
	const availableMembers = await Array.fromAsync(targetJednostka.getSubMembers())
	
	return html("jednostka/chooseWyjazdParticipants", {
		user,
		targetJednostka,
		targetWyjazd,
		availableMembers
	})
}