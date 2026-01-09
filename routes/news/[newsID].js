import HTTPError from "modules/server/error.js"
import html from "modules/html.js"
import Config from "modules/config.js"

export default async function({user, newsID}) {
	if(!user) return this.response.redirect("/login")

	// Find news
	const news = Config.news?.find(n => n.id == newsID)
	if(!news) throw new HTTPError(404)

	const body = await html(`custom/${news.id}.html`, {
		user
	})

	return html("layouts/news", {body})
}