
import {Dataset, InsightDatasetKind, InsightError} from "./IInsightFacade";


// returns true if the query does not violate IS/LT/GT rules
function queryCheckerForLTGTEQ(queryMy: unknown): boolean {
	let datasetID: string = getDatasetID(queryMy);
	let queryWhole;
	try {
		queryWhole = JSON.parse(JSON.stringify(queryMy));
	} catch (err) {
		throw new InsightError("Not a valid JSON query");
	}
	// console.log(queryWhole);
	let some: string = "WHERE";
	const queryWhereBlock  = queryWhole[some as keyof typeof queryWhole];

	if (queryWhereBlock === undefined || null) {
		throw new InsightError("Missing WHERE");
	}

	if (Object.keys(queryWhereBlock).length > 1) {
		throw new InsightError("WHERE should only have 1 key, has " + Object.keys(queryWhereBlock).length);
	}
	let keyWhereBlock: string = "FLAG";
	if (Object.prototype.hasOwnProperty.call(queryWhereBlock, "LT")) {
		keyWhereBlock = "LT";
	};
	if	(Object.prototype.hasOwnProperty.call(queryWhereBlock, "GT")) {
		keyWhereBlock = "GT";
	};
	if (Object.prototype.hasOwnProperty.call(queryWhereBlock, "EQ")) {
		keyWhereBlock = "EQ";
	};
	if (keyWhereBlock === "FLAG") {
		return true;
	}
	let objectDeepest = queryWhereBlock[keyWhereBlock];
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
		throw new InsightError("Invalid key type for " + keyWhereBlock);
	}
	if (typeof (objectDeepest[objectKey]) !== "number"){
		throw new InsightError("invalid Value type for " + keyWhereBlock + ", should be number");
	}
	return true;
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

export {
	getDatasetID,queryCheckerForLTGTEQ
};
