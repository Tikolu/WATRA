import HTTPError from "modules/server/error.js"
import { FunkcjaType } from "modules/types.js"

export default async function({user, targetJednostka, targetUser, funkcjaType}) {
	// Check permissions
	await user.requirePermission(targetJednostka.PERMISSIONS.MODIFY, "Brak dostępu do jednostki")
	await user.requirePermission(targetUser.PERMISSIONS.MODIFY, "Brak dostępu do użytkownika")

	// User can only change their own funkcja if they are a drużynowy in an upper jednostka
	if(user.id == targetUser.id && !await user.hasFunkcjaInJednostki(FunkcjaType.DRUŻYNOWY, targetJednostka.getUpperJednostkiTree())) {
		throw new HTTPError(400, "Nie można zmienić własnej funkcji")
	}

	await targetJednostka.setFunkcja(targetUser, funkcjaType)

	return {
		funkcjaType
	}
}