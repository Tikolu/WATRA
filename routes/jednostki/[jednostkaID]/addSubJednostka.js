import html from "modules/html.js"
import { FunkcjaType, JednostkaType } from "modules/types.js"

export default async function({user, targetJednostka}) {
	// Check for permissions
	await user.requirePermission(targetJednostka.PERMISSIONS.MODIFY)
	
	// Find jednostki that can be linked as subJednostki
	const jednostkiForLinking = []
	await user.populate("funkcje")
	for(const funkcja of user.funkcje) {
		if(funkcja.type < FunkcjaType.DRUŻYNOWY) continue
		await funkcja.populate("jednostka")
		for await(const jednostka of funkcja.jednostka.getSubJednostkiTree()) {
			// Skip jednostki of higher type
			if(jednostka.type >= targetJednostka.type) continue
			// Skip jednostki which already are subJednostki
			if(targetJednostka.subJednostki.hasID(jednostka.id)) continue
			if(jednostkiForLinking.hasID(jednostka.id)) continue

			await jednostka.populate("upperJednostki")
			jednostkiForLinking.push(jednostka)
		}
	}

	// Find jednostki types for creating new subJednostka
	const subJednostkiTypes = []
	for(const [typeName, type] of Object.entries(JednostkaType)) {
		if(type >= targetJednostka.type) continue
		subJednostkiTypes.unshift({name: typeName, value: type})
	}
	
	return html("jednostka/addSubJednostka", {
		user,
		targetJednostka,
		jednostkiForLinking,
		subJednostkiTypes
	})
}