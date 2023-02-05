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

		return new Promise(
			(resolve, reject) => {
				// Step 1) check is the query is a JSON object
				try {
					JSON.parse(query as string);
				} catch (error) {
					// object not properly formatted
					reject(new InsightError("Not a valid JSON object"));
				}

				// Step 2) parse the query
				let queryParsed = JSON.parse(query as string);

				// Step 3) get the datasetID
				if (!this.datasetIDValid){
					reject(new InsightError("Invalid ID; has an underscore"));
				}
				let datasetID: string;
				datasetID = this.getDatasetID(queryParsed);


				// Step 4) perform actions
				let where = "WHERE", options = "OPTIONS";

				// TODO: will probably need to move these declarations into helper functions
				// let order = "ORDER", columns = "COLUMNS";
				// let is = "IS", not = "NOT", and = "AND", or = "OR";
				// let lt = "LT", gt = "GT", eq = "EQ";
				// let avg = "avg", pass = "pass", fail = "fail", audit = "audit", year = "year";
				// let dept = "dept", id = "id", instructor = "instructor", title = "title", uuid = "uuid";
				// let idstring = "idstring", inputstring = "inputstring";

				// catch first level of query (OPTIONS or WHERE)
				if (Object.prototype.hasOwnProperty.call(queryParsed, where) ||
					Object.prototype.hasOwnProperty.call(queryParsed, options)) {

					// check that query object has BOTH OPTIONS and WHERE
					if (Object.prototype.hasOwnProperty.call(queryParsed, where) &&
						Object.prototype.hasOwnProperty.call(queryParsed, options)) {

						// handleWhere
						// Linda- Unsure about how these will work, since I need to return an array of InsightResult
						// Linda - maybe I can create a Query object that stores all of the info for the query??? and handleWhere/handleOptions can be methods in the Query class
						// Linda - eg. comaprators, numbers, etc. -> need to think about this

						// this is a Query Object that stores all of the important info for the query
						let queryObject = new Query();

						try {
							queryObject.handleWhere(queryParsed, datasetID);
						} catch (error) {
							reject(error);
						}

						// handleOptions
						try {
							queryObject.handleOptions(queryParsed, datasetID);
						} catch (error) {
							reject(error);
						}
					}
					// At this point, there is a WHERE block, but no OPTIONS block (or vice versa), so reject
					reject(new InsightError("query missing WHERE or OPTIONS block"));
				}
				// At this point, there is no WHERE and no OPTIONS block, so reject
				reject(new InsightError("query missing WHERE and OPTIONS blocks"));
			});
	}

	public listDatasets(): Promise<InsightDataset[]> {
		return Promise.reject("Not implemented.");
	}


	// ------------------  HELPER FUNCTIONS ------------------

	// determines if the ID is valid
	public datasetIDValid(datasetID: string): boolean{
		return datasetID.includes("_");
	}

	// finds the first dataset ID from a query
	public getDatasetID(query: JSON): string{
		// TODO: return the dataset ID as a string
		// need to use REGEX
		return "";
	}


}
