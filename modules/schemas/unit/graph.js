class Graph {
	constructor(options={}) {
		this.unit = options.unit || null
		this.subUnits = options.subUnits || []
		this.members = options.members || []
		this.org = options.org || null
	}

	contains(graph) {
		if(!this.unit || !graph.unit) return false
		if(this.unit.id == graph.unit.id) return true

		for(const subGraph of this.subUnits) {
			if(subGraph.contains(graph)) return true
		}

		return false
	}

	get userCount() {
		let count = this.members.length
		for(const subGraph of this.subUnits) {
			count += subGraph.userCount
		}
		return count
	}
}

export default Graph