import HTTPError from "modules/server/error.js";

export default function() {
	throw new HTTPError(404, "No API specified")
}