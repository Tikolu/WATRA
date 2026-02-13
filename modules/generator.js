const tempAsyncGenerator = (async function* () { yield })()
tempAsyncGenerator.return()
const asyncGeneratorPrototype = tempAsyncGenerator.constructor.prototype

function setupBuffer(generator) {
	if(generator.buffer) return
	Object.defineProperty(generator, "buffer", {
		value: []
	})
}

Object.defineProperty(asyncGeneratorPrototype, "every", {
	value: async function(callback) {
		setupBuffer(this)
		for(const value of this.buffer) {
			if(!await callback(value)) {
				return false
			}
		}
		while(true) {
			const {value, done} = await this.next()
			if(done) break
			this.buffer.push(value)
			if(!await callback(value)) {
				return false
			}
		}
		return true
	}
})

Object.defineProperty(asyncGeneratorPrototype, "filter", {
	value: async function * (callback) {
		setupBuffer(this)
		for(const value of this.buffer) {
			if(await callback(value)) {
				yield value
			}
		}
		while(true) {
			const {value, done} = await this.next()
			if(done) break
			this.buffer.push(value)
			if(await callback(value)) {
				yield value
			}
		}
	}
})

Object.defineProperty(asyncGeneratorPrototype, "find", {
	value: async function(callback) {
		setupBuffer(this)
		for(const value of this.buffer) {
			if(await callback(value)) {
				return value
			}
		}
		while(true) {
			const {value, done} = await this.next()
			if(done) break
			this.buffer.push(value)
			if(await callback(value)) {
				return value
			}
		}
		return undefined
	}
})

Object.defineProperty(asyncGeneratorPrototype, "flatMap", {
	value: async function * (callback) {
		setupBuffer(this)
		for(const value of this.buffer) {
			yield * await callback(value)
		}
		while(true) {
			const {value, done} = await this.next()
			if(done) break
			this.buffer.push(value)
			yield * await callback(value)
		}
	}
})

Object.defineProperty(asyncGeneratorPrototype, "forEach", {
	value: async function(callback) {
		setupBuffer(this)
		for(const value of this.buffer) {
			await callback(value)
		}
		while(true) {
			const {value, done} = await this.next()
			if(done) break
			this.buffer.push(value)
			await callback(value)
		}
	}
})

Object.defineProperty(asyncGeneratorPrototype, "map", {
	value: async function * (callback) {
		setupBuffer(this)
		for(const value of this.buffer) {
			yield await callback(value)
		}
		while(true) {
			const {value, done} = await this.next()
			if(done) break
			this.buffer.push(value)
			yield await callback(value)
		}
	}
})

Object.defineProperty(asyncGeneratorPrototype, "some", {
	value: async function(callback) {
		setupBuffer(this)
		for(const value of this.buffer) {
			if(await callback(value)) {
				return true
			}
		}
		while(true) {
			const {value, done} = await this.next()
			if(done) break
			this.buffer.push(value)
			if(await callback(value)) {
				return true
			}
		}
		return false
	}
})

Object.defineProperty(asyncGeneratorPrototype, "toArray", {
	value: async function() {
		setupBuffer(this)
		while(true) {
			const {value, done} = await this.next()
			if(done) break
			this.buffer.push(value)
		}
		return this.buffer
	}
})