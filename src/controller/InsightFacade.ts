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

		// Step 1) check is the query is a JSON object
		try {
			JSON.parse(query as string);
		} catch (error) {
			// object not properly formatted
			return Promise.reject(new InsightError("Not a valid JSON object"));
		}

		// Step 2) parse the query
		let queryObject = JSON.parse(query as string);

		// Step 3) get the datasetID
		let datasetID: string;
		try {
			datasetID = this.getDatasetID(queryObject);
		} catch (error) {
			// datasetID is invalid (has an _)
			return Promise.reject(error);
		}

		// Step 4) perform actions
		let where = "WHERE", options = "OPTIONS";
		// let order = "ORDER", columns = "COLUMNS";
		// let is = "IS", not = "NOT", and = "AND", or = "OR";
		// let lt = "LT", gt = "GT", eq = "EQ";
		// let avg = "avg", pass = "pass", fail = "fail", audit = "audit", year = "year";
		// let dept = "dept", id = "id", instructor = "instructor", title = "title", uuid = "uuid";
		// let idstring = "idstring", inputstring = "inputstring";

		// catch first level of query (OPTIONS or WHERE)
		if (Object.prototype.hasOwnProperty.call(queryObject, where) ||
			Object.prototype.hasOwnProperty.call(queryObject, options)) {

			// check that query object has BOTH OPTIONS or WHERE
			if (Object.prototype.hasOwnProperty.call(queryObject, where)){
				if (Object.prototype.hasOwnProperty.call(queryObject, options)) {

					// handleWhere
					try {
						(this.handleWhere(queryObject.WHERE, datasetID));
					} catch (error) {
						return Promise.reject(error);
					}

					// handleOptions
					try {
						(this.handleOptions(queryObject.OPTIONS, datasetID));
					} catch (error) {
						return Promise.reject(error);
					}
				}
			}
			// At this point, there is a WHERE block, but no OPTIONS block (or vice versa), so reject
			return Promise.reject(new InsightError("query missing WHERE or OPTIONS block"));
		}

		// At this point, there is no WHERE and no OPTIONS block, so reject
		return Promise.reject(new InsightError("query missing WHERE and OPTIONS blocks"));
	}

	public listDatasets(): Promise<InsightDataset[]> {
		return Promise.reject("Not implemented.");
	}


	// ------------------ PRIVATE MEMBER HELPER FUNCTIONS ------------------

	// finds the first dataset ID from a query
	// throws InsightError if dataset ID violates rules (includes _)
	private getDatasetID(query: JSON){
		// TODO: return the dataset ID as a string or return an InsightError if iD includes _
		return "";
	}

	// function that handles the WHERE section of the query
	// Linda - this is recursive
	private handleWhere(whereQuery: JSON, datasetID: string){
		// TODO: code this!
		// if any dataset ID's found in the where block do not match the datasetID parameter,
		// throw InsightError("multiple datasets referenced")
	}

	// function that handles the OPTIONS section of the query
	// Linda - is this recursive?
	private handleOptions(optionsQuery: JSON, datasetID: string){
		// TODO: code this!
		// if any dataset ID's found in the where block do not match the datasetID parameter,
		// throw InsightError("multiple datasets referenced")
	}
}
