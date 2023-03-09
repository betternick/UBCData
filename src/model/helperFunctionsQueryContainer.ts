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
	return field;
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
	return field;
}
// checks whether only a single ID is referenced
export function singleDatasetID(query: string, datasetID: string) {
	for (let i = 0; i < query.length; i++) {
		if (query[i] === "_") {
			let indexStartOfID = query.lastIndexOf('"', i) + 1;
			let result = query.substring(indexStartOfID, i);
			if (result !== datasetID) {
				throw new InsightError("multiple datasets referenced");
			}
		}
	}
	return;
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
