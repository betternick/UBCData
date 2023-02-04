import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
} from "./IInsightFacade";

import {checkIdAndKind, readContent} from "./testDatasetExperimental3";
import {getContentFromArchives} from "../../test/TestUtil";


interface Dataset {
	id: string;
	kind: InsightDatasetKind;
	numRows: number;
	datasetArray: JSON[];
}

const map = new Map<string, Dataset>();
// const map = new Map();

// map1.set("a", 1);
// map1.set("b", 2);
// map1.set("c", 3);


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
		return new Promise(
			function (resolve, reject) {

				let keys: string[];
		// Step 1): CheckParams: Check if add dataset params (ID and kind) are acceptable.
		// 		let key2 = [...map.keys()];
		// 		let check = key2.includes(id);
		// 		console.log(check);
				try {
					if (!checkIdAndKind(id,kind,map)) {
						reject(new InsightError("ID and kind check failed"));
					};
				} catch (err){
					reject(err);
				}


				let myDataset: Dataset = {
					id: id,
					kind: kind,
					numRows: 0,
					datasetArray: [],
				};

		// let arrray: any = [];
				readContent(content,myDataset.datasetArray).then((length) => {
					myDataset.numRows = length;
					map.set(id, myDataset);
					keys = [...map.keys()];

					resolve(keys);

			// console.log(myDataset);
			// console.log(map);
			// console.log(map.keys());
			// ref: https://linuxhint.com/convert-map-keys-to-array-javascript/
			// keys = [...map.keys()];
			// console.log(keys);
				}).catch((err) => {
					reject(new InsightError("addDataset is failing"));
				});
		// 	.then(() => {
		// 	console.log(myDataset);
		// });
		// console.log(arrray);

		// Step 2): unZip: read zip file. check that not empty

		// Step 3): makeDataset: add valid sections to array. if valid sections are zero, throw error.

		// Step 4): createDataset: add the dataset created in prev step to insightFacade object. Update insight
		// facade object with info about added dataset.

		// Step 5): diskWrite: write this object to data folder for persistence.
		// 		resolve(keys);
		// 		resolve(keys);
		// 		console.log(keys);
			});

		// return Promise.resolve(keys);
	}

	public removeDataset(id: string): Promise<string> {

		return new Promise(
			function (resolve, reject) {

				if (id.includes("_")){
					reject(new InsightError("_ character is not allowed"));
				};
		// Removing whitespace reference: https://stackoverflow.com/questions/10800355/remove-whitespaces-inside-a-string-in-javascript
				if (id.replace(/\s+/g, "").length === 0){
					reject(new InsightError("ID cannot have only whitespaces"));
				};

				if (!map.has(id)){
					// console.log("it NO has id!");
					reject(new NotFoundError("Dataset doesn't exist"));
				}

				map.delete(id);
				resolve(id);
		// return Promise.reject("Not implemented.");
			});
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {
		return Promise.reject("Not implemented.");
	}

	public listDatasets(): Promise<InsightDataset[]> {

		return new Promise(
			function (resolve, reject) {

				let array: InsightDataset[] = [];
	// ref: https://www.hackinbits.com/articles/js/how-to-iterate-a-map-in-javascript---map-part-2
				map.forEach(function(value, key) {

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
				console.log(array);
				resolve(array);
			});
		// return Promise.reject("Not implemented.");
	}


}
// let dats = getContentFromArchives("pairLight.zip");
// let dats5 = getContentFromArchives("noCoursesFolder.zip");
// let dats4 = getContentFromArchives("brokenCourses.zip");
// let dats3 = getContentFromArchives("Pair3CoursesOnly.zip");
// let g = new InsightFacade();
//
// g.addDataset("er",dats3,InsightDatasetKind.Sections).then(() => {
// 	g.addDataset("er2",dats3,InsightDatasetKind.Sections)
// 		.then(() => {
// 			console.log(map);
// 			g.listDatasets();
// 		});
// 	// console.log(data);
// 	// console.log(map);
// });

// g.addDataset("er2",dats3,InsightDatasetKind.Sections).then((data) => {
// 	console.log(data);
// 	console.log(map);
// });
//
// g.addDataset("er3",dats3,InsightDatasetKind.Sections).then((data) => {
// 	console.log(data);
// 	console.log(map);
// });
