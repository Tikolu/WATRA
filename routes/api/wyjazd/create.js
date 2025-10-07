import HTTPError from "modules/server/error.js"

import Wyjazd from "modules/schemas/wyjazd.js"
import { FunkcjaType } from "modules/types.js"

export default async function({user, name, startDate, endDate}) {
	if(!user) throw new HTTPError(403)
	await user.requirePermission(Wyjazd.PERMISSIONS.CREATE)
	
	const wyjazd = new Wyjazd({
		name,
		dates: {
			start: startDate,
			end: endDate
		}
	})

	await wyjazd.setFunkcja(user, FunkcjaType.KOMENDANT)

	return {
		wyjazdID: wyjazd.id
	}
}