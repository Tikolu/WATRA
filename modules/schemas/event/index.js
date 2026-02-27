import mongoose from "mongoose"
import * as Text from "modules/text.js"
import * as datetime from "datetime"
import HTTPError from "modules/server/error.js"
import Config from "modules/config.js"

import Role from "modules/schemas/role.js"
import File from "modules/schemas/file.js"
import unitInvite from "./unitInvite.js"
import participant from "./participant.js"
import approver from "./approver.js"

import { UnitClass } from "modules/schemas/unit"

export class EventClass extends UnitClass {
	/* * Overrides * */
	
	subUnits = undefined
	type = undefined
	eventInvites = undefined
	get config() { return Config.event }	
	get typeName() { return "Akcja" }
	
	/* * Properties * */

	dates = {
		start: {
			type: Date,
			min: [
				() => new Date(),
				"Data rozpoczęcia akcji nie może być w przeszłości"
			],
			max: MAX_DATE,
			validate: [
				function(value) {
					return value <= this.dates.end
				},
				"Data rozpoczęcia akcji musi być przed datą zakończenia"
			],
			required: true
		},
		end: {
			type: Date,
			min: [
				() => new Date(),
				"Data zakończenia akcji nie może być w przeszłości"
			],
			max: MAX_DATE,
			validate: [
				function(value) {
					return this.dates.start <= value
				},
				"Data rozpoczęcia akcji musi być przed datą zakończenia"
			],
			required: true
		}
	}

	description = {
		type: String,
		trim: true,
		default: ""
	}

	location = {
		type: String,
		trim: true,
		default: ""
	}

	files = [
		{
			file: {
				type: String,
				deriveID: true,
				ref: "File"
			},
			access: {
				type: String,
				enum: ["owner", "role", "participant"]
			}
		}
	]

	reg = {
		type: Boolean,
		default: true
	}

	invitedUnits = [unitInvite]
	participants = [participant]
	approvers = [approver]

	limit = {
		total: {
			type: Number,
			min: 0,
			validator: Number.isInteger
		},
		perUnit: {
			type: Number,
			min: 0,
			validator: Number.isInteger
		}
	}


	/* * Getters * */

	/** Gets the length of the event in days */
	get length() {
		if(!this.dates.start || !this.dates.end) return null
		const difference = datetime.difference(this.dates.start, this.dates.end)
		return difference.days
	}

	/** Gets the overall approval state of the event */
	get approvalState() {
		if(this.approvers.length == 0) return false

		for(const approver of this.approvers) {
			if(!approver.approved) return false
		}

		return true
	}

	/** List of required missing details */
	get missingDetails() {
		return Array.conditional(
			!this.name, "name",
			!this.description, "description",
			!this.location, "location",
			!this.dates.start || !this.dates.end, "dates"
		)
	}

	/** Checks if registration is currently open */
	get registrationOpen() {
		if(!this.reg) return false
		if(this.isPast) return false
		if(this.remainingSpaces === 0) return false
		return true
	}

	/** Check if participant limit is exceeded */
	get remainingSpaces() {
		if(this.limit.total === undefined) return Infinity
		const participantCount = this.participants.filter(p => p.state == "accepted").length
		return Math.max(0, this.limit.total - participantCount + this.roles.length)
	}

	/** Checks if the event starts in the past */
	get isPast() {
		if(!this.dates.start) return false
		const now = new Date()
		return this.dates.start < now
	}

	/* * Methods * */

	/** Sets a role for a event */
	async setRole(user, roleType) {
		const role = new Role({
			type: roleType || this.config.defaultRole,
			eventRole: true
		})
		
		await super.setRole(user, role)

		// Re-calculate approvers if role has "approveEvent" or "manageEvent" tag
		if(role.hasTag("approveEvent") || role.hasTag("manageEvent")) {
			await this.calculateApprovers()
		}
	}

	/** Sets upper units of the event */
	async setUpperUnits(units) {
		if(!units.length) {
			throw new Error("Akcja musi należeć do co najmniej jednej jednostki")
		}

		const unitsForSaving = []
		
		// Add event to new upper units
		for(const unit of units) {
			// Ensure unit is not a subUnit of other units
			if(await unit.traverse("subUnits").some(u => units.hasID(u.id))) {
				throw new Error("Jednostka nadrzędna nie może być pod inną jednostką nadrzędną akcji")
			}
			if(this.upperUnits.hasID(unit.id)) continue
			unit.events.push(this.id)
			unitsForSaving.push(unit)
		}
		
		// Remove event from old upper units
		await this.populate("upperUnits")
		for(const upperUnit of this.upperUnits) {
			if(units.hasID(upperUnit.id)) continue
			upperUnit.events = upperUnit.events.filter(e => e != this.id)
			unitsForSaving.push(upperUnit)
		}

		this.upperUnits = units

		// Check for org mismatch within invited units and participants
		const eventOrg = await this.getOrg()
		if(eventOrg) {
			await this.populate({"invitedUnits": "unit"})
			for(const invite of this.invitedUnits) {
				if(invite.state == "declined") continue
				if(invite.unit.org && invite.unit.org != eventOrg) {
					throw new HTTPError(400, "Na akcję zaproszona jest jednostka z innej organizacji")
				}
			}
			await this.populate({"participants": "user"})
			for(const participant of this.participants) {
				if(participant.user.org && participant.user.org != eventOrg) {
					throw new HTTPError(400, "Na akcję zaproszony jest uczestnik z innej organizacji")
				}
			}
		}

		// Save event
		await this.save()

		// Save all units
		for(const unit of unitsForSaving) await unit.save()

		// Re-calculate approvers
		await this.calculateApprovers()
	}

	/** Invite unit to event */
	async inviteUnit(unit, state="pending") {
		// Remove existing invites
		this.invitedUnits = this.invitedUnits.filter(i => i.unit != unit.id)

		// Check for org mismatch
		const eventOrg = await this.getOrg()
		if(eventOrg && unit.org && unit.org != eventOrg) {
			throw new HTTPError(400, "Nie można zaprosić jednostki z innej organizacji")
		}
		
		// Invite unit
		this.invitedUnits.push({
			unit: unit.id,
			state
		})

		unit.eventInvites.push(this.id)

		await this.save()
		await unit.save()
	}

	/** Uninvite unit from event */
	async uninviteUnit(unit) {
		// Get invitation
		const targetInvitation = this.invitedUnits.id(unit.id)
		
		// Check if unit invited
		if(!targetInvitation) {
			throw new HTTPError(400, "Jednostka nie jest zaproszona na akcję")
		}

		await targetInvitation.uninvite()
	}

	/** Sets registration open state */
	async setRegistrationState(value) {
		if(value) {
			if(this.isPast) throw new HTTPError(400, "Nie można otworzyć zapisów na akcję, która już się rozpoczęła")
			if(!this.remainingSpaces) throw new HTTPError(400, "Osiągnięto limit uczestników, nie można otworzyć zapisów")
			this.reg = true
		} else {
			this.reg = false
		}

		// Save event
		await this.save()
	}

	/** Invites a participant to the event */
	async inviteParticipant(targetUser, unit, saveEvent=true) {
		// Check if user already added
		if(this.participants.some(p => p.user.id == targetUser.id)) return
		
		// Add user to invited
		this.participants.push({
			user: targetUser,
			state: "pending",
			originUnit: unit
		})
		
		// Remove any existing invite
		targetUser.eventInvites = targetUser.eventInvites.filter(i => i != this.id)
		
		// Add event invite to user
		targetUser.eventInvites.push(this.id)

		// Save user
		await targetUser.save()

		if(saveEvent) await this.save()
	}

	/** Get an approver of a user */
	getApprover(user) {
		for(const approver of this.approvers) {
			if(user.roles.hasID(approver.role.id)) return approver
		}
	}

	/** Calculates the org of this event */
	async getOrg() {
		await this.populate("upperUnits")
		let eventOrg
		for(const upperUnit of this.upperUnits) {
			// Skip units without org
			if(!upperUnit.org) continue
			// Clear event org if unit with other org is encountered
			if(eventOrg && upperUnit.org != eventOrg) {
				return null
			}
			eventOrg = upperUnit.org
		}
		return eventOrg
	}

	/** Generates a list of approvers required for this event */
	async calculateApprovers() {
		await this.populate("roles")
		let approverCandidates = []
		const alternativeCandidates = []
		
		const eventOrg = await this.getOrg()
		
		// Loop through all upper units
		for await(const unit of this.traverse("upperUnits")) {
			// Skip units in different org
			if(eventOrg && unit.org != eventOrg) continue
			
			// Loop through roles of each unit
			await unit.populate("roles")
			for(const role of unit.roles) {
				// Skip roles without "approveEvent" tag
				if(!role.hasTag("approveEvent")) continue
				// Skip roles belonging to users already found
				if(approverCandidates.some(r => r.user.id == role.user.id)) continue
				if(alternativeCandidates.some(r => r.user.id == role.user.id)) continue
				// Roles belonging to users with "manageEvent" roles in this event get added as alternatives
				if(this.roles.some(r => r.user.id == role.user.id && r.hasTag("manageEvent"))) {
					alternativeCandidates.push(role)
				} else {
					approverCandidates.push(role)
				}
			}
		}

		// Sort candidates by rank of unit
		await approverCandidates.populate("unit", {select: "type"})
		approverCandidates.sort((a, b) => {
			return a.unit.config.rank - b.unit.config.rank
		})

		// Choose approvers based on configured required amount
		if(this.config.approvalsRequired > 0) {
			approverCandidates = approverCandidates.slice(0, this.config.approvalsRequired)
		}

		// If not enough approvers, add from alternatives
		if(approverCandidates.length < this.config.approvalsRequired) {
			const requiredAmount = this.config.approvalsRequired - approverCandidates.length
			approverCandidates.push(...alternativeCandidates.slice(0, requiredAmount))
		}

		// Remove any existing approvers not in new list
		this.approvers = this.approvers.filter(a =>
			approverCandidates.some(c => c.id == a.role.id)
		)

		// Add any new approvers
		for(const role of approverCandidates) {
			if(this.approvers.id(role.id)) continue
			this.approvers.push({role})
		}

		await this.save()
		
		return this.approvers
	}
}

const schema = mongoose.Schema.fromClass(EventClass)

schema.beforeDelete = async function() {
	await this.populate({
		"upperUnits": {},
		"roles": {
			"unit": {}
		}
	})


	// Remove from all units
	for(const upperUnit of this.upperUnits) {
		upperUnit.events = upperUnit.events.filter(u => u != this.id)
		await upperUnit.save()
	}
	
	// Uninvite all units
	for(const unitInvite of this.invitedUnits) {
		await unitInvite.uninvite()
	}

	// Remove all roles
	for(const role of this.roles) {
		await role.delete()
	}
}

schema.permissions = await import("./permissions.js")

export default mongoose.model("Event", schema, "events")