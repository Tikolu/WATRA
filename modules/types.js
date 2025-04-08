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

export const JednostkaType = {
	ZASTĘP: 0,
	DRUŻYNA: 1,
	HUFIEC: 2,
	CHORĄGIEW: 3
}

export const FunkcjaNames = {
	[JednostkaType.ZASTĘP]: [
		["szeregowy"],
		["podzastępowy"],
		["zastępowy"]
	],
	[JednostkaType.DRUŻYNA]: [
		["szeregowy"],
		["przyboczny"],
		["drużynowy"]
	],
	[JednostkaType.HUFIEC]: [
		["szeregowy"],
		["referent"],
		["hufcowy"]
	],
	[JednostkaType.CHORĄGIEW]: [
		["szeregowy"],
		["referent"],
		["komendant"]
	]
}

export const WyjazdoweFunkcjaNames = [
	["szeregowy"],
	["kadra"],
	["komendant"]
]