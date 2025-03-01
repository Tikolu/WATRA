import { Buffer } from "node:buffer";

/**
 * Decodes a base64 encoded string
 * @param {string} base64 Base64 encoded string
 * @returns {string} Decoded text
 */
export function decode(base64) {
	const buffer = Buffer.from(base64, "base64")
	return buffer.toString("utf-8")
}

/**
 * Encodes a string using base64
 * @param {string} text Text to encode
 * @returns {string} Base64 encoded string
 */
export function encode(text) {
	const buffer = Buffer.from(text)
	return buffer.toString("base64")
}