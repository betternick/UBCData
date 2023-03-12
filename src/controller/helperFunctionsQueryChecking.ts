import {InsightError} from "./IInsightFacade";
import {JSONchecker, queryCheckerForIs} from "./additionalHelperFunctionsQueryChecking";

function whereChecker (queryWhole: any, datasetID: string): boolean {
	const queryWhereBlock = queryWhole["WHERE" as keyof typeof queryWhole];
	let keys = Object.keys(queryWhereBlock);
	if (queryWhereBlock === undefined || queryWhereBlock === null) {
		throw new InsightError("Missing WHERE");
	} else if (keys.length > 1) {
		throw new InsightError("WHERE should only have 1 key, has " + keys.length);
	} else if (keys.length === 0) {
		return true;
	} else if (keys[0] === "LT" || keys[0] === "GT" || keys[0] === "EQ") {
		queryCheckerForLtGtEq(queryWhereBlock,datasetID, keys[0]);
	} else if (keys[0] === "IS") {
		queryCheckerForIs(queryWhereBlock,datasetID);
	} else if (keys[0] === "OR" || keys[0] === "AND") {
		queryCheckerForOrAnd(queryWhereBlock,datasetID, keys[0]);
	} else if (keys[0] === "NOT") {
		queryCheckerForNot(queryWhereBlock,datasetID);
	} else {
		throw new InsightError("Invalid filter key: " + keys );
	}
	return true;
}
// checks query for NOT
function queryCheckerForNot(queryWhereBlock: any, datasetID: string) {
	let whereBlockKey: string = "NOT";
	let objectDeepest = queryWhereBlock[whereBlockKey];
	if (typeof objectDeepest !== "object"){
		throw new InsightError("NOT must be an object, currently not in object form");
	}
	let key = Object.keys(objectDeepest);
	if (key[0] === "LT" || key[0] === "GT" || key[0] === "EQ") {
		queryCheckerForLtGtEq(objectDeepest, datasetID, key[0]);
	} else if (key[0] === "IS") {
		queryCheckerForIs(objectDeepest, datasetID);
	} else if (key[0] === "OR" || key[0] === "AND") {
		queryCheckerForOrAnd(objectDeepest, datasetID, key[0]);
	} else if (key[0] === "NOT") {
		queryCheckerForNot(objectDeepest, datasetID);
	} else {
		throw new InsightError("Invalid filter key: " + key[0]);
	}
}
// checks query for OR/AND
function queryCheckerForOrAnd(queryWhereBlock: any, datasetID: string, comparator: string) {
	let objectDeepest = queryWhereBlock[comparator];
	for (const element of objectDeepest) {
		let key = Object.keys(element);
		if (key[0] === "LT" || key[0] === "GT" || key[0] === "EQ") {
			queryCheckerForLtGtEq(element, datasetID, key[0]);
		} else if (key[0] === "IS") {
			queryCheckerForIs(element, datasetID);
		} else if (key[0] === "OR" || key[0] === "AND") {
			queryCheckerForOrAnd(element, datasetID, key[0]);
		} else if (key[0] === "NOT") {
			queryCheckerForNot(element, datasetID);
		} else {
			throw new InsightError("Invalid filter key: " + key[0]);
		}
	}
}

// returns true if the query does not violate EQ/LT/GT rules
function queryCheckerForLtGtEq(queryWhereBlock: any, datasetID: string, comparator: string) {
	let objectDeepest = queryWhereBlock[comparator];
	let objectKeys = Object.keys(objectDeepest);
	if (objectKeys.length > 1) {
		throw new InsightError("this field can only have 1 key");
	}
	let objectKey = objectKeys[0];
	let allowableFields: string[] = [datasetID + "_audit", datasetID + "_year", datasetID + "_pass",
		datasetID + "_fail", datasetID + "_avg", datasetID + "_lat", datasetID + "_lon", datasetID + "_seats"];
	if (!allowableFields.includes(objectKey)) {
		throw new InsightError("Invalid key type for " + comparator);
	}
	if (typeof (objectDeepest[objectKey]) !== "number"){
		throw new InsightError("invalid Value type for " + comparator + ", should be number");
	}
}

function columnsChecker(queryWhole: any, datasetID: string) {
	const queryOptionsBlock = queryWhole["OPTIONS" as keyof typeof queryWhole];
	if (queryOptionsBlock === undefined || null) {
		throw new InsightError("Missing OPTIONS");
	}
	let queryOptionsBlockKeys = Object.keys(queryOptionsBlock);
	if (queryOptionsBlockKeys == null || undefined) {
		throw new InsightError("OPTIONS blocks missing");
	}
	if (!queryOptionsBlockKeys.includes("COLUMNS")) {
		throw new InsightError("OPTIONS missing COLUMNS");
	}
	let allowableKeysForOptions = ["COLUMNS", "ORDER"];
	let disallowedKeyFlag = false;
	for (const key of queryOptionsBlockKeys) {
		if (!allowableKeysForOptions.includes(key)) {
			disallowedKeyFlag = true;
		}
	}
	if (disallowedKeyFlag) {
		throw new InsightError("Invalid keys in OPTIONS");
	}
	let arrayInsideColumns = queryOptionsBlock["COLUMNS"];
	if (arrayInsideColumns.length === 0 || undefined || null) {
		throw new InsightError("COLUMNS must be a non-empty array");
	}
	let allowableKeys: string[] = ["dept", "avg", "id", "audit", "pass", "year", "fail", "uuid", "title", "instructor",
								   "lat", "lon", "seats", "fullname", "shortname", "number", "name", "address", "type",
								   "furniture", "href"];
	let validDatasetSeen = 0;
	for (let element of arrayInsideColumns) {
		if (typeof element !== "string" || !element.includes("_")) {
			throw new InsightError("Invalid type of COLUMN key: " + element);
		}
		let splitArray = element.split("_");
		if (splitArray[0] !== datasetID) {
			if (validDatasetSeen === 0) {
				throw new InsightError("Reference dataset not added yet");
			} else {
				throw new InsightError("Cannot query more than one dataset");
			}
		}
		validDatasetSeen = 1;
		if (!allowableKeys.includes(splitArray[1])) {
			throw new InsightError("Invalid key id in columns");
		}
	}
	orderFieldChecker(queryWhole);
}


function transformationsChecker(queryWhole: any, datasetID: string) {
	const queryTransBlock = queryWhole["TRANSFORMATIONS" as keyof typeof queryWhole];
	let queryTransBlockKeys = Object.keys(queryTransBlock);
	if (queryTransBlockKeys == null || undefined) {
		throw new InsightError("TRANSFORMATIONS blocks missing");
	}
	if (!queryTransBlockKeys.includes("GROUP")) {
		throw new InsightError("TRANSFORMATIONS missing GROUP");
	}
	if (!queryTransBlockKeys.includes("APPLY")) {
		throw new InsightError("TRANSFORMATIONS missing APPLY");
	}
	let allowableKeysForTransformations = ["GROUP", "APPLY"];
	let disallowedKeyFlag = false;
	for (const key of queryTransBlockKeys) {
		if (!allowableKeysForTransformations.includes(key)) {
			disallowedKeyFlag = true;
		}
	}
	if (disallowedKeyFlag) {
		throw new InsightError("Invalid keys in TRANSFORMATIONS");
	}
	groupChecker(queryTransBlock["GROUP" as keyof typeof queryTransBlock], datasetID);
	applyChecker(queryTransBlock["APPLY" as keyof typeof queryTransBlock], datasetID);
}

function groupChecker(group: string[], datasetID: string) {
	// TODO: for GROUP block of TRANSFORMATIONS
}

function applyChecker(apply: any, datasetID: string) {
	// TODO: for APPLY block of TRANSFORMATIONS
}


// Had to refactor this out of querycheckerForColumns due to exceeeding 50 line limit
function orderFieldChecker (queryWhole: any) {
	const queryOptionsBlock = queryWhole["OPTIONS" as keyof typeof queryWhole];
	let arrayInsideColumns = queryOptionsBlock["COLUMNS"];
	let queryOptionsBlockKeys = Object.keys(queryOptionsBlock);
	if (queryOptionsBlockKeys.length > 1 && queryOptionsBlockKeys.includes("ORDER")) {
		let orderField = queryOptionsBlock["ORDER"];
		if (orderField === null || orderField === undefined) {
			throw new InsightError("invalid query string");
		}
		if (!arrayInsideColumns.includes(orderField)) {
			throw new InsightError("ORDER key must be in COLUMNS");
		}
	}
}
// finds the first dataset ID from a query
function getDatasetID(query: unknown): string {
	const queryString = JSON.stringify(query);
	const indexUnderscore = queryString.indexOf("_");
	const indexStartOfID = queryString.lastIndexOf('"', indexUnderscore) + 1;
	let result: string;
	result = queryString.substring(indexStartOfID, indexUnderscore);
	return result;
}

function queryValidator(queryMy: unknown) {
	let queryWhole = JSONchecker(queryMy);
	let datasetID: string = getDatasetID(queryMy);
	whereChecker(queryWhole,datasetID);
	columnsChecker(queryWhole,datasetID);
	transformationsChecker(queryWhole, datasetID);
}

export {getDatasetID, queryCheckerForLtGtEq, columnsChecker, queryValidator,
};
