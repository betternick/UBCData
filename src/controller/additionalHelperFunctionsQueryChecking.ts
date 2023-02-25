import {Dataset, InsightDatasetKind, InsightError} from "./IInsightFacade";
import {queryCheckerForLtGtEq} from "./helperFunctionsQueryChecking";
// comment to add a line without ESLint losing it
function JSONchecker(query: unknown): any{
	let queryReturn;
	if (typeof query !== "object") {
		throw new InsightError("Invalid query string");
	} else if (query === null) {
		throw new InsightError("Invalid query string");
	}
	try {
		queryReturn = JSON.parse(JSON.stringify(query));
	} catch (err) {
		throw new InsightError("Invalid query string");
	}
	let objectKeys = Object.keys(queryReturn);
	let allowedKeys = ["WHERE", "ORDER", "OPTIONS"];
	let disallowedKeyFlag = false;
	for (const key of objectKeys) {
		if (!allowedKeys.includes(key)){
			disallowedKeyFlag = true;
		}
	}
	if (objectKeys.length > 3 || disallowedKeyFlag) {
		throw new InsightError("Excess keys in query");
	}
	return queryReturn;
}
// checks query for IS
function queryCheckerForIs(queryWhereBlock: any, datasetID: string) {
	let whereBlockKey: string = "IS";
	let objectDeepest = queryWhereBlock[whereBlockKey];
	let objectKeys = Object.keys(objectDeepest);
	if (objectKeys.length > 1) {
		throw new InsightError("this field can only have 1 key");
	}
	let objectKey = objectKeys[0];
	// console.log(objectKey);
	let allowableFields: string[] = [datasetID + "_dept", datasetID + "_instructor", datasetID + "_title",
		datasetID + "_id", datasetID + "_uuid"];
	if (!allowableFields.includes(objectKey)) {
		throw new InsightError("Invalid key type for " + whereBlockKey + ": " +
			objectKey.substring(datasetID.length + 1));
	}
	if (typeof (objectDeepest[objectKey]) !== "string"){
		throw new InsightError("Invalid Value type for " + whereBlockKey + ", should be string");
	}
	let stringVal: string = objectDeepest[objectKey];
	let count = stringVal.split("*").length - 1;
	let lengthOfStringVal = stringVal.length;
	if (count === 1) {
		let positionOfAsterisk = stringVal.indexOf("*");
		if (positionOfAsterisk !== 0 && positionOfAsterisk !== lengthOfStringVal - 1){
			throw new InsightError("Asterisks (*) can only be the first or last characters of input strings");
		}
	} else if (count === 2) {
		let firstPositionOfAsterisk = stringVal.indexOf("*");
		let lastPositionOfAsterisk = stringVal.lastIndexOf("*");
		if (firstPositionOfAsterisk !== 0 || lastPositionOfAsterisk !== lengthOfStringVal - 1){
			throw new InsightError("Asterisks (*) can only be the first or last characters of input strings");
		}
	} else if (count === 3) {
		throw new InsightError("Asterisks (*) can only be the first or last characters of input strings");
	}
}

// comment to add a line without ESLint losing it
export {JSONchecker, queryCheckerForIs,
};
