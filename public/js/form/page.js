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

API.registerHandler("form/[formID]/element/[elementID]/update", {
	validate: (data, element) => {
		if(element.htmlFor) element = document.getElementById(element.htmlFor)

		let value = data.value

		if(element.tagName == "UL") {
			data.value = {
				text: element.previousElementSibling?.value || "",
				options: [...element.querySelectorAll("li")].map(li => li.textContent)
			}

			value = data.value.text
		}

		if(!value.trim()) return {
			api: `form/[formID]/element/${element.id}/remove`,
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


// Get response ID from URL
const selectedResponseID = document.location.params.get("response")
if(selectedResponseID) {
	// Open response dialog
	createURLDialog(`/forms/${META.formID}/responses/${selectedResponseID}`, true)
	// Remove parameter from URL
	history.replaceState(null, null, window.location.pathname)

// Auto open response dialog when opening form for the first time
} else {
	const config = document.getElementById("config-section")
	const response = document.querySelector(".entry-grid a")
	const newResponseButton = document.getElementById("new-response-button")
	
	if(newResponseButton && !config && !response) {
		sleep(100).then(() => newResponseButton.click())
	}
}