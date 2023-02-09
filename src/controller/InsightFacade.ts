import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	Dataset,
} from "./IInsightFacade";

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
		return Promise.reject("Not implemented.");
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
}
