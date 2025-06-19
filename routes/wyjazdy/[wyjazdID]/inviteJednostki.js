import html from "modules/html.js"
import { FunkcjaType } from "modules/types.js"

export default async function({user, targetWyjazd}) {
	// await targetWyjazd.populate({"funkcje": ["user", "jednostka"]})

	const jednostki = {}
	let topJednostki

	function saveJednostka(jednostka) {
		jednostki[jednostka.id] = jednostka
		// Find jednostki of highest type
		if(topJednostki && topJednostki[0].type === jednostka.type) {
			topJednostki.push(jednostka)
		} else if(!topJednostki || topJednostki[0].type < jednostka.type) {
			topJednostki = [jednostka]
		}
	}
	
	await user.populate("funkcje")
	for(const funkcja of user.funkcje) {
		if(funkcja.type < FunkcjaType.PRZYBOCZNY) continue
		await funkcja.populate({"jednostka": {"funkcje": "user"}})
		const jednostka = funkcja.jednostka
		saveJednostka(jednostka)

		const upperJednostki = jednostka.getUpperJednostkiTree(Object.keys(jednostki))
		for await(const upperJednostka of upperJednostki) saveJednostka(upperJednostka)
	}

	for(const topJednostka of topJednostki) {	
		const subJednostki = topJednostka.getSubJednostkiTree()
		for await(const subJednostka of subJednostki) saveJednostka(subJednostka)
	}
	
	topJednostki = topJednostki.map(jednostka => jednostka.id)

	return html("wyjazd/inviteJednostki", {
		user,
		jednostki,
		topJednostki,
		targetWyjazd
	})
}