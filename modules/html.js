import { Eta } from "jsr:@eta-dev/eta"
import * as datetime from "jsr:@std/datetime"
import * as Base64 from "modules/base64.js"
import * as Text from "modules/text.js"

import Config from "modules/config.js"
import Event from "modules/schemas/event"
import Graph from "modules/schemas/unit/graph.js"

const etaImports = {
	Base64,
	Text,
	datetime,
	Config,
	Graph
}

const eta = new Eta({
	views: "./html",
	defaultExtension: ".html",
	varName: "$",
	functionHeader: `for(const importName in $?.ETA_IMPORTS) {
		globalThis[importName] = $.ETA_IMPORTS[importName]
	}`,
	debug: globalThis.DEV
})

/**
 * Render HTML files using Eta
 * @param {string} file Path to the file to render
 * @param {Object} [data={}] Data to pass to the template
 * @returns {string} The rendered HTML
 */
export default function(file, data={}) {
	data.ETA_IMPORTS = etaImports
	const output = eta.render(file, data)
	return output
}