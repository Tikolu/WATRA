import html from "modules/html.js"

export default async function({user, targetJednostka}) {
	// Populate jednostka funkcje, as well as users and jednostki of funkcje
	await targetJednostka.populate({
		path: "funkcje",
		populate: ["user", "jednostka"]
	})

	// Populate sub jednostki
	await targetJednostka.populate("subJednostki")

	// Populate upper jednostki
	await targetJednostka.populate("upperJednostki")

	// Get all members for mianowanie
	if(await user.checkPermission(targetJednostka.PERMISSIONS.MODIFY)) {
		targetJednostka.members = []
		const subMembers = await Array.fromAsync(targetJednostka.subMembers)
		for(const member of subMembers) {
			// Ignore current user
			if(member.id == user.id) continue
			if(targetJednostka.members.hasID(member.id)) continue
			targetJednostka.members.push(member)
		}
	}

	return html("jednostka/page", {
		user,
		targetJednostka
	})
}