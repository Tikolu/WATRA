import Jednostka from "modules/schemas/jednostka.js";

export default async function({targetJednostka}) {
	const subJednostkaID = targetJednostka.subJednostki[0]
	
	await targetJednostka.deleteOne()
}