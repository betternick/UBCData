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
	readDirectory,
	readSectionsContent,
} from "./helperFunctionsAddDataset";

import {QueryValidator} from "./queryValidator";
import {readRoomsContent} from "./AddDatasetRooms";
import {getContentFromArchives} from "../../test/TestUtil";


/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	public map: Map<string, Dataset> = new Map<string, Dataset>();

	public static persistDir = "./data";
	public static persistFile = "./data/persistFile.json";

	constructor() {
		// InsightFacade.map = new Map<string, Dataset>();
		console.log("InsightFacadeImpl::init()");
		readDirectory(InsightFacade.persistDir, this.map);
	}

	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		return new Promise((resolve, reject) => {
			let keys: string[];
			let throwFlag = 0;

			let myDataset: Dataset = {
				id: id,
				kind: InsightDatasetKind.Sections,
				numRows: 0,
				datasetArray: [],
			};

			checkIdAndKind(id, kind, this.map)
				.then((type) => {
					if (type === "sections"){
						return readSectionsContent(content, myDataset.datasetArray);
					} else {
						myDataset.kind = InsightDatasetKind.Rooms;
						return readRoomsContent(content, myDataset.datasetArray);
					}
				})
				.then((length) => {
					myDataset.numRows = length;
					this.map.set(id, myDataset);
					// ref: https://linuxhint.com/convert-map-keys-to-array-javascript/
					keys = [...this.map.keys()];
					// resolve(keys);
					// Step 5): diskWrite: write this object to data folder for persistence.
					// console.log(myDataset);
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
		return new Promise((resolve, reject) => {
			if (id.includes("_")) {
				return reject(new InsightError("_ character is not allowed"));
			}
			// Removing whitespace reference: https://stackoverflow.com/questions/10800355/remove-whitespaces-inside-a-string-in-javascript
			if (id.replace(/\s+/g, "").length === 0) {
				return reject(new InsightError("ID cannot have only whitespaces"));
			}

			if (!this.map.has(id)) {
				console.log(this.map.has(id));
				return reject(new NotFoundError("Dataset doesn't exist"));
			}

			this.map.delete(id);

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
			} else if (query === null || query === undefined) {
				return reject(new InsightError("query is null or undefined"));
			} else {
				let datasetID = this.getDatasetID(query);
				let datasetToQuery = this.map.get(datasetID);

				if (datasetToQuery === undefined) {
					return reject(new InsightError("the dataset you are looking for has not been added"));
				} else {

					try {
						let validator = new QueryValidator();
						validator.validateQuery(query, datasetID, datasetToQuery.kind);
					} catch (err: any) {
						return reject(new InsightError(err));
					}

					let queryJSON = query;
					// check that query object has BOTH OPTIONS and WHERE
					if (Object.prototype.hasOwnProperty.call(query, "WHERE") &&
						Object.prototype.hasOwnProperty.call(query, "OPTIONS")
					) {
						let queryObject = new QueryContainer();

						// handleOptions
						queryObject.handleOptions(queryJSON["OPTIONS" as keyof typeof queryJSON]);

						// handleTransformations
						queryObject.handleTransformations(queryJSON["TRANSFORMATIONS" as keyof typeof queryJSON]);

						// handleWhere
						let results: InsightResult[] = [];
						try {
							results = queryObject.handleWhere(queryJSON["WHERE" as keyof typeof queryJSON], datasetID,
								datasetToQuery);
						} catch (error) {
							return reject(error);
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
		return new Promise((resolve, reject) => {
			let array: InsightDataset[] = [];
			// ref: https://www.hackinbits.com/articles/js/how-to-iterate-a-map-in-javascript---map-part-2
			this.map.forEach(function (value, key) {
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


// let rooms: string;
// rooms = getContentFromArchives("campus.zip");
// // let roomsBroken = getContentFromArchives("campus9buildings.zip");
// // let dataset: JSON[] = [];
// //
// let facade = new InsightFacade();
// facade.addDataset("rooms",rooms,InsightDatasetKind.Rooms).then(() => {
// 	console.log("yes");
// });
