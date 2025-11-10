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
		const output = [];
		while(output.length < n) output.push(this[Math.floor(Math.random() * this.length)]);
		return n == 1 ? output[0] : output;
	}
})

/** AsyncGenerator functions */
const tempAsyncGenerator = (async function* () { yield })()
tempAsyncGenerator.return()
const asyncGeneratorPrototype = tempAsyncGenerator.constructor.prototype
Object.defineProperty(asyncGeneratorPrototype, "find", {
	value: async function(callback) {
		for await(const item of this) {
			if(await callback(item)) {
				await this.return()
				return item
			}
		}
		return undefined
	}
})
Object.defineProperty(asyncGeneratorPrototype, "some", {
	value: async function(callback) {
		for await(const item of this) {
			if(await callback(item)) {
				await this.return()
				return true
			}
		}
		return false
	}
})