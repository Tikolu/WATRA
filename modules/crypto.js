import { Buffer } from "node:buffer";

const SERVER_PRIVATE_KEY = Deno.env.get("SERVER_PRIVATE_KEY") 
if(!SERVER_PRIVATE_KEY) {
	throw new Error("SERVER_PRIVATE_KEY is not set in .env file")
}

const encoder = new TextEncoder()

/**
 * Hashes the given data using the SHA256 algorithm.
 * @param {*} data Data to hash
 * @param {string} [format="base64"] Format to return the hash in
 * @returns {Promise<string>} The hash of the data
 */
export async function sha256(data, format="base64") {
	const buffer = encoder.encode(data)
	const hashedBuffer = await crypto.subtle.digest("SHA-256", buffer)
	const outputBuffer = Buffer.from(hashedBuffer)
	return outputBuffer.toString(format)
}

/** Signs data using the server's private key */
export async function sign(data) {
	const signature = await sha256(data + SERVER_PRIVATE_KEY)
	if(!signature) throw new Error("Error signing data")
	return signature
}

/** Verifies a signature */
export async function verify(data, signature) {
	if(!signature) throw new Error("No signature provided")
	const newSignature = await sha256(data + SERVER_PRIVATE_KEY)
	if(!newSignature) throw new Error("Error verifying signature")
	return newSignature === signature
}