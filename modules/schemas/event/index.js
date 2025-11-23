import mongoose from "mongoose"
import * as Text from "modules/text.js"
import * as datetime from "jsr:@std/datetime"
import HTTPError from "modules/server/error.js"
import Config from "modules/config.js"

import Role from "modules/schemas/role.js"
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
				() => new Date().setHours(0, 0, 0, 0),
				"Data rozpoczęcia nie może być w przeszłości"
			],
			max: MAX_DATE,
			validate: [
				function(value) {
					return value <= this.dates.end
				},
				"Data rozpoczęcia musi być przed datą zakończenia"
			],
			required: true
		},
		end: {
			type: Date,
			min: [
				() => new Date().setHours(0, 0, 0, 0),
				"Data zakończenia nie może być w przeszłości"
			],
			max: MAX_DATE,
			validate: [
				function(value) {
					return this.dates.start <= value
				},
				"Data rozpoczęcia musi być przed datą zakończenia"
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

	invitedUnits = [unitInvite]
	participants = [participant]
	approvers = [approver]


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

	/* * Methods * */

	/** Sets a role for a event */
	async setRole(user, roleType) {
		const role = new Role({
			type: roleType,
			eventRole: true
		})
		
		await super.setRole(user, role)
	}

	/** Invite unit to event */
	async inviteUnit(unit, state="pending") {
		// Remove existing invites
		this.invitedUnits = this.invitedUnits.filter(i => i.unit != unit.id)
		
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

	/** Get an approver of a user */
	getApprover(user) {
		for(const approver of this.approvers) {
			if(user.roles.hasID(approver.role.id)) return approver
		}
	}

	/** Generates a list of approvers required for this event */
	async calculateApprovers() {
		await this.populate("roles")
		let approverCandidates = []
		const alternativeCandidates = []
		
		// Loop through all upper units
		for await(const unit of this.getUpperUnitsTree()) {
			// Loop through roles of each unit
			await unit.populate("roles")
			for(const role of unit.roles) {
				// Skip roles without "approveEvent" tag
				if(!role.hasTag("approveEvent")) continue
				// Skip roles belonging to users already found
				if(approverCandidates.some(r => r.user == role.user)) continue
				if(alternativeCandidates.some(r => r.user == role.user)) continue
				// Roles belonging to users with "manageEvent" roles in this event get added as alternatives
				if(this.roles.some(r => r.user == role.user && r.hasTag("manageEvent"))) {
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