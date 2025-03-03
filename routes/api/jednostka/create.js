import HTTPError from "modules/server/error.js";
import Jednostka from "modules/schemas/jednostka.js";

export default async function() {
	// Create jednostka (drużyna, gromada itp.)
	const jednostka = new Jednostka()

	// Save jednostka to DB
	await jednostka.save()

	// Return jednostka ID
	return {
		jednostkaID: jednostka.id
	}
}