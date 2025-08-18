API.registerHandler("wyjazd/[wyjazdID]/approval/approve", {
	progressText: "Zatwierdzanie wyjazdu...",
	successText: "Zatwierdzono",
	before: () => closeDialog()
})