import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError
} from "./IInsightFacade";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	constructor() {
		console.log("InsightFacadeImpl::init()");
	}

	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		return Promise.reject("Not implemented.");
	}

	public removeDataset(id: string): Promise<string> {
		return Promise.reject("Not implemented.");
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {

		// Step 1) Check query type. If query is not a JSON file, reject
		checkIfJSON(query);
		// checks if the given query is a JSON file
		function checkIfJSON(queryInput: unknown) {
			// TODO: implement this function
			// if query is a JSON file, return. If query is NOT a JSON, reject
			return;
		}

		// Step 2) parse the query
		let queryObject = JSON.parse(query as string);

		// Step 3) perform actions
		// depending on properties of query (AKA which step of
		// the AST this function is on), perform appropriate action
		let where = "WHERE", options = "OPTIONS";
		let order = "ORDER", columns = "COLUMNS";
		let is = "IS", not = "NOT", and = "AND", or = "OR";
		let lt = "LT", gt = "GT", eq = "EQ";
		let avg = "avg", pass = "pass", fail = "fail", audit = "audit", year = "year";
		let dept = "dept", id = "id", instructor = "instructor", title = "title", uuid = "uuid";
		let idstring = "idstring", inputstring = "inputstring";

		// catch first level of query (OPTIONS or WHERE)
		if (Object.prototype.hasOwnProperty.call(queryObject, where) ||
			Object.prototype.hasOwnProperty.call(queryObject, options)) {

			// check that query object has BOTH OPTIONS or WHERE
			if (Object.prototype.hasOwnProperty.call(queryObject, where)){
				if (Object.prototype.hasOwnProperty.call(queryObject, options)) {
					// TODO: handle where and options
				}
			}
			// TODO: At this point, there is a WHERE, but no OPTIONS (or vice versa), so reject
		}

		// catch other levels?

		// TODO: if the code gets to this point, something is invalid, so reject
		return Promise.reject("Not implemented.");
	}

	public listDatasets(): Promise<InsightDataset[]> {
		return Promise.reject("Not implemented.");
	}
}
