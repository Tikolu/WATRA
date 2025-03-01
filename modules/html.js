import { Eta } from "eta/index.ts"

const eta = new Eta({
	views: "./html",
	defaultExtension: ".html",
	varName: "$"
})

/**
 * Render HTML files using Eta
 * @param {string} file Path to the file to render
 * @param {Object} [data={}] Data to pass to the template
 * @returns {string} The rendered HTML
 */
export default function(file, data={}) {
	const output = eta.render(file, data)
	return output
}