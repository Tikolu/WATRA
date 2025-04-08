import Wyjazd from "modules/schemas/wyjazd.js"
import { FunkcjaType } from "modules/types.js";

export default async function({user}) {
	if(!user) throw new HTTPError(403)
	await user.populate("funkcje")
	if(!user.funkcje.some(f => f.type >= FunkcjaType.PRZYBOCZNY)) throw new HTTPError(403)
	
	const wyjazd = new Wyjazd()

	await wyjazd.setFunkcja(user, FunkcjaType.KOMENDANT)

	return {
		wyjazdID: wyjazd.id
	}
}