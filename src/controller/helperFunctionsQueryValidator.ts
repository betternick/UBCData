import {InsightError} from "./IInsightFacade";

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
	let allowedKeys = ["WHERE", "ORDER", "OPTIONS", "TRANSFORMATIONS"];
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

export {JSONchecker};
