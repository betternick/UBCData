import {
	Dataset,
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError, ResultTooLargeError,
} from "./IInsightFacade";

import {QueryContainer} from "../model/QueryContainer";

import {
	addToPersistFolder,
	checkIdAndKind,
	deleteDatasetFromPersistence,
	readContent, readDirectory,
} from "./helperFunctionsAddDataset";

import {
	queryValidator
} from "./helperFunctionsQueryChecking";
import {getContentFromArchives} from "../../test/TestUtil";

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
					return resolve(keysParam);
				})
				.catch((err) => {
					return reject(new InsightError(err));
				});
		});
	}

	public removeDataset(id: string): Promise<string> {
		return new Promise(function (resolve, reject) {
			if (id.includes("_")) {
				return reject(new InsightError("_ character is not allowed"));
			}
			// Removing whitespace reference: https://stackoverflow.com/questions/10800355/remove-whitespaces-inside-a-string-in-javascript
			if (id.replace(/\s+/g, "").length === 0) {
				return reject(new InsightError("ID cannot have only whitespaces"));
			}

			if (!InsightFacade.map.has(id)) {
				console.log(InsightFacade.map.has(id));
				return reject(new NotFoundError("Dataset doesn't exist"));
			}

			InsightFacade.map.delete(id);

			deleteDatasetFromPersistence(InsightFacade.persistDir, id)
				.then(() => {
					return resolve(id);
				})
				.catch(() => {
					return reject(new InsightError("could not delete dataset"));
				});
		});
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {
		return new Promise((resolve, reject) => {
			// Step 1) check if the query is a JSON object
			// console.log("Does this query NOT violate LT/EQ/GT rules?: Answer: " + g);
			if (typeof query !== "object") {
				return reject(new InsightError("Not a valid JSON object"));
			} else if (query == null) {
				return reject(new InsightError("query is null?"));
			} else {
				let datasetID = this.getDatasetID(query);
			//	SYED: checking for invalid queries
				try {
					queryValidator(query);
				} catch (err: any) {
					return reject(new InsightError(err));
				}
				let datasetToQuery = InsightFacade.map.get(datasetID);
				if (datasetToQuery === undefined) {
					return reject(new InsightError("the dataset you are looking for has not been added"));
				} else {
					let queryJSON = query;
					// check that query object has BOTH OPTIONS and WHERE
					if (Object.prototype.hasOwnProperty.call(query, "WHERE") &&
						Object.prototype.hasOwnProperty.call(query, "OPTIONS")
					) {
						let queryObject = new QueryContainer();
						// handleOptions
						try {
							queryObject.handleOptions(queryJSON["OPTIONS" as keyof typeof queryJSON], datasetID);
						} catch (error) {
							return reject(error);
						}
						// handleWhere
						let results: InsightResult[] = [];
						try {
							results = queryObject.handleWhere(queryJSON["WHERE" as keyof typeof queryJSON], datasetID,
								datasetToQuery);
						} catch (error) {
							return reject(error);
						}
						if (results.length > 5000) {
							return reject(new ResultTooLargeError("Exceeded 5000 entries"));
						}
						// remove uuid from InsightResults if UUID is not a column
						if (!queryObject.columns.includes("id")) {
							results = queryObject.filterUUID(results, datasetID);
						}
						// handleSort
						results = queryObject.handleSort(results);
						return resolve(results);
					}
					return reject(new InsightError("query missing WHERE/OPTIONS blocks"));
				}
			}
			return reject (new InsightError("reject"));
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
			return resolve(array);
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

//
// let query = {
// 	WHERE: {
// 		NOT: {
// 			sections_avg: 95
// 		}
// 	},
// 	OPTIONS: {
// 		COLUMNS: [
// 			"sections_dept",
// 			"sections_avg",
// 			"sections_id",
// 			"sections_audit",
// 			"sections_pass",
// 			"sections_year",
// 			"sections_fail",
// 			"sections_uuid",
// 			"sections_title",
// 			"sections_instructor"
// 		],
// 		ORDER: "sections_dept"
// 	}
// };
//

// let query3 = {
// 	WHERE: {
// 		NOT:{
// 			LT: {
// 				sections_avg: 99
// 			}
// 		}
// 	},
// 	OPTIONS: {
// 		COLUMNS: [
// 			"sections_dept",
// 			"sections_avg"
// 		],
// 		ORDER: "sections_avg"
// 	}
// };
// let g = queryValidator(query);
// console.log(g);
//
//
// let facade = new InsightFacade();
// let sections = getContentFromArchives("pair.zip");
//
// facade.addDataset("sections",sections,InsightDatasetKind.Sections).then((f) => {
//
// 	console.log(f);
// });
//
// facade.performQuery(query3).then((f) => {
// 	console.log(f);
// });
