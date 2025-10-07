import HTTPError from "modules/server/error.js"
import { FunkcjaType } from "modules/types.js"

export default async function({user, targetUnit, targetUser}) {
	// Check permissions
	await user.requirePermission(targetUnit.PERMISSIONS.MODIFY, "Brak dostępu do units")
	await user.requirePermission(targetUser.PERMISSIONS.MODIFY, "Brak dostępu do użytkownika")

	// User can only remove themselves if they are a drużynowy in an upper unit
	if(user.id == targetUser.id && !await user.hasFunkcjaInUnits(FunkcjaType.DRUŻYNOWY, targetUnit.getUpperUnitsTree())) {
		throw new HTTPError(400, "Nie można usunąć samego siebie")
	}

	const targetFunkcja = await targetUser.getFunkcjaInUnit(targetUnit)
	if(!targetFunkcja) throw new HTTPError(400, "Użytkownik nie jest członkiem units")

	// Ensure user has at least one other funkcja
	if(!targetUser.isParent && targetUser.funkcje.length <= 1) throw Error("Użytkownik musi mieć przynajmniej jedną funkcję")

	await targetFunkcja.delete()
}