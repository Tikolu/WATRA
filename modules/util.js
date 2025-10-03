/** Function for checking if an object is empty */
Object.isEmpty = object => {
	if(object instanceof Array) {
		return object.length === 0
	} else if(object instanceof Object) {
		return Object.keys(object).length === 0
	}
	return false
}

/** Function for creating an array from conditional pairs */
Array.conditional = (...values) => {
	const result = []
	for(let i = 0; i < values.length; i += 2) {
		if(!values[i]) continue
		result.push(values[i + 1])
	}
	return result
}

/** Function for getting unique items from an array */
Object.defineProperty(Array.prototype, "unique", {
	value: function(key) {
		const output = []
		for(const item of this) {
			if(key === undefined) {
				if(output.includes(item)) {
					continue
				}
			} else if(output.find(i => i[key] === item[key])) {
				continue
			}
			output.push(item)
		}

		return output
	}
})