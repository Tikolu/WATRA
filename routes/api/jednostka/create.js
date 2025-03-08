import HTTPError from "modules/server/error.js";
import Jednostka from "modules/schemas/jednostka.js";

export default async function({type, upperJednostkaID}) {
	// Create jednostka
	const jednostka = new Jednostka()

	if(upperJednostkaID) {
		const upperJednostka = await Jednostka.findById(upperJednostkaID)
		jednostka.type = upperJednostka.type - 1
		await jednostka.addUpperJednostka(upperJednostka)
	}

	// Save jednostka to DB
	await jednostka.save()

	// Return jednostka ID
	return {
		jednostkaID: jednostka.id
	}
}