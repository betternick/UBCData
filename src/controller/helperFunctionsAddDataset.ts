import JSZip from "jszip";
import {getContentFromArchives} from "../../test/TestUtil";
import {Dataset, InsightDatasetKind, InsightError} from "./IInsightFacade";
import InsightFacade from "./InsightFacade";


import fs from "fs-extra";


const persistDir = "./data";
const persistFile = "./data/persistFile.json";

// SYED: Checks that ID param observes rules for naming and kind is of type "sections".
function checkIdAndKind(id: string, kind: InsightDatasetKind, map: any): boolean {
	if (map.has(id)) {
		throw new InsightError("ID already exists");
		// return false;
	}

	if (id.includes("_")) {
		throw new InsightError("_ is not allowed");
		// return false;
	}
	// Removing whitespace reference: https://stackoverflow.com/questions/10800355/remove-whitespaces-inside-a-string-in-javascript
	if (id.replace(/\s+/g, "").length === 0) {
		throw new InsightError("ID only has whitespace");
		// return false;
	}
	if (kind !== "sections") {
		throw new InsightError("kind must only be of type sections");
		// return false;
	}
	return true;
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

// let savedDataStructure: {[datasetArray: string]: string[]} = {}; // TypeScript may also ask for the new cast syntax
// let jsonStringWrite = JSON.stringify(savedDataStructure);

function checkFileExistsCreateFile(): Promise<boolean> {
	return new Promise(function (resolve, reject) {

		// ref: https://www.c-sharpcorner.com/article/how-to-check-if-a-file-exists-in-nodejs/
		if (fs.existsSync(persistFile)) {
			console.log("file already exists");
			resolve(true);
		} else {
			// let savedDataStructure: {[datasetArray: string]: string[]} = {
			// 	array: ["a", "b"],
			// }; // TypeScript may also ask for the new cast syntax

			const aPersistFileTemplate = {
				fileArray: [],
			};

			// let jsonStringWrite = JSON.stringify(savedDataStructure);
			fs.writeJson(persistFile, aPersistFileTemplate)
				.then(() => {
					console.log("File didn't exist but successfuly created!");
					resolve(true);
				})
				.catch((err) => {
					console.error(err);
					reject(false);
				});
		}
	});
}


function addToPersistFolder(data: Dataset): Promise<boolean> {

	return new Promise(function (resolve, reject) {

		checkFileExistsCreateFile()
			.then(() => {
				fs.readJson(persistFile)
					.then((jsonObj) => {
						//	ref: https://stackoverflow.com/questions/36093042/how-do-i-add-to-an-existing-json-file-
						//	in-node-js
						jsonObj.fileArray.push(data);
						console.log(jsonObj); // => 0.1.3
						fs.writeJson(persistFile, jsonObj).then(() => {
							resolve(true);
						});
					});
			})
			.catch((err) => {
				console.error(err);
				reject(false);
			});
	});
}


export {readContent, checkIdAndKind, checkValidSection, checkFileExistsCreateFile, addToPersistFolder};


// let myDataset: Dataset = {
// 	id: "sampleID",
// 	kind: InsightDatasetKind.Sections,
// 	numRows: 1,
// 	datasetArray: [],
// };


// let sections = getContentFromArchives("Pair3CoursesOnly.zip");
// let facade = new InsightFacade();
// facade.addDataset("fgh",sections,InsightDatasetKind.Sections).then(() =>{
// 	console.log(InsightFacade.map.entries());
// }
// );

// saveToFolder(myDataset);
