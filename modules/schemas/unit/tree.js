class UnitTree {
	constructor(options={}) {
		this.unit = options.unit || null
		this.subUnits = options.subUnits || []
		this.members = options.members || []
		this.org = options.org || null
	}

	contains(tree) {
		if(!this.unit || !tree.unit) return false
		if(this.unit.id == tree.unit.id) return true

		for(const subTree of this.subUnits) {
			if(subTree.contains(tree)) return true
		}

		return false
	}

	get userCount() {
		let count = this.members.length
		for(const subTree of this.subUnits) {
			count += subTree.userCount
		}
		return count
	}
}

export default UnitTree