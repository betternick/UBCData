import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	Dataset,
} from "./IInsightFacade";

import {QueryContainer} from "../model/QueryContainer";

import {checkIdAndKind, readContent} from "./helperFunctionsAddDataset";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	public static map: Map<string, Dataset>;

	constructor() {
		InsightFacade.map = new Map<string, Dataset>();
		console.log("InsightFacadeImpl::init()");
	}

	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		return new Promise(function (resolve, reject) {
			let keys: string[];
			let throwFlag = 0;

			try {
				checkIdAndKind(id, kind, InsightFacade.map);
			} catch (err: any) {
				reject(new InsightError(err));
			};

			// if (!checkIdAndKind(id, kind, InsightFacade.map)) {
			// 	reject(new InsightError("ID and kind check failed"));
			// }

			let myDataset: Dataset = {
				id: id,
				kind: InsightDatasetKind.Sections,
				numRows: 0,
				datasetArray: [],
			};

			// let arrray: any = [];
			readContent(content, myDataset.datasetArray)
				.then((length) => {
					myDataset.numRows = length;
					InsightFacade.map.set(id, myDataset);
					// ref: https://linuxhint.com/convert-map-keys-to-array-javascript/
					keys = [...InsightFacade.map.keys()];
					resolve(keys);
				})
				.catch((err) => {
					reject(new InsightError(err));
				});
			// Step 5): diskWrite: write this object to data folder for persistence.
			// 		resolve(keys);
			// 		resolve(keys);
			// 		console.log(keys);
		});
	}

	public removeDataset(id: string): Promise<string> {
		return new Promise(function (resolve, reject) {
			if (id.includes("_")) {
				reject(new InsightError("_ character is not allowed"));
			}
			// Removing whitespace reference: https://stackoverflow.com/questions/10800355/remove-whitespaces-inside-a-string-in-javascript
			if (id.replace(/\s+/g, "").length === 0) {
				reject(new InsightError("ID cannot have only whitespaces"));
			}

			if (!InsightFacade.map.has(id)) {
				reject(new NotFoundError("Dataset doesn't exist"));
			}

			InsightFacade.map.delete(id);
			resolve(id);
			// return Promise.reject("Not implemented.");
		});
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {
		return new Promise(
			(resolve, reject) => {
				// Step 1) check if the query is a JSON object
				try {
					JSON.parse(query as string);
				} catch (error) {
					// object not properly formatted
					reject(new InsightError("Not a valid JSON object"));
				}

				// Step 2) parse the query
				let queryParsed = JSON.parse(query as string);

				// Step 3) get the datasetID
				let datasetID: string;
				datasetID = this.getDatasetID(queryParsed);
				let datasetToQuery = InsightFacade.map.get(datasetID);

				// Step 4) check if a dataset with datasetID has been added
				// TODO


				// Step 5) perform actions
				let where = "WHERE", options = "OPTIONS";
				let results: InsightResult[] = [];

				// catch first level of query (OPTIONS or WHERE)
				if (Object.prototype.hasOwnProperty.call(queryParsed, where) ||
					Object.prototype.hasOwnProperty.call(queryParsed, options)) {

					// check that query object has BOTH OPTIONS and WHERE
					if (Object.prototype.hasOwnProperty.call(queryParsed, where) &&
						Object.prototype.hasOwnProperty.call(queryParsed, options)) {

						let queryObject = new QueryContainer();

						// handleOptions
						try {
							queryObject.handleOptions(queryParsed.get(options), datasetID);
						} catch (error) {
							reject(error);
						}

						// handleWhere
						try {
							// LINDA -not sure why, but IntelliJ seems to think InsightFacade.map.get(datasetID) can be type
							// Dataset or Undefined -> so parameter to handleWhere is datasetToQuery as Dataset to skirt this issue
							results = queryObject.handleWhere(queryParsed.get(where), datasetID,
															  datasetToQuery as Dataset);
						} catch (error) {
							reject(error);
						}

						resolve(results);

					}
					// At this point, there is a WHERE block, but no OPTIONS block (or vice versa), so reject
					reject(new InsightError("query missing WHERE or OPTIONS block"));
				}
				// At this point, there is no WHERE and no OPTIONS block, so reject
				reject(new InsightError("query missing WHERE and OPTIONS blocks"));
			});
	}

	public listDatasets(): Promise<InsightDataset[]> {
		return new Promise(function (resolve, reject) {
			let array: InsightDataset[] = [];
			// ref: https://www.hackinbits.com/articles/js/how-to-iterate-a-map-in-javascript---map-part-2
			InsightFacade.map.forEach(function (value, key) {
				let thing: InsightDataset = {
					id: "a",
					kind: InsightDatasetKind.Sections,
					numRows: 0,
				};
				thing.id = key;
				thing.kind = value.kind;
				thing.numRows = value.numRows;
				array.push(thing);
			});
			resolve(array);
		});
	}

	// ------------------  HELPER FUNCTIONS ------------------

	// determines if the ID is valid
	public datasetIDValid(datasetID: string): boolean{
		return !(datasetID.includes("_"));
	}

	// finds the first dataset ID from a query
	public getDatasetID(query: JSON): string{
		const queryString = JSON.stringify(query);
		const indexUnderscore = queryString.indexOf("_");
		const indexStartOfID = queryString.lastIndexOf("{", indexUnderscore) + 2;
		let result: string;
		result = queryString.substring(indexStartOfID, indexUnderscore);
		return result;
	}
}
