import Jednostka from "modules/schemas/jednostka.js";

export default async function({targetJednostka}) {
	await targetJednostka.deleteOne()
}