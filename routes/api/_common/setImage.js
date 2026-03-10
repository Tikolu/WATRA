import HTTPError from "modules/server/error.js"
import File from "modules/schemas/file.js"

const formats = ["image/webp", "image/jpeg", "image/png"]
export async function setImage({user, image, icon}) {
	const target = this.routeData.targetUser || this.routeData.targetUnit || this.routeData.targetEvent
	
	// Check permissions
	await user.requirePermission(target.PERMISSIONS.SET_IMAGE)
	
	const file = await File.fromJSON(image)
	const altFile = await File.fromJSON(icon)

	// Check file type and name
	if(!formats.includes(file.type) || !formats.includes(altFile.type)) throw new HTTPError(400, "Nieobsługiwany typ pliku")
	if(file.name != target.id) throw new HTTPError(400, "Nieprawidłowa nazwa pliku")

	// Check image dimensions
	const bitmap = await createImageBitmap(file.blob)
	const altBitmap = await createImageBitmap(altFile.blob)
	if(	bitmap.width > 512 || bitmap.width != bitmap.height ||
		altBitmap.width > 48 || altBitmap.width != altBitmap.height
	) {
		throw new HTTPError(400, "Nieprawidłowe wymiary obrazu")
	}

	file.altData.push({
		_id: "48",
		data: altFile.data
	})

	// Delete current image
	if(target.image) {
		await File.findByIdAndDelete(target.image)
	}

	// Set new image
	target.image = file.id
	await target.save()
	await file.save()
}