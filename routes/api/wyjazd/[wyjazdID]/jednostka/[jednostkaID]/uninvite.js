import HTTPError from "modules/server/error.js"

export default async function({user, targetWyjazd, targetJednostka}) {

	await targetWyjazd.uninviteJednostka(targetJednostka)

}