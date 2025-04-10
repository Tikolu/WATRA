import HTTPError from "modules/server/error.js"
import { FunkcjaType } from "modules/types.js"

export default async function({user, targetJednostka, targetUser}) {
	// Check permissions
	await user.requirePermission(targetJednostka.PERMISSIONS.MODIFY, "Brak dostępu do jednostki")
	await user.requirePermission(targetUser.PERMISSIONS.MODIFY, "Brak dostępu do użytkownika")

	// User can only remove themselves if they are a drużynowy in an upper jednostka
	if(user.id == targetUser.id && !await user.hasFunkcjaInJednostki(FunkcjaType.DRUŻYNOWY, targetJednostka.getUpperJednostkiTree())) {
		throw new HTTPError(400, "Nie można usunąć samego siebie")
	}

	const targetFunkcja = await targetUser.getFunkcjaInJednostka(targetJednostka)
	if(!targetFunkcja) throw new HTTPError(400, "Użytkownik nie jest członkiem jednostki")

	// Ensure user has at least one other funkcja
	if(!targetUser.isParent && targetUser.funkcje.length <= 1) throw Error("Użytkownik musi mieć przynajmniej jedną funkcję")

	await targetFunkcja.delete()
}