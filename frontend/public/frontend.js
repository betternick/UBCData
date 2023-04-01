
userStory1 = document.getElementById("UserStory1Form");

userStory1.addEventListener("submit", (e) => {
	e.preventDefault();

	let department = document.getElementById("Department");

	// Input Validation for User Story 1
	if (department.value == "") {
		alert("Some required fields are missing. Please check inputs and try again.");
	}
	let departmentValue = department.value.toLowerCase();
	let JSONQuery = coursesQueryBuilder(departmentValue);
	sendRequest(JSONQuery,"course");
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
	let buildingCodeValue = buildingCode.value.toUpperCase();

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
		} else {
			seatingCapacityOrDefault = seatingCapacity.value;
		}

		let JSONQuery = buildingQueryBuilder(seatingCapacityOrDefault,buildingCodeValue,comparatorCode)
		sendRequest(JSONQuery,"building");

	}
});

function buildingQueryBuilder(seatingCapacity,buildingCode,comparatorCode){
	// console.log(seatingCapacity);
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

function aloadBuildings(data) {
	var table = "<table id=mytable>";
	table += `<tr><th>Building Name</th><th>Room Name</th><th>Seating Capacity</th></tr>`;
	let array = data.result;
	for (let element of array) {
		table += `<tr  class=fade-in-text><td>${element.rooms_shortname}</td><td>${element.rooms_name}</td>
<td>${element.rooms_seats}</td></tr>`;
	}
	if (data.result.length === 0){
		table += `<tr  class=fade-in-text><td></td><td>0 Results</td><td></td></tr>`;
	}
	table += "</table>";
	document.getElementById("container").innerHTML = table;
}


function aloadCourses(data) {
	var table = "<table id=mytable>";
	table += `<tr><th>Department</th><th>Course No.</th><th>Average</th></tr>`;
	console.log(data);
	console.log(data.result);
	let array = data.result;
	for (let element of array) {
		table += `<tr  class=fade-in-text><td>${element.sections_dept}</td><td>${element.sections_id}</td>
<td>${element.overallAvg}</td></tr>`;
	}
	if (data.result.length === 0){
		table += `<tr  class=fade-in-text><td></td><td>0 Results</td><td></td></tr>`;
	}
	table += "</table>";
	document.getElementById("container").innerHTML = table;

}

// https://developer.mozilla.org/en-US/docs/Web/Guide/AJAX/Getting_Started
function sendRequest(JSONQuery,queryType) {
	const httpRequest = new XMLHttpRequest();
	console.log("aaaaaa");
	httpRequest.onreadystatechange = handler;
	httpRequest.open("POST", "http://localhost:4321/query", true);
	httpRequest.setRequestHeader(
		"Content-Type",
		"application/json"
	);
	console.log(JSONQuery);
	httpRequest.send(JSONQuery);

	function handler() {
		try {
			if (httpRequest.readyState === XMLHttpRequest.DONE) {
				if (httpRequest.status === 200) {
					const response = JSON.parse(httpRequest.responseText);
					if (queryType === "building"){
						aloadBuildings(response);
					} else if (queryType === "course") {
						console.log("right before call to aloadCpurse");
						aloadCourses(response);
					}
				} else {
					alert("There was a problem with the request.");
				}
			}
		} catch (e) {
			alert(`Caught Exception: ${e.description}`);
		}
	}
}


// Reference: https://www.w3schools.com/howto/howto_css_modals.asp
function openModal() {
	var modal = document.getElementById("myModal");
	modal.style.display = "block";

	var closeBtn = document.querySelector(".close");
	closeBtn.addEventListener("click", function() {
		closeModal();
	});
}

function closeModal() {
	var modal = document.getElementById("myModal");
	modal.style.display = "none";
}

window.onclick = function(event) {
	var modal = document.getElementById("myModal");
	if (event.target == modal) {
		modal.style.display = "none";
	}
}



