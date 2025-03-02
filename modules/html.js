import { Eta } from "eta/index.ts"
import * as Base64 from "modules/base64.js"

const etaImports = {
	Base64
}

const eta = new Eta({
	views: "./html",
	defaultExtension: ".html",
	varName: "$",
	functionHeader: `for(const importName in $.ETA_IMPORTS) {
		globalThis[importName] = $.ETA_IMPORTS[importName]
	}`,
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