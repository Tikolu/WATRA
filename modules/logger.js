export class Logger {
	constructor(label, color=30) {
		this.label = label
		this.color = color
	}

	log(...args) {
		console.log(`\x1b[${this.color}m[${this.label}]\x1b[0m`, ...args)
	}
}