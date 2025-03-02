import { Buffer } from "node:buffer";

const encoder = new TextEncoder()

/**
 * Hashes the given data using the SHA256 algorithm.
 * @param {*} data Data to hash
 * @param {string} [format="base64"] Format to return the hash in
 * @returns {Promise<string>} The hash of the data
 */
export default async function(data, format="base64") {
	const buffer = encoder.encode(data)
	const hashedBuffer = await crypto.subtle.digest("SHA-256", buffer)
	const outputBuffer = Buffer.from(hashedBuffer)
	return outputBuffer.toString(format)
}