API.registerHandler("form/[formID]/update/name", {
	valueKey: "name",
	successText: "Zapisano nazwę"
})

API.registerHandler("form/[formID]/delete", {
	progressText: "Kasowanie formularza...",
	before: () => deleteFormDialog.result(),
	after: () => history.back()
})

API.registerHandler("form/[formID]/element/add", {
	progressText: "Dodawanie elementu...",
	successText: "Dodano element"
})

API.registerHandler("form/[formID]/element/[elementID]/setText", {
	valueKey: "text",
	validate: (data, element) => {		
		if(!data.text.trim()) return {
			api: `form/[formID]/element/${element.id || element.htmlFor}/remove`,
			progressText: "Usuwanie...",
			successText: "Usunięto element"
		}
		return true
	},
	successText: "Zapisano"
})

API.registerHandler("form/[formID]/update/config", {
	progressText: "Zapisywanie ustawień...",
	successText: "Zapisano ustawienia"
})