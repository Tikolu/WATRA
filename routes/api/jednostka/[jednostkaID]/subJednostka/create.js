import HTTPError from "modules/server/error.js";
import Jednostka from "modules/schemas/jednostka.js";

export default async function({user, targetJednostka, type}) {
	// Check permissions
	await user.requirePermission(targetJednostka.PERMISSIONS.MODIFY)
	
	// Create jednostka, calculating type if not specified
	const subJednostka = new Jednostka({
		type: type || (targetJednostka.type - 1)
	})

	await targetJednostka.addSubJednostka(subJednostka)

	// Save subJednostka to DB
	await subJednostka.save()

	// Return subJednostka ID
	return {
		subJednostkaID: subJednostka.id
	}
}