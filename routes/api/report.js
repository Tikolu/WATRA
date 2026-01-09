import Report from "modules/schemas/report.js"
import File from "modules/schemas/file.js"

const allowedFileTypes = [
	"image/png",
	"image/jpeg"
]

export async function submit({message, attachments=[]}) {
	if(attachments.length > 4) {
		throw new Error("Limit 4 załączników")
	}
	
	const report = new Report({
		message,
		files: []
	})
	
	for(const data of attachments) {
		const file = await File.fromJSON(data)
		if(!allowedFileTypes.includes(file.type)) {
			throw new Error("Nieobsługiwany typ pliku")
		}
		await file.save()
		report.files.push(file)
	}

	await report.save()
}