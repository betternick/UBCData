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
			}

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
		return new Promise((resolve, reject) => {
			// Step 1) check if the query is a JSON object
			if (typeof query !== "object") {
				reject(new InsightError("Not a valid JSON object"));
			} else if (query == null) {
				reject(new InsightError("query is null?"));
			} else {
				let queryParsed = Object.entries(query); // queryParsed has type "Object"
				let datasetID = this.getDatasetID(query);
				let datasetToQuery = InsightFacade.map.get(datasetID);

				// Step 4) check if a dataset with datasetID has been added // TODO

				// catch first level of query (OPTIONS or WHERE)
				if (Object.prototype.hasOwnProperty.call(query, "WHERE") ||
					Object.prototype.hasOwnProperty.call(query, "OPTIONS")) {
					// check that query object has BOTH OPTIONS and WHERE
					if (Object.prototype.hasOwnProperty.call(query, "WHERE") &&
						Object.prototype.hasOwnProperty.call(query, "OPTIONS")) {
						let queryObject = new QueryContainer();

						// handleOptions
						let indexOptions: number = -1;
						for (let i = 0; i < queryParsed.length; i++) {
							if (queryParsed[i][0] === "OPTIONS") {
								indexOptions = i;
							}
						}
						try {
							queryObject.handleOptions(queryParsed[indexOptions][1], datasetID);
						} catch (error) {
							reject(error);
						}

						// handleWhere
						let indexWhere: number = -1;
						for (let x = 0; x < queryParsed.length; x++) {
							if (queryParsed[x][0] === "WHERE") {
								indexWhere = x;
							}
						}
						try {
							let results = queryObject.handleWhere(queryParsed[indexWhere][1],datasetID,
								datasetToQuery as Dataset);
							resolve(results);
						} catch (error) {
							reject(error);
						}
					}
					reject(new InsightError("query missing WHERE or OPTIONS block"));
				}
			}
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
	public datasetIDValid(datasetID: string): boolean {
		return !datasetID.includes("_");
	}

	// finds the first dataset ID from a query
	public getDatasetID(query: object): string {
		const queryString = JSON.stringify(query);
		const indexUnderscore = queryString.indexOf("_");
		const indexStartOfID = queryString.lastIndexOf('"', indexUnderscore) + 1;
		let result: string;
		result = queryString.substring(indexStartOfID, indexUnderscore);
		return result;
	}
}
