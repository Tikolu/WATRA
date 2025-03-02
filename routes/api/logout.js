import HTTPError from "modules/server/error.js";

export default function({request, response}) {
	// Check if user is logged in
	if(!request.token?.user) throw new HTTPError(400, "Nie jesteś zalogowany")

	// Clear cookie token
	response.token = {}
}