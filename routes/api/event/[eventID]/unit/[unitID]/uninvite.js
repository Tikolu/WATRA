import HTTPError from "modules/server/error.js"

export default async function({user, targetEvent, targetUnit}) {

	await targetEvent.uninviteUnit(targetUnit)

}