import JSZip from "jszip";
import {getContentFromArchives} from "../../test/TestUtil";
import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import InsightFacade from "./InsightFacade";

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

export {readContent, checkIdAndKind, checkValidSection};
