import {Dataset, InsightError, InsightResult, ResultTooLargeError} from "../controller/IInsightFacade";


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
	} else {
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
	} else {
		field = "audit";
	}
	return field;
}

// returns the expects type for the field (number or string)
export function returnValueType(field: string) {
	if (field === "id" || field === "Avg" || field === "Pass" || field === "Fail" || field === "Audit") {
		return "number";
	} else {
		return "string";
	}
}

// returns the identifier after an underscore
export function returnIdentifier(query: string): string {
	const indexUnderscore = query.indexOf("_");
	const indexEndOfIdentifier = query.indexOf('"', indexUnderscore);
	return query.substring(indexUnderscore + 1, indexEndOfIdentifier);
}

// return value used during the search (ie. value we are looking for)
export function returnValueToSearch(query: string) {
	const indexStartOfIdentifier = query.indexOf(":");
	const indexEndOfIdentifier = query.indexOf("}", indexStartOfIdentifier);
	return query.substring(indexStartOfIdentifier + 1, indexEndOfIdentifier);
}

export function insResultEquals (insRes1: InsightResult, insRes2: InsightResult) {
	// todo
}
