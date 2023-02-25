import {InsightError} from "./IInsightFacade";
import {JSONchecker, queryCheckerForIs} from "./additionalHelperFunctionsQueryChecking";

function whereChecker (queryWhole: any, datasetID: string): boolean {
	let whereString: string = "WHERE";
	const queryWhereBlock  = queryWhole[whereString as keyof typeof queryWhole];
	if (queryWhereBlock === undefined || null) {
		throw new InsightError("Missing WHERE");
	}
	if (Object.keys(queryWhereBlock).length > 1) {
		throw new InsightError("WHERE should only have 1 key, has " + Object.keys(queryWhereBlock).length);
	}
	if (Object.keys(queryWhereBlock).length === 0) {
		return true;
	} else if (Object.prototype.hasOwnProperty.call(queryWhereBlock, "LT") ||
			   Object.prototype.hasOwnProperty.call(queryWhereBlock, "GT") ||
			   Object.prototype.hasOwnProperty.call(queryWhereBlock, "EQ")) {
		queryCheckerForLtGtEq(queryWhereBlock,datasetID);
	} else if (Object.prototype.hasOwnProperty.call(queryWhereBlock, "IS")) {
		queryCheckerForIs(queryWhereBlock,datasetID);
	} else if (Object.prototype.hasOwnProperty.call(queryWhereBlock, "OR")) {
		queryCheckerForOr(queryWhereBlock,datasetID);
	} else if (Object.prototype.hasOwnProperty.call(queryWhereBlock, "AND")) {
		queryCheckerForAnd(queryWhereBlock,datasetID);
	} else if (Object.prototype.hasOwnProperty.call(queryWhereBlock, "NOT")) {
		queryCheckerForNot(queryWhereBlock,datasetID);
	} else {
		// console.log(Object.keys(queryWhereBlock));
		throw new InsightError("Invalid filter key: " + Object.keys(queryWhereBlock) );
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
	if (key[0] === "LT") {
		queryCheckerForLtGtEq(objectDeepest, datasetID);
	} else if (key[0] === "GT") {
		queryCheckerForLtGtEq(objectDeepest, datasetID);
	} else if (key[0] === "EQ") {
		queryCheckerForLtGtEq(objectDeepest, datasetID);
	} else if (key[0] === "IS") {
		queryCheckerForIs(objectDeepest, datasetID);
	} else if (key[0] === "OR") {
		queryCheckerForOr(objectDeepest, datasetID);
	} else if (key[0] === "AND") {
		queryCheckerForAnd(objectDeepest, datasetID);
	} else if (key[0] === "NOT") {
		queryCheckerForNot(objectDeepest, datasetID);
	} else {
		throw new InsightError("Invalid filter key: " + key[0]);
	}
}
// checks query for OR
function queryCheckerForOr(queryWhereBlock: any, datasetID: string) {
	let whereBlockKey: string = "OR";
	let objectDeepest = queryWhereBlock[whereBlockKey];
	// console.log(objectDeepest);
	for (const element of objectDeepest) {
		let key = Object.keys(element);
		// console.log(Object.keys(element));
		switch (key[0]) {
			case "LT":
				queryCheckerForLtGtEq(element, datasetID);
				break;
			case "GT":
				queryCheckerForLtGtEq(element, datasetID);
				break;
			case "EQ":
				queryCheckerForLtGtEq(element, datasetID);
				break;
			case "IS":
				queryCheckerForIs(element, datasetID);
				break;
			case "OR":
				queryCheckerForOr(element, datasetID);
				break;
			case "AND":
				queryCheckerForAnd(element, datasetID);
				break;
			case "NOT":
				queryCheckerForNot(element, datasetID);
				break;
			default:
				throw new InsightError("Invalid filter key: " + key[0]);
		}
	}
}
// checks query for AND
function queryCheckerForAnd(queryWhereBlock: any, datasetID: string) {
	let whereBlockKey: string = "AND";
	let objectDeepest = queryWhereBlock[whereBlockKey];
	// console.log(objectDeepest);
	for (const element of objectDeepest) {
		let key = Object.keys(element);
		// console.log(Object.keys(element));
		switch(key[0]) {
			case "LT":
				queryCheckerForLtGtEq(element,datasetID);
				break;
			case "GT":
				queryCheckerForLtGtEq(element,datasetID);
				break;
			case "EQ":
				queryCheckerForLtGtEq(element,datasetID);
				break;
			case "IS":
				queryCheckerForIs(element,datasetID);
				break;
			case "OR":
				queryCheckerForOr(element,datasetID);
				break;
			case "AND":
				queryCheckerForAnd(element,datasetID);
				break;
			case "NOT":
				queryCheckerForNot(element,datasetID);
				break;
			default:
				throw new InsightError("Invalid filter key: " + key[0]);
		}
	}
}

// returns true if the query does not violate IS/LT/GT rules
function queryCheckerForLtGtEq(queryWhereBlock: any, datasetID: string) {
	// let whereString: string = "WHERE";
	// const queryWhereBlock  = queryWhole[whereString as keyof typeof queryWhole];
	let whereBlockKey: string = "INITIALIZED";
	if (Object.prototype.hasOwnProperty.call(queryWhereBlock, "LT")) {
		whereBlockKey = "LT";
	};
	if	(Object.prototype.hasOwnProperty.call(queryWhereBlock, "GT")) {
		whereBlockKey = "GT";
	};
	if (Object.prototype.hasOwnProperty.call(queryWhereBlock, "EQ")) {
		whereBlockKey = "EQ";
	};
	let objectDeepest = queryWhereBlock[whereBlockKey];
	let objectKeys = Object.keys(objectDeepest);
	if (objectKeys.length > 1) {
		throw new InsightError("this field can only have 1 key");
	}
	let objectKey = objectKeys[0];
	// console.log(objectKey);
	let allowableFields: string[] = [datasetID + "_audit", datasetID + "_year", datasetID + "_pass",
		datasetID + "_fail", datasetID + "_avg"];
	if (!allowableFields.includes(objectKey)) {
		throw new InsightError("Invalid key type for " + whereBlockKey);
	}
	if (typeof (objectDeepest[objectKey]) !== "number"){
		throw new InsightError("invalid Value type for " + whereBlockKey + ", should be number");
	}
}
// comment to add a line without ESLint losing it
function queryCheckerForColumns(queryWhole: any, datasetID: string) {
	// let some: string = "OPTIONS";
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
	let allowableKeys: string[] = ["dept", "avg", "id", "audit", "pass", "year", "fail", "uuid", "title", "instructor"];
	let validDatasetSeen = 0;
	for (let element of arrayInsideColumns) {
		if (typeof element !== "string" || !element.includes("_")) {
			throw new InsightError("Invalid type of COLUMN key: " + element);
		}
		let splitArray = element.split("_");
		// console.log(splitArray[0]," ",splitArray[1]);
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
// comment to add a line without ESLint losing it
function queryValidator(queryMy: unknown) {
	let queryWhole = JSONchecker(queryMy);
	let datasetID: string = getDatasetID(queryMy);
	whereChecker(queryWhole,datasetID);
	queryCheckerForColumns(queryWhole,datasetID);
}
// comment to add a line without ESLint losing it
export {getDatasetID, queryCheckerForLtGtEq, queryCheckerForColumns, queryValidator,
};
