export const FunkcjaType = {
	SZEREGOWY: 0,

	PODZASTĘPOWY: 1,
	PRZYBOCZNY: 1,
	REFERENT: 1,
	KADRA: 1,

	ZASTĘPOWY: 2,
	KOMENDANT: 2,
	DRUŻYNOWY: 2
}

export const UnitType = {
	ZASTĘP: 0,
	DRUŻYNA: 1,
	HUFIEC: 2,
	CHORĄGIEW: 3
}

export const FunkcjaNames = {
	[UnitType.ZASTĘP]: [
		["szeregowy"],
		["podzastępowy"],
		["zastępowy"]
	],
	[UnitType.DRUŻYNA]: [
		["szeregowy"],
		["przyboczny"],
		["drużynowy"]
	],
	[UnitType.HUFIEC]: [
		["szeregowy"],
		["referent"],
		["hufcowy"]
	],
	[UnitType.CHORĄGIEW]: [
		["szeregowy"],
		["referent"],
		["komendant"]
	]
}

export const EventFunkcjaNames = [
	["szeregowy"],
	["kadra"],
	["komendant"]
]