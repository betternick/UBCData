import {
	Dataset,
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
} from "./IInsightFacade";

import {
	addToPersistFolder,
	checkIdAndKind,
	deleteDatasetFromPersistence,
	loadDatasetFromPersistence,
	readContent,
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
		loadDatasetFromPersistence(InsightFacade.map)
			.then((p) => {
				console.log("datasets loaded upon new facade object" + p);
			})
			.catch(() => {
				throw new InsightError("wasn't able to load/make file upon new facade object");
			});
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
				reject(new NotFoundError("Dataset doesn't exist"));
			}

			InsightFacade.map.delete(id);

			let deleted: boolean;
			try {
				deleted = deleteDatasetFromPersistence(id);
				if (deleted === true) {
					resolve(id);
				} else {
					reject(new NotFoundError("Tried to delete Dataset from disk but not found"));
				}
			} catch (err) {
				reject(new InsightError("Synchronous read/write failed: could not delete dataset"));
			}
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

// SYED: I use the following to test and debug code. will remove at the end.
//
// let facade = new InsightFacade();
// let sectionsLightSection = getContentFromArchives("Pair3CoursesOnly.zip");
// let sectionsSingle = getContentFromArchives("singleCourse.zip");

// let sections = getContentFromArchives("Pair.zip");
// facade.addDataset("Heavy sections 2",sections,InsightDatasetKind.Sections).then((fg)=>{
// 	// console.log(fg);
// 	console.log(InsightFacade.map);
// });

// console.log(InsightFacade.map);

// console.log(InsightFacade.map);
//
// facade.addDataset("Light sections THREE",sectionsLightSection,InsightDatasetKind.Sections).then((fg)=>{
// 	console.log(fg);
// 	// console.log(InsightFacade.map);
// });

// facade.addDataset("Light sections ONE",sectionsLightSection,InsightDatasetKind.Sections).then((fg)=>{
// 	console.log(fg);
// 	// console.log(InsightFacade.map);
// });
// //
// console.log(InsightFacade.map);
// facade.removeDataset("Heavy sections").then(() => {
// 	console.log(InsightFacade.map);
// });

// console.log(InsightFacade.map);
//
// facade.removeDataset("Light sections TWO").then(() => {
// 	facade.removeDataset("Light sections ONE").then(() => {
// 		console.log(InsightFacade.map);
// 	});
// });

// deleteDatasetFromPersistence("Heavy sections");
// deleteDatasetFromPersistence("Light sections");

// );

// let facade = new InsightFacade();
// let f;
// facade.listDatasets().then((res)=>{
// 	f = res;
// });
// console.log("hey");
// console.log(f);
// let res = loadDatasetFromPersistence(InsightFacade.map);
// console.log(res);

// let facade = new InsightFacade();
// console.log(InsightFacade.map);
//
// facade.removeDataset("TWOO").then(() => {
// 	console.log(InsightFacade.map);
// }
// );

// async function test333() {
// 	let facade = new InsightFacade();
// 	const result = await facade.addDataset("qwerty", sectionsLightSection, InsightDatasetKind.Sections);
// 	expect(result.length).to.equals(1);
// 	expect(result[0]).to.equals("qwerty");
// 	const len2 = await facade.listDatasets();
// 	expect(len2.length).to.equals(1);
// };
//
// test333();
