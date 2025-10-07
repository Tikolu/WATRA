import HTTPError from "modules/server/error.js"

export default async function({user, targetWyjazd, targetUnit}) {

	await targetWyjazd.uninviteUnit(targetUnit)

}