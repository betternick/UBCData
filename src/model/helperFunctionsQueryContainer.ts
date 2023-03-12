import {Dataset, InsightError, InsightResult, ResultTooLargeError} from "../controller/IInsightFacade";


// returns the identifier after an underscore
export function returnIdentifier(query: string): string {
	const indexUnderscore = query.indexOf("_");
	return query.substring(indexUnderscore + 1);
}
// return value after identifier in a string
// Linda -> probably want to refactor returnValueToSearch and doesThisSectionMatch to just use this function instead
export function getValue(section: any, identifier: string): string | number {
	let sectionJSON = section;
	return sectionJSON[identifier];
}
// transform field from naming convention in query to naming convention in dataset
export function transformQueryToDatasetConvention(field: string): string {
	if (field === "uuid") {
		field = "id";
	} else if (field === "id") {
		field = "Course";
	} else if (field === "title") {
		field = "Title";
	} else if (field === "instructor") {
		field = "Professor";
	} else if (field === "dept") {
		field = "Subject";
	} else if (field === "year") {
		field = "Year";
	} else if (field === "avg") {
		field = "Avg";
	} else if (field === "pass") {
		field = "Pass";
	} else if (field === "fail") {
		field = "Fail";
	} else if (field === "audit") {
		field = "Audit";
	}
	return field;					// used for rooms keys and applyKeys
}
// transform field from naming convention in dataset to naming convention in query
export function transformDatasetToQueryConvention(field: string): string {
	if (field === "id") {
		field = "uuid";
	} else if (field === "Course") {
		field = "id";
	} else if (field === "Title") {
		field = "title";
	} else if (field === "Professor") {
		field = "instructor";
	} else if (field === "Subject") {
		field = "dept";
	} else if (field === "Year") {
		field = "year";
	} else if (field === "Avg") {
		field = "avg";
	} else if (field === "Pass") {
		field = "pass";
	} else if (field === "Fail") {
		field = "fail";
	} else if (field === "Audit") {
		field = "audit";
	}
	return field;						// used for rooms keys and applyKeys
}

export function wildcardMatcher (stringToCheck: string, queryString: string): boolean {
	let countOfAsterisks = queryString.split("*").length - 1;
	let lengthOfQueryString = queryString.length;
	if (countOfAsterisks === 1) {								// CASE 1: When there is 1 asterisk
		let positionOfAsterisk = queryString.indexOf("*");
		if (positionOfAsterisk === 0) { 						// Asterisk is at start of string
			let subStringToMatch = queryString.substring(1);
			if (stringToCheck.endsWith(subStringToMatch)) {
				return true;
			}
		}
		if (positionOfAsterisk === lengthOfQueryString - 1) { 	// Asterisk is at end of string
			let subStringToMatch = queryString.substring(0, lengthOfQueryString - 1);
			if (stringToCheck.startsWith(subStringToMatch)) {
				return true;
			}
		}
	}
	if (countOfAsterisks === 2) {
		let subStringToMatch = queryString.substring(1, lengthOfQueryString - 1);
		if (stringToCheck.includes(subStringToMatch)) {
			return true;
		}
	}
	return false;
}

export function createIResWhereHelper(datasetID: string, mySection: JSON, fieldsArray: string[]): InsightResult {
	let myInsightResult: InsightResult = {};
	for (let col in fieldsArray) {
		let keyCol = datasetID.concat("_", transformDatasetToQueryConvention(fieldsArray[col]));
		let valOfSection = getValue(mySection, fieldsArray[col]);
		let keyVal: string | number = "";
		if (keyCol === datasetID + "_year") {
			// need to check if sections = overall, if yes, year = 1900
			let secField = getValue(mySection, "Section");
			if (secField === "overall") {
				keyVal = 1900;
			} else {
				keyVal = Number(valOfSection); 	// need to convert year to number
			}
		} else if (keyCol === datasetID + "_uuid") {
			keyVal = valOfSection.toString();	// need to convert uuid to string
		} else if (keyCol === datasetID + "_seats") {
			keyVal = Number(valOfSection);		// need to convert seats to number
		} else {
			keyVal = valOfSection;
		}
		myInsightResult[keyCol] = keyVal;
	}
	return myInsightResult;
}

// sorts array by string of keys, using sortByThenBy logic, in ascending or descending order based on dir
// Order of keys determines how ties are broken
export function sort (array: InsightResult[], keys: string[], dir: number): InsightResult[] {
	// sorting array of objects by list of keys, dynamically: https://stackoverflow.com/questions/41808710/
	// sort-an-array-of-objects-by-dynamically-provided-list-of-object-properties-in-a

	return array.sort(function(a, b) {
		// generate compare function return value by iterating over the properties array
		return keys.reduce(function(bool, k) {
			// if previous compare result is `0` then compare with the next property value and return result
			let result = (a[k] < b[k]) ? -1 : (a[k] > b[k]) ? 1 : 0;
			result = result * dir;
			let r = bool || result;
			return r;
		}, 0);   // set initial value as 0
	});
}
