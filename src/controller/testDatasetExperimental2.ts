import JSZip from "jszip";
import {getContentFromArchives} from "../../test/TestUtil";
import {InsightError} from "./IInsightFacade";


import fs from "fs-extra";

let daq = getContentFromArchives("pair.zip");
let dats = getContentFromArchives("pairLight.zip");
let dats2 = getContentFromArchives("textFile.rtf");
let dats3 = getContentFromArchives("Pair3CoursesOnly.zip");
let dats4 = getContentFromArchives("brokenCourses.zip");
let dats5 = getContentFromArchives("noCoursesFolder.zip");

let array: any = [];
let array2: any = [1,2,3];


function isValidSection (file: any) {
	return true;
}

function readContent(content: any) {
	// let JSZip = require("jszip");
	let zip = new JSZip();
// SYED: ref: https://stuk.github.io/jszip/documentation/howto/read_zip.html &
// https://stuk.github.io/jszip/documentation/api_jszip/for_each.html
	zip.loadAsync(content, {base64: true}).then((unzip: JSZip) => {

		// if (unzip === null || unzip === undefined) {
		// 	throw new InsightError("unzip was null?");
		// };

		let hun = unzip.folder(/course/);
		// console.log("hey");
		// console.log(hun);
		// console.log(hun[0].name);

		if (hun.length === 0 || hun[0].name !== "courses/"){
			throw new InsightError("No courses folder?");
		}


		unzip.folder("courses")?.forEach(function (relativePath, file) {
			file.async("string").then( (courseFile: string) => {
				let courseFileJSON = JSON.parse(courseFile);
				if (courseFileJSON.result.length > 0){
					for (const element of courseFileJSON.result) {
						if (checkValidSection(element)){
							array.push(element);
						}
						// console.log(element);
					}
					console.log(array);
				};
				// console.log(courseFileJSON);


			});
		});
	}).catch(function (err: any) {
		console.error(`there is an ${err}`);
		throw new InsightError();
	});
}


// const packageObj = fs.readJsonSync(file);
// console.log(packageObj.version);

// https://stackoverflow.com/questions/17713485/how-to-test-if-the-uploaded-file-is-a-json-file-in-node-js
// function validateJSON(body: any) {
// 	try {
// 		let data = JSON.parse(body);
// 		// if came to here, then valid
// 		return data;
// 	} catch(e) {
// 		// failed to parse
// 		return null;
// 	}
// }


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


readContent(dats5);
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
