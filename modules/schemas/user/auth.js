import * as webauthn from "jsr:@simplewebauthn/server"
import { Buffer } from "node:buffer"
import randomID from "modules/randomID.js"

import Config from "modules/config.js"
import User from "modules/schemas/user"
import Passkey from "modules/schemas/passkey.js"
import { verify } from "node:crypto";

export default class {
	_id = false
	accessCode = String

	keys = [
		{
			type: String,
			ref: "Passkey"
		}
	]

	/** Generates, saves and returns an access code for the user */
	async generateAccessCode() {
		const targetUser = this.parent()
		
		// Generate access code
		this.accessCode = randomID(8, "numeric")

		// Check if a different user already has this access code
		const otherUser = await User.findByAccessCode(this.accessCode)
		if(otherUser) {
			throw Error("Błąd generowania kodu dostępu, spróbuj ponownie")
		}
		
		await targetUser.save()
		return this.formattedAccessCode
	}

	/** Generates options for creating a new passkey */
	async passkeyCreationOptions() {
		const targetUser = this.parent()
		
		if(!targetUser.name.first || !targetUser.name.last) {
			throw Error("Nie można dodać klucza dostępu bez ustawionego imienia i nazwiska")
		}
		
		// Options for browser to create new passkey
		const options = await webauthn.generateRegistrationOptions({
			rpName: Config.name,
			rpID: Config.host,
			userName: targetUser.displayName,
			excludeCredentials: this.keys.map(k => ({id: k.id})),
			attestationType: "none",
			authenticatorSelection: {
				residentKey: "required",
				requireResidentKey: true,
				userVerification: "required"
			}
		})

		return options
	}

	/** Saves a new passkey credential to the user */
	async savePasskey(credential, expectedChallenge) {
		const targetUser = this.parent()

		// Verify passkey data
		const verification = await webauthn.verifyRegistrationResponse({
			expectedRPID: Config.host,
			expectedOrigin: `https://${Config.host}`,
			response: credential,
			expectedChallenge
		})

		if(!verification.verified) throw Error("Błąd weryfikowania klucza dostępu")

		// Check if passkey with ID already exists
		const existingPasskey = await Passkey.findById(verification.registrationInfo.credential.id)
		if(existingPasskey) {
			throw Error("Klucz dostępu o podanym identyfikatorze już istnieje")
		}

		// Create new passkey and add to user
		const passkey = new Passkey({
			_id: verification.registrationInfo.credential.id,
			aaguid: verification.registrationInfo.aaguid,
			pk: Buffer.from(verification.registrationInfo.credential.publicKey),
			user: targetUser
		})
		this.keys.push(passkey)
		
		await passkey.save()
		await targetUser.save()
	}

	/** Formats the access code nicely */
	get formattedAccessCode() {
		return this.accessCode.replace(/(\d{4})/g, "$1 ").trim()
	}
}