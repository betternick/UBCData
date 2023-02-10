import JSZip from "jszip";
import {getContentFromArchives} from "../../test/TestUtil";
import {Dataset, InsightDatasetKind, InsightError} from "./IInsightFacade";
import InsightFacade from "./InsightFacade";

import fs from "fs-extra";

const persistDir = "./data";
const persistFile = "./data/persistFile.json";

// SYED: Checks that ID param observes rules for naming and kind is of type "sections".
function checkIdAndKind(id: string, kind: InsightDatasetKind, map: any): Promise<any> {
	return new Promise(function (resolve, reject) {
		if (map.has(id)) {
			reject(new InsightError("ID already exists"));
			// return false;
		}

		if (id.includes("_")) {
			reject(new InsightError("_ is not allowed"));
			// return false;
		}
		// Removing whitespace reference: https://stackoverflow.com/questions/10800355/remove-whitespaces-inside-a-string-in-javascript
		if (id.replace(/\s+/g, "").length === 0) {
			reject(new InsightError("ID only has whitespace"));
			// return false;
		}
		if (kind !== InsightDatasetKind.Sections) {
			reject(new InsightError("kind must only be of type sections"));
			// return false;
		}
		resolve(true);
	});
}

function readContent(content: any, dataset: JSON[]): Promise<number> {
	return new Promise(function (resolve, reject) {
		let zip = new JSZip();
		let promisesArray: any = [];
		// SYED: ref: https://stuk.github.io/jszip/documentation/howto/read_zip.html &
		// https://stuk.github.io/jszip/documentation/api_jszip/for_each.html
		zip.loadAsync(content, {base64: true})
			.then((unzip: JSZip) => {
				let foldRead: any;
				try {
					foldRead = unzip.folder(/course/);
				} catch (e) {
					reject(new InsightError("No courses folder?"));
				}

				if (foldRead.length === 0 || foldRead[0].name !== "courses/") {
					reject(new InsightError("No courses folder?"));
				}
				unzip.folder("courses")?.forEach(function (relativePath, file) {
					promisesArray.push(file.async("string"));
				});
			})
			.then(() => {
				Promise.all(promisesArray).then((dataArray) => {
					for (const element of dataArray) {
						let courseFileJSON = JSON.parse(element);
						if (courseFileJSON.result.length > 0) {
							for (const sectionElement of courseFileJSON.result) {
								if (checkValidSection(sectionElement)) {
									dataset.push(sectionElement);
								}
							}
						}
					}
					if (dataset.length === 0) {
						throw new InsightError("No valid sections to add?");
					} else {
						resolve(dataset.length);
					}
				});
			})

			.catch(function (err: any) {
				reject(new InsightError("there is an error in readContent function???"));
			});
	});
}

function checkValidSection(element: JSON): boolean {
	let textArray = Object.keys(element);
	let result: boolean =
		textArray.includes("id") &&
		textArray.includes("Course") &&
		textArray.includes("Title") &&
		textArray.includes("Professor") &&
		textArray.includes("Subject") &&
		textArray.includes("Year") &&
		textArray.includes("Avg") &&
		textArray.includes("Pass") &&
		textArray.includes("Fail") &&
		textArray.includes("Audit");
	return result;
}

// Changed checkFile function to be synchronous
function checkFileExistsElseCreateFile(): Promise<boolean> {
	return new Promise(function (resolve, reject) {
		// ref: https://www.c-sharpcorner.com/article/how-to-check-if-a-file-exists-in-nodejs/
		if (fs.existsSync(persistFile)) {
			console.log("file already exists");
			resolve(true);
		} else {
			const aPersistFileTemplate = {
				fileArray: [],
			};
			fs.outputJsonSync(persistFile, aPersistFileTemplate);
			console.log("File didn't exist but successfuly created!");
			resolve(true);
		}
		reject("checkFileExists promise rejectedd");
	});
}

// function checkFileExistsCreateFile(): Promise<boolean> {
// 	return new Promise(function (resolve, reject) {
// 		// ref: https://www.c-sharpcorner.com/article/how-to-check-if-a-file-exists-in-nodejs/
// 		if (fs.existsSync(persistFile)) {
// 			console.log("file already exists");
// 			resolve(true);
// 		} else {
// 			const aPersistFileTemplate = {
// 				fileArray: [],
// 			};
// 			fs.outputJson(persistFile, aPersistFileTemplate)
// 				.then(() => {
// 					console.log("File didn't exist but successfuly created!");
// 					resolve(true);
// 				})
// 				.catch((err) => {
// 					console.error(err);
// 					reject(false);
// 				});
// 		}
// 	});
// }

// This is an Asynchronous function
function addToPersistFolder(data: Dataset, keys: string[]): Promise<any> {
	return new Promise(function (resolve, reject) {
		checkFileExistsElseCreateFile()
			.then(() => {
				return fs.readJson(persistFile);
			})
			// .then()
			// fs.readJson(persistFile)
			.then((jsonObj) => {
				//	ref: https://stackoverflow.com/questions/36093042/how-do-i-add-to-an-existing-json-file-
				//	in-node-js
				// Note to self: trash code. made it as an extra check to ensure ID doesn't already exist. The following
				// caused the second dataset test to fail in weird ways when run as a suite. I don't know why. Error
				// happened to go away when I implemented sync checkFileExistsElseCreateFile. code doesn't run right
				// anyway. Leaving it here as an example of local test failure for debugging in case a similar issue
				// crops up on autotest.
				// if (jsonObj.fileArray.size > 0) {
				// 	console.log(jsonObj.fileArray.size);
				// 	console.log("whaaat");
				// 	for (const element of jsonObj.fileArray) {
				// 		if (element.id === data.id) {
				// 			console.log("yooooo");
				// 			throw new InsightError("Tried to write dataset to file that already exists");
				// 		}
				// 	}
				// }
				jsonObj.fileArray.push(data);
				console.log(jsonObj);
				console.log("Testing addTopersistfolder func");
				return fs.writeJson(persistFile, jsonObj);
			})
			.then(() => {
				resolve(keys);
			})
			// .catch((err) => {
			// 	throw new InsightError(err + "could not write data back to JSON disk file");
			// });

			.catch((err) => {
				reject(new InsightError(err + "could not read json file from disk"));
			});
		// })
		// .catch((err) => {
		// 	console.error(err);
		// 	reject(new InsightError(err + "read/write from persistence folder failed"));
		// });
	});
}

// This is a synchronous function
function loadDatasetFromPersistence(map: Map<string, Dataset>): Promise<boolean> {
	return new Promise(function (resolve, reject) {
		if (fs.existsSync(persistFile)) {
			console.log("Upon new facade: file does exist");
			const jsonObj = fs.readJsonSync(persistFile);

			for (const element of jsonObj.fileArray) {
				map.set(element.id, element);
			}
			resolve(true);
		} else {
			console.log("Upon new facade: no file existed");
			resolve(false);
		}
		reject("loadDatasetfrompersistence file exists didn't work");
	});
}

// This is a synchronous function
function deleteDatasetFromPersistence(id: string): boolean {
	if (!fs.existsSync(persistFile)) {
		return false;
	}
	try {
		const jsonObj = fs.readJsonSync(persistFile);
		let indexOfElement: number = -1;
		for (const element of jsonObj.fileArray) {
			if (element.id === id) {
				indexOfElement = jsonObj.fileArray.indexOf(element);
				break;
			}
		}
		if (indexOfElement !== -1) {
			jsonObj.fileArray.splice(indexOfElement, 1);
			fs.writeJSONSync(persistFile, jsonObj);
			return true;
		}
		return false;
	} catch (err) {
		throw new InsightError("Could not sync-read data file for delete");
	}
}

export {
	readContent,
	checkIdAndKind,
	checkValidSection,
	checkFileExistsElseCreateFile,
	addToPersistFolder,
	loadDatasetFromPersistence,
	deleteDatasetFromPersistence,
};

// let myDataset: Dataset = {
// 	id: "sampleID",
// 	kind: InsightDatasetKind.Sections,
// 	numRows: 1,
// 	datasetArray: [],
// };
//
// addToPersistFolder(myDataset);
// let sections = getContentFromArchives("Pair3CoursesOnly.zip");
// let facade = new InsightFacade();
// facade.addDataset("fgh",sections,InsightDatasetKind.Sections).then(() =>{
// 	console.log(InsightFacade.map.entries());
// }
// );

// saveToFolder(myDataset);
