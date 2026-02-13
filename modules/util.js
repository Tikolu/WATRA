import "modules/generator.js"

/** Global date limits */
globalThis.MIN_DATE = "1800-01-01"
globalThis.MAX_DATE = (new Date().getFullYear() + 100) + "-01-01"


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
	value: function(key, returnValues=false) {
		const output = []
		for(const item of this) {
			if(key === undefined) {
				if(output.includes(item)) {
					continue
				}
			} else if(returnValues) {
				if(output.includes(item[key])) continue
			} else if(output.find(i => i[key] === item[key])) {
				continue
			}
			output.push(returnValues ? item[key] : item)
		}

		return output
	}
})

/** Function for getting random items from an array */
Object.defineProperty(Array.prototype, "random", {
	value: function(n = 1) {
		const output = []
		while(output.length < n) output.push(this[Math.floor(Math.random() * this.length)])
		return n == 1 ? output[0] : output
	}
})

/** Function for comparing arrays */
Object.defineProperty(Array.prototype, "equals", {
	value: function(array) {
		if(this.length != array?.length) return false
		for(let i = 0; i < this.length; i++) {
			if(this[i] !== array[i]) return false
		}
		return true
	}
})