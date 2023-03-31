// document.getElementById("click-me-button").addEventListener("click", handleClickMe);
//
// function handleClickMe() {
// 	alert("Button Clicked!");
// }



userStory1 = document.getElementById("UserStory1Form");

userStory1.addEventListener("submit", (e) => {
	e.preventDefault();

	let department = document.getElementById("Department");

	// Input Validation for User Story 1
	if (department.value == "") {
		alert("Some required fields are missing. Please check inputs and try again.");
		}

	let JSONQuery = coursesQueryBuilder(department.value);
	sendRequest(JSONQuery,aloadCourses());
});




Reference: https://www.freecodecamp.org/news/how-to-submit-a-form-with-javascript/#
	// let userStory2;
	userStory2 = document.getElementById("UserStory2Form");

	userStory2.addEventListener("submit", (e) => {
	e.preventDefault();

	let buildingCode = document.getElementById("Building");
	let seatingCapacity = document.getElementById("SeatingCapacity");
	let greaterThan = document.getElementById("GreaterThan");
	let lessThan = document.getElementById("LessThan");
	let comparatorCode;
	let seatingCapacityOrDefault;
	let buildingCodeValue = buildingCode.value;

// abc

	console.log(buildingCode.value,seatingCapacity.value,greaterThan.value,lessThan.value);

	// Input Validation for User Story 2
	if (seatingCapacity.value == "") {

		if (document.getElementById('GreaterThan').checked ||
			document.getElementById('LessThan').checked) {
			alert("Room capacity must be specified when Less than/Greater than are selected");
		}
	} else {
		if (document.getElementById('GreaterThan').checked) {
			comparatorCode = "GT"
		} else {
			comparatorCode = "LT"
		}

		if (seatingCapacity.value == "") {
			seatingCapacityOrDefault = 10000;
		}

		let JSONQuery = buildingQueryBuilder(seatingCapacityOrDefault,buildingCodeValue,comparatorCode)
		sendRequest(JSONQuery,aloadBuildings());
	}
});

	function buildingQueryBuilder(seatingCapacity,buildingCode,comparatorCode){
		let JSONQuery = `{
			"WHERE": {
				"AND":
					[
						{"IS": {
								"rooms_shortname": "${buildingCode}"
							}},
						{"${comparatorCode}": {
								"rooms_seats": ${seatingCapacity}
							}}
					]
			}
			,
			"OPTIONS": {
				"COLUMNS": [
					"rooms_shortname",
					"rooms_name",
					"rooms_seats"
				],
				"ORDER": "rooms_seats"
			}
		}`;
		return JSONQuery;
}


function coursesQueryBuilder(departmentCode){
	let JSONQuery = `{
  "WHERE": {
    "AND": [
      {
        "IS": {
          "sections_dept": "${departmentCode}"
        }
      },
      {
        "IS": {
          "sections_id": "4*"
        }
      },
      {
        "GT": {
          "sections_year": 2010
        }
      }
    ]
  },
  "OPTIONS": {
    "COLUMNS": [
      "sections_dept",
      "sections_id",
      "overallAvg"
    ]
  },
  "TRANSFORMATIONS": {
    "GROUP": [
      "sections_dept",
      "sections_id"
    ],
    "APPLY": [
      {
        "overallAvg": {
          "AVG": "sections_avg"
        }
      }
    ]
  }
}`;
	return JSONQuery;
}

// let thing = buildingQueryBuilder(45,"CHEM","LT");
// console.log(thing);

// How to make dynamic tables in HTML using JS
// https://code-boxx.com/display-dynamic-content-html/

// <div id="container"></div>
// <input type="button" value="Load Data" onclick="aload();">

	<!-- (B) AJAX LOAD JSON DATA -->

		function aloadBuildings (data) {
				// let data = [
				// 	{
				// 		"rooms_shortname": "CHEM",
				// 		"rooms_name": "CHEM_C124",
				// 		"rooms_seats": 90
				// 	},
				// 	{
				// 		"rooms_shortname": "CHEM",
				// 		"rooms_name": "CHEM_C126",
				// 		"rooms_seats": 90
				// 	},
				// 	{
				// 		"rooms_shortname": "CHEM",
				// 		"rooms_name": "CHEM_D200",
				// 		"rooms_seats": 114
				// 	},
				// 	{
				// 		"rooms_shortname": "CHEM",
				// 		"rooms_name": "CHEM_D300",
				// 		"rooms_seats": 114
				// 	},
				// 	{
				// 		"rooms_shortname": "CHEM",
				// 		"rooms_name": "CHEM_B250",
				// 		"rooms_seats": 240
				// 	},
				// 	{
				// 		"rooms_shortname": "CHEM",
				// 		"rooms_name": "CHEM_B150",
				// 		"rooms_seats": 265
				// 	}
				// ];
				var table = "<table id=mytable>";
				table += `<tr><th>Building Name</th><th>Room Name</th><th>Seating Capacity</th></tr>`;
				for (let element of data) {
					table += `<tr><td>${element.rooms_shortname}</td><td>${element.rooms_name}</td>
<td>${element.rooms_seats}</td></tr>`;
				}
				table += "</table>";
				document.getElementById("container").innerHTML = table;

	}


function aloadCourses () {
	// let data = [
	//     {
	//         "sections_dept": "cpsc",
	//         "sections_id": "404",
	//         "overallAvg": 75.33
	//     },
	//     {
	//         "sections_dept": "cpsc",
	//         "sections_id": "410",
	//         "overallAvg": 77.51
	//     },
	//     {
	//         "sections_dept": "cpsc",
	//         "sections_id": "411",
	//         "overallAvg": 79.74
	//     },
	//     {
	//         "sections_dept": "cpsc",
	//         "sections_id": "415",
	//         "overallAvg": 71.63
	//     },
	//     {
	//         "sections_dept": "cpsc",
	//         "sections_id": "416",
	//         "overallAvg": 75.73
	//     },
	//     {
	//         "sections_dept": "cpsc",
	//         "sections_id": "418",
	//         "overallAvg": 80.51
	//     },
	//     {
	//         "sections_dept": "cpsc",
	//         "sections_id": "420",
	//         "overallAvg": 72.94
	//     },
	//     {
	//         "sections_dept": "cpsc",
	//         "sections_id": "421",
	//         "overallAvg": 75.86
	//     },
	//     {
	//         "sections_dept": "cpsc",
	//         "sections_id": "422",
	//         "overallAvg": 74.46
	//     },
	//     {
	//         "sections_dept": "cpsc",
	//         "sections_id": "425",
	//         "overallAvg": 74.06
	//     },
	//     {
	//         "sections_dept": "cpsc",
	//         "sections_id": "430",
	//         "overallAvg": 77.49
	//     },
	//     {
	//         "sections_dept": "cpsc",
	//         "sections_id": "444",
	//         "overallAvg": 78.38
	//     },
	//     {
	//         "sections_dept": "cpsc",
	//         "sections_id": "445",
	//         "overallAvg": 82.91
	//     },
	//     {
	//         "sections_dept": "cpsc",
	//         "sections_id": "449",
	//         "overallAvg": 92.41
	//     },
	//     {
	//         "sections_dept": "cpsc",
	//         "sections_id": "490",
	//         "overallAvg": 89.28
	//     }
	// ]
	var table = "<table id=mytable>";
	table += `<tr><th>Department</th><th>Course No.</th><th>Average</th></tr>`;
	for (let element of data) {
		table += `<tr><td>${element.sections_dept}</td><td>${element.sections_id}</td>
<td>${element.overallAvg}</td></tr>`;
	}
	table += "</table>";
	document.getElementById("container").innerHTML = table;

}

	// https://developer.mozilla.org/en-US/docs/Web/Guide/AJAX/Getting_Started
	function sendRequest(JSONQuery,func) {
		const httpRequest = new XMLHttpRequest();
		httpRequest.onreadystatechange = handler;
		httpRequest.open("POST", "http://www.example.org/some.file", true);
		httpRequest.setRequestHeader(
			"Content-Type",
			"application/json"
		);
		httpRequest.send(JSONQuery);

		function handler() {
			try {
				if (httpRequest.readyState === XMLHttpRequest.DONE) {
					if (httpRequest.status === 200) {
						const response = JSON.parse(httpRequest.responseText);
						func(response);
					} else {
						alert("There was a problem with the request.");
					}
				}
			} catch (e) {
				alert(`Caught Exception: ${e.description}`);
			}
		}
	}






