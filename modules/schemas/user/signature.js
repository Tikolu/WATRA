export default class Signature {
	_id = false
	name = String
	time = Date

	get valid() {
		if(!this.name) return false
		if(!this.time) return false
		return true
	}
}