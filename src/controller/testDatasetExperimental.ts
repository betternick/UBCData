import JSZip from "jszip";
import {getContentFromArchives} from "../../test/TestUtil";
import {InsightError} from "./IInsightFacade";


import fs from "fs-extra";


let dats = getContentFromArchives("pairLight.zip");
let dats2 = getContentFromArchives("textFile.rtf");

let array: any = [];
let array2: any = [1,2,3];


function isValidSection (file: any) {
	return true;
}

function readContent(content: any) {
	// let JSZip = require("jszip");
	let zip = new JSZip();
// SYED: ref: https://stuk.github.io/jszip/documentation/howto/read_zip.html & https://stuk.github.io/jszip/documentation/api_jszip/for_each.html
	zip.loadAsync(content, {base64: true}).then((unzip) => {
		// let obj = Object.keys(unzip.files);
		// console.log(obj);
		if (unzip == null){
			throw new InsightError("nothing in folder");
		}


		// unzip.folder("courses").forEach(function (relativePath, file) {
		// 	array.push(file.async("string"));
		// });


	}).then(() =>{
		// console.log(array);
		Promise.all(array).then((values)=>{
			console.log(values[3]);

			let data = JSON.parse(values[3]);
			console.log(data.result);


		});

	})
		.catch(function (err: any) {
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


function convertToJSON(something: any) {


	something.forEach((a: string) =>
		fs.readJson(a)
			.then((packageObj) => {
				console.log(packageObj); // => 0.1.3
			})
			.catch((err) => {
				console.error(err);
			}));
}


function print(something: any) {

	console.log(something);

				// convertToJSON(a);
};


readContent(dats);

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
