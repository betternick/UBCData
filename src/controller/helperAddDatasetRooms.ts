import * as http from "http";
import {InsightError} from "./IInsightFacade";
import JSZip from "jszip";

// Encodes building address (string) for use in a URL request
export function encodeAddress (address: string) {
	return encodeURIComponent(address);
}

// Takes in building address and returns its lat and lon coordinates.
export function getGeoData (address: string) {

	return new Promise(function (resolve, reject) {
		let encodedAddress: string = encodeAddress(address);
		// The following function is copied from HTTP API
		// Reference: https://nodejs.org/api/http.html#httpgeturl-options-callback
		let getURL = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team043/" + encodedAddress;
		http.get(getURL, (res) => {
			const {statusCode} = res;
			const contentType = res.headers["content-type"];

			let error;
			// Any 2xx status code signals a successful response but
			// here we're only checking for 200.
			// if (statusCode !== 200) {
			if (statusCode === undefined || statusCode < 200 || statusCode > 299) {
				error = new Error("Request Failed.\n" +
					`Status Code: ${statusCode}`);
				// return reject(error);
			} else if (!/^application\/json/.test(contentType as string)) {
				error = new Error("Invalid content-type.\n" +
					`Expected application/json but received ${contentType}`);
				// return reject(error);
			}
			if (error) {
				// console.error(error.message);
				// Consume response data to free up memory
				res.resume();
				// This catches both if there is an internet error or the address is wrong.
				return reject(error);
				// return;
			}

			res.setEncoding("utf8");
			let rawData = "";
			res.on("data", (chunk) => {
				rawData += chunk;
			});
			res.on("end", () => {
				try {
					const parsedData = JSON.parse(rawData);
					return resolve(parsedData);
				} catch (e) {
					console.error(e);
					return reject(e);
				}
			});
		}).on("error", (e) => {
			console.error(`Got error: ${e.message}`);
			throw new InsightError("Internet connection not working maybe?");
			return reject(e);
		});
	});
}


// function readRoomsContent(content: any, dataset: JSON[]): Promise<number> {
// 	return new Promise(function (resolve, reject) {
// 		let zip = new JSZip();
// 		let promisesArray: any = [];
// 		let coursesArray: any = [];
// 		// SYED: ref: https://stuk.github.io/jszip/documentation/howto/read_zip.html &
// 		// https://stuk.github.io/jszip/documentation/api_jszip/for_each.html
// 		zip.loadAsync(content, {base64: true})
// 			.then((unzip: JSZip) => {
// 				// let foldRead: any;
// 				// try {
// 				// 	// foldRead = unzip.folder(/courses/);
// 				// } catch (e) {
// 				// 	return reject(new InsightError("No courses folder?123"));
// 				// }
// 				// //
// 				// if (foldRead.length === 0 || foldRead[0].name !== "courses/") {
// 				// 	return reject(new InsightError("No courses folder?456"));
// 				// }
// 				unzip.folder("courses")?.forEach(function (relativePath, file) {
// 					promisesArray.push(file.async("string"));
// 				});
// 			})
// 			.then(() => {
// 				return Promise.all(promisesArray);
// 			})
// 			.then((dataArray) => {
// 				for (const element of dataArray) {
// 					let courseFileJSON = JSON.parse(element);
// 					if (courseFileJSON.result.length > 0) {
// 						coursesArray.push(courseFileJSON);
// 					}
// 				};
// 				for (const course of coursesArray) {
// 					course.result.forEach((section: any) => {
// 						if (checkValidSection(section)){
// 							dataset.push(section);
// 						}
// 						// dataset.push(section));
// 					});
// 				}
// 				// for (let i = 0; i < dataset.length; i++){
// 				// 	if (!checkValidSection(dataset[i])) {
// 				// 		dataset.splice(i, 1);
// 				// 	}
// 				// }
// 				if (dataset.length === 0) {
// 					return reject(new InsightError("No valid sections to add?"));
// 				} else {
// 					return resolve(dataset.length);
// 				}
// 			})
// 			.catch(function (err: any) {
// 				return reject(new InsightError("there is an error in readContent function???"));
// 			});
// 	});
// }


let addy = "35 surrey St, Vancouver V6S";
let addy2 = "6245 Agronomy Road V6T 1Z4x";
// let res = getGeoData(addy2).then((u) => {
// 	console.log(u);
// });

let res = getGeoData(addy2).then((u) => {
	console.log(u);
}).catch((y) => {
	console.log(y);
});

