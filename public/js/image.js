if(window.imagePicker) {
	imagePicker.onchange = async () => {
		imagePreview.src = imagePicker.files[0] ? URL.createObjectURL(imagePicker.files[0]) : ""
		imagePreview.hidden = !imagePreview.src
		setImageButton.hidden = !imagePreview.src
		cropText.hidden = true
		imagePreviewContainer.classList.remove("landscape", "portrait")

		imagePreview.onload = () => {
			if(window.noImageText) noImageText.hidden = true
			
			// Enable cropping interface
			if(Math.abs(imagePreview.naturalWidth - imagePreview.naturalHeight) > 10) {
				cropText.hidden = false
				if(imagePreview.naturalWidth > imagePreview.naturalHeight) {
					imagePreviewContainer.classList.add("landscape")
				} else {
					imagePreviewContainer.classList.add("portrait")
				}
			}
		}
	}
}

async function cropImage(maxSize) {
	const size = Math.min(maxSize, imagePreview.naturalWidth, imagePreview.naturalHeight)
	
	// Calculate crop coordinates
	let sourceCoordinates
	if(imagePreview.naturalWidth > imagePreview.naturalHeight) {
		const cropRatio = imagePreviewContainer.scrollLeft / imagePreviewContainer.scrollWidth
		sourceCoordinates = [
			Math.floor(cropRatio * imagePreview.naturalWidth),
			0,
			imagePreview.naturalHeight,
			imagePreview.naturalHeight
		]
	} else {
		const cropRatio = imagePreviewContainer.scrollTop / imagePreviewContainer.scrollHeight
		sourceCoordinates = [
			0,
			Math.floor(cropRatio * imagePreview.naturalHeight),
			imagePreview.naturalWidth,
			imagePreview.naturalWidth
		]
	}
	
	
	// Draw image to canvas
	const canvas = new OffscreenCanvas(size, size)
	canvas.context = canvas.getContext("2d")
	canvas.context.imageSmoothingQuality = "high"
	canvas.context.drawImage(imagePreview, ...sourceCoordinates, 0, 0, size, size)

	// Attempt to output webp, fallback to other types
	const types = ["image/webp", imagePicker.files[0].type, "image/jpeg", "image/png"]
	for(const type of types) {
		const blob = await canvas.convertToBlob({type, quality: 1})
		if(blob.type == type) {
			return blob
		} else {
			console.warn(`Failed to convert image to ${type}, got ${blob.type} instead`)
		}
	}
	throw new Error("Failed to convert image to a supported type")
}


API.registerHandler("[type]/[id]/setImage", {
	progressText: "Zapisywanie...",
	successText: "Zapisano",
	validate: async data => {
		const progressMessage = Popup.create({
			message: "Ładowanie grafiki...",
			type: "progress",
			icon: "progress_activity",
			time: false
		})
		
		data.image = {
			name: `${META.id}`,
			data: await fileToBase64(await cropImage(512))
		},
		data.icon = {
			name: `${META.id}`,
			data: await fileToBase64(await cropImage(96))
		}

		progressMessage.close()
		return true
	}
})