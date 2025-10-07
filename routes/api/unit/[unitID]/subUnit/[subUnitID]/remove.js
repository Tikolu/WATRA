export default async function({user, targetUnit, targetSubUnit}) {
	await targetUnit.removeSubUnit(targetSubUnit);

	return {
		subUnit: targetSubUnit.id
	}
}