import {
	Dataset,
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
} from "./IInsightFacade";

import {addToPersistFolder, checkIdAndKind, loadDatasetFromPersistence, readContent} from "./helperFunctionsAddDataset";
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

		loadDatasetFromPersistence(InsightFacade.map);
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
					// resolve(keys);
					// Step 5): diskWrite: write this object to data folder for persistence.
					addToPersistFolder(myDataset)
						.then(() => {
							resolve(keys);
						});
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

// let facade = new InsightFacade();
// let sectionsLightSection = getContentFromArchives("Pair3CoursesOnly.zip");
// let sections = getContentFromArchives("Pair.zip");
// facade.addDataset("TWOO",sections,InsightDatasetKind.Sections).then((fg)=>{
// 	// console.log(fg);
// 	// console.log(InsightFacade.map);
// });


// let facade = new InsightFacade();
// let f;
// facade.listDatasets().then((res)=>{
// 	f = res;
// });
// console.log("hey");
// console.log(f);
// let res = loadDatasetFromPersistence(InsightFacade.map);
// console.log(res);

// console.log(InsightFacade.map);

