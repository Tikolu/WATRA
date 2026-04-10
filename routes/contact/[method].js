import html from "modules/html.js"
import HTTPError from "modules/server/error.js"

const contactMethods = ["email", "phone", "sms", "whatsapp"]

export default async function({method}) {
	const data = new URLSearchParams(await this.request.getBody())
	const details = data.get("details")?.split(",") || []

	if(!details.length) throw new HTTPError(400, "Nie wybrano żadnych danych kontaktowych")
	if(!contactMethods.includes(method)) throw new HTTPError(400, "Nieprawidłowa metoda kontaktu")

	let link
	if(method == "sms") link = `sms:${details.join(",")}`
	else if(method == "email") {
		if(details.length == 1) link = `mailto:${details[0]}`
		else link = `mailto:?bcc=${details.join(",")}`
	}

	if(details.length == 1) {
		if(method == "phone") link = `tel:${details[0]}`
		else if(method == "whatsapp") link = `https://wa.me/${details[0]}`
	}

	return html("contact", {
		method,
		details,
		link
	})
}