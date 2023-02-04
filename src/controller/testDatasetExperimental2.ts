import JSZip from "jszip";
import {getContentFromArchives} from "../../test/TestUtil";
import {InsightDatasetKind, InsightError} from "./IInsightFacade";

let daq = getContentFromArchives("pair.zip");
let dats = getContentFromArchives("pairLight.zip");
let dats2 = getContentFromArchives("textFile.rtf");
let dats3 = getContentFromArchives("Pair3CoursesOnly.zip");
let dats4 = getContentFromArchives("brokenCourses.zip");
let dats5 = getContentFromArchives("noCoursesFolder.zip");

let array: any = [];
let array2: any = [1,2,3];

// SYED: Checks that ID param observes rules for naming and kind is of type "sections".
function checkIdAndKind (id: string, kind: InsightDatasetKind): boolean {
	if (id.includes("_")){
		return false;
	};
	// Removing whitespace reference: https://stackoverflow.com/questions/10800355/remove-whitespaces-inside-a-string-in-javascript
	if (id.replace(/\s+/g, "").length === 0){
		return false;
	};
	if (kind !== "sections"){
		return false;
	};
	return true;
}


function readContent(content: any, dataset: JSON[]) {
	let zip = new JSZip();
// SYED: ref: https://stuk.github.io/jszip/documentation/howto/read_zip.html &
// https://stuk.github.io/jszip/documentation/api_jszip/for_each.html
	zip.loadAsync(content, {base64: true}).then((unzip: JSZip) => {
		// if (unzip === null || unzip === undefined) {
		// 	throw new InsightError("unzip was null?");
		// };
		let hun = unzip.folder(/course/);

		if (hun.length === 0 || hun[0].name !== "courses/"){
			throw new InsightError("No courses folder?");
		}
		unzip.folder("courses")?.forEach(function (relativePath, file) {
			file.async("string").then( (courseFile: string) => {
				let courseFileJSON = JSON.parse(courseFile);
				if (courseFileJSON.result.length > 0){
					for (const element of courseFileJSON.result) {
						if (checkValidSection(element)){
							dataset.push(element);
						}
					}
				};
			});
		});
	}).catch(function (err: any) {
		console.error(`there is an ${err}`);
		throw new InsightError();
	});
}


function checkValidSection (element: JSON): boolean {
	let textArray = Object.keys(element);
	let result: boolean = textArray.includes("id")
		&& textArray.includes("Course")
		&& textArray.includes("Title")
		&& textArray.includes("Professor")
		&& textArray.includes("Subject")
		&& textArray.includes("Year")
		&& textArray.includes("Avg")
		&& textArray.includes("Pass")
		&& textArray.includes("Fail")
		&& textArray.includes("Audit");
	return result;
}


// readContent(dats5);
console.log(array);


// print("yay");
// print(array);
// openZip (content: string): any {
// 	// const fs = require('fs-extra')
// 	let JSZip = require("jszip");
// 	let zip = new JSZip();
// 	// SYED: ref: https://stuk.github.io/jszip/documentation/howto/read_zip.html & https://stuk.github.io/jszip/documentation/api_jszip/for_each.html
// 	zip.loadAsync(content, {base64: true}).
// 	then((r) => r.folder("courses").forEach(function (relativePath, file){
// 		console.log("iterating over", relativePath);
// 	}));


export {readContent, checkIdAndKind, checkValidSection};
