import Unit from "modules/schemas/unit";

export default async function({user, targetEvent}) {
	// Check permissions
	await user.requirePermission(targetEvent.PERMISSIONS.EDIT)
	
	await targetEvent.delete()
}