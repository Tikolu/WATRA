export const noDuplicates = {
	validator: array => {
		const set = new Set(array)
		return set.size === array.length
	},
	msg: "Duplicate values exist in array"
}

export const minItems = (items) => ({
	validator: array => array.length >= items,
	msg: `Array requires at least ${items} item${items == 1 ? "" : "s"}`
})