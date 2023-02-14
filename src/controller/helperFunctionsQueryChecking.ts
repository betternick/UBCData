
import {Dataset, InsightDatasetKind, InsightError} from "./IInsightFacade";

function JSONchecker(query: unknown): any{
	let queryReturn;
	if (typeof query !== "object") {
		throw new InsightError("Query is not an object");
	} else if (query === null) {
		throw new InsightError("Query is null? Why Sir!!");
	}
	try {
		queryReturn = JSON.parse(JSON.stringify(query));
	} catch (err) {
		throw new InsightError("Not a valid JSON object");
	}
	return queryReturn;
}

function whereChecker (queryWhole: any): any {
	let whereString: string = "WHERE";
	let returnArray: any[] = [];
	// const whereBlockKey;
	const queryWhereBlock  = queryWhole[whereString as keyof typeof queryWhole];
	returnArray.push(queryWhereBlock);
	if (queryWhereBlock === undefined || null) {
		throw new InsightError("Missing WHERE");
	}
	if (Object.keys(queryWhereBlock).length > 1) {
		throw new InsightError("WHERE should only have 1 key, has " + Object.keys(queryWhereBlock).length);
	}

	// if (Object.prototype.hasOwnProperty.call(queryWhereBlock, "LT")) {
	// 	whereBlockKey; = "LT";
	// };
	// if	(Object.prototype.hasOwnProperty.call(queryWhereBlock, "GT")) {
	// 	whereBlockKey; = "GT";
	// };
	// if (Object.prototype.hasOwnProperty.call(queryWhereBlock, "EQ")) {
	// 	whereBlockKey; = "EQ";
	// };
	// if (Object.prototype.hasOwnProperty.call(queryWhereBlock, "EQ")) {
	// 	whereBlockKey; = "IS";
	// };
	// if (Object.prototype.hasOwnProperty.call(queryWhereBlock, "EQ")) {
	// 	whereBlockKey; = "OR";
	// };
	// if (Object.prototype.hasOwnProperty.call(queryWhereBlock, "EQ")) {
	// 	whereBlockKey; = "AND";
	// };
	return returnArray;
}


// returns true if the query does not violate IS/LT/GT rules
function queryCheckerForLTGTEQ(queryWhole: any, datasetID: string): boolean {

	const queryWhereBlock  = whereChecker(queryWhole);

	let whereBlockKey: string = "FLAG";
	if (Object.prototype.hasOwnProperty.call(queryWhereBlock, "LT")) {
		whereBlockKey = "LT";
	};
	if	(Object.prototype.hasOwnProperty.call(queryWhereBlock, "GT")) {
		whereBlockKey = "GT";
	};
	if (Object.prototype.hasOwnProperty.call(queryWhereBlock, "EQ")) {
		whereBlockKey = "EQ";
	};
	if (whereBlockKey === "FLAG") {
		return true;
	}
	let objectDeepest = queryWhereBlock[whereBlockKey];
	let objectKeys = Object.keys(objectDeepest);
	if (objectKeys.length > 1) {
		throw new InsightError("this field can only have 1 key");
		return false;
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
	return true;
}

function queryCheckerForColumns(queryWhole: any, datasetID: string) {
	let some: string = "OPTIONS";
	const queryOptionsBlock  = queryWhole[some as keyof typeof queryWhole];
	if (queryOptionsBlock === undefined || null) {
		throw new InsightError("Missing OPTIONS");
	}
	let queryOptionsBlockKeys = Object.keys(queryOptionsBlock);
	if (queryOptionsBlockKeys == null || undefined){
		throw new InsightError("OPTIONS blocks missing");
	}
	if (queryOptionsBlockKeys.length === 2){
		if (queryOptionsBlockKeys[0] !== "COLUMNS") {
			throw new InsightError("OPTIONS missing COLUMNS");
		}
	}
	let arrayInsideColumns = queryOptionsBlock[queryOptionsBlockKeys[0]];
	if (arrayInsideColumns.length === 0 || undefined || null){
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
		if (splitArray[0] !== datasetID){
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
	let orderField;
	if (queryOptionsBlockKeys.length === 2 && queryOptionsBlockKeys[0] === "COLUMNS" &&
		queryOptionsBlockKeys[1] === "ORDER"){
		orderField = queryOptionsBlock[queryOptionsBlockKeys[1]];
		if (orderField === null || orderField === undefined){
			throw new InsightError("invalid query string");
		} else if (!arrayInsideColumns.includes(orderField)){
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
	queryCheckerForLTGTEQ(queryWhole,datasetID);
	queryCheckerForColumns(queryWhole,datasetID);
}

export {
	getDatasetID,
	queryCheckerForLTGTEQ,
	queryCheckerForColumns,
	queryValidator,
};
