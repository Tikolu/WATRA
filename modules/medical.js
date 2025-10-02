export const medicalCategories = [
	{
		id: "medical",
		title: "Dane medyczne",
		other: "Dodaj inną dolegliwość",
		symptoms: {
			heading: "Opis przyczyn i objawów",
			placeholder: "Prosimy o dokładny opis wybranej dolegliwości. W jakich sytuacjach się nasila? Na jakie objawy zwracać uwagę?"
		},
		solutions: {
			heading: "Zalecenia (w tym leki)",
			placeholder: "Jak radzić sobię z tą dolegliwością? Jeśli zażywanę są leki, prosimy dokładnie opisać dawkowanie."
		},
		elements: [
			{
				title: "Choroba lokomocyjna",
				description: "Kinetoza lokomocyjna / morska"
			},
			{
				title: "Astma",
				description: "Duszności lub inne problemy z oddychaniem"
			},
			{
				title: "Alergie oddechowe",
				description: "Reakcje alergiczne na pyłki lub kurz"
			},
			{
				title: "Mdlenie",
				description: "Tendencje do słabnięcie lub mdlenia"
			},
			{
				title: "Migreny",
				description: "Bóle głowy"
			},
			{
				title: "Sen",
				description: "Koszmary, lunatykowanie, narkolepsja"
			},
			{
				title: "Fobie",
				description: "Intensywny / irracjonalny strach"
			},
			{
				title: "Zaburzenia psychiczne",
				description: "Autyzm, asperger, ADHD, OCD i inne"
			},
			{
				title: "Cukrzyca",
				description: "Problemy z poziomem cukru we krwi"
			},
			{
				title: "Epilepsja",
				description: "Padaczka lub inne zaburzenia"
			},
			{
				title: "Choroby krwi",
				description: "Anemia, białaczka, hemofilia i inne"
			}
		]
	},
	{
		id: "dietary",
		title: "Dane dietetyczne",
		other: "Dodaj inne wymaganie",
		symptoms: {
			heading: "Opis wymagania",
			placeholder: "Prosimy o dokładne opisanie powagi i poziomu wymagania dietetycznego."
		},
		solutions: {
			heading: "Zalecenia",
			placeholder: ""
		},
		elements: [
			{
				title: "Gluten lub zboże",
				description: "Nietolerancja lub alergia na gluten"
			},
			{
				title: "Nabiał lub laktoza",
				description: "Nietolerancja lub alergie na produkty mleczne"
			},
			{
				title: "Orzechy",
				description: "Nietolerancja lub alergia na orzechy"
			},
			{
				title: "Owoce morza i ryby",
				description: "Nietolerancja lub alergia na owoce morza lub ryby"
			},
			{
				title: "Preferencje dietetyczne",
				description: "Weganizm, wegetarianizm, peskatarianizm i inne"
			}
		]
	}
]