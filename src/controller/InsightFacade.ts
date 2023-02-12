import {
	Dataset,
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
} from "./IInsightFacade";

import {QueryContainer} from "../model/QueryContainer";

import {
	addToPersistFolder,
	checkIdAndKind,
	deleteDatasetFromPersistence,
	readContent, readDirectory,
} from "./helperFunctionsAddDataset";
import {clearDisk, getContentFromArchives} from "../../test/TestUtil";
import {expect} from "chai";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	public static map: Map<string, Dataset>;

	public static persistDir = "./data";
	public static persistFile = "./data/persistFile.json";

	constructor() {
		InsightFacade.map = new Map<string, Dataset>();
		console.log("InsightFacadeImpl::init()");
		readDirectory(InsightFacade.persistDir, InsightFacade.map);
	}

	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		return new Promise(function (resolve, reject) {
			let keys: string[];
			let throwFlag = 0;

			let myDataset: Dataset = {
				id: id,
				kind: InsightDatasetKind.Sections,
				numRows: 0,
				datasetArray: [],
			};

			checkIdAndKind(id, kind, InsightFacade.map)
				.then(() => {
					return readContent(content, myDataset.datasetArray);
				})

				.then((length) => {
					myDataset.numRows = length;
					InsightFacade.map.set(id, myDataset);

					// ref: https://linuxhint.com/convert-map-keys-to-array-javascript/
					keys = [...InsightFacade.map.keys()];
					// resolve(keys);
					// Step 5): diskWrite: write this object to data folder for persistence.
					return addToPersistFolder(myDataset, keys);
				})
				.then((keysParam) => {
					resolve(keysParam);
				})
				.catch((err) => {
					reject(new InsightError(err));
				});
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
				console.log(InsightFacade.map.has(id));
				reject(new NotFoundError("Dataset doesn't exist"));
			}

			InsightFacade.map.delete(id);

			deleteDatasetFromPersistence(InsightFacade.persistDir, id)
				.then(() => {
					resolve(id);
				})
				.catch(() => {
					reject(new InsightError("could not delete dataset"));
				});
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

				if (datasetToQuery === undefined) {
					reject(new InsightError("the dataset you are looking for has not been added"));
				}

				// catch first level of query (OPTIONS or WHERE)
				if (Object.prototype.hasOwnProperty.call(query, "WHERE") ||
					Object.prototype.hasOwnProperty.call(query, "OPTIONS")
				) {
					// check that query object has BOTH OPTIONS and WHERE
					if (Object.prototype.hasOwnProperty.call(query, "WHERE") &&
						Object.prototype.hasOwnProperty.call(query, "OPTIONS")
					) {
						let queryObject = new QueryContainer();

						// handleOptions
						try {
							queryObject.handleOptions(queryParsed[this.getIndex(queryParsed, "OPTIONS")][1], datasetID);
						} catch (error) {
							reject(error);
						}

						// handleWhere
						let results: InsightResult[] = [] ;
						try {
							results = queryObject.handleWhere(
								queryParsed[this.getIndex(queryParsed, "WHERE")][1],
								datasetID,
								datasetToQuery as Dataset
							);
						} catch (error) {
							reject(error);
						}

						// handleSort
						results = queryObject.handleSort(results);
						resolve(results);
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

	public getIndex(queryParsed: string | any, item: string): number {
		let index: number = -1;
		for (let x = 0; x < queryParsed.length; x++) {
			if (queryParsed[x][0] === item) {
				index = x;
			}
		}
		return index;
	}
}
