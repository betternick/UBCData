import {Building, InsightError, Rooms} from "./IInsightFacade";
import http from "http";


export function initializeDefaultRoom(): Rooms {
	let room: Rooms = {
		fullname : "ImpossibleWord@$%#123",
		shortname : "ImpossibleWord@$%#123",
		number : "ImpossibleWord@$%#123",
		name : "ImpossibleWord@$%#123",
		address : "ImpossibleWord@$%#123",
		lat : 1000000,
		lon : 1000000,
		seats : 1000000,
		type : "ImpossibleWord@$%#123",
		furniture : "ImpossibleWord@$%#123",
		href : "ImpossibleWord@$%#123",
	};
	return room;
}

export function initializeDefaultBuilding(): Building {
	let building: Building = {
		fullname : "ImpossibleWord@$%#123",
		shortname : "ImpossibleWord@$%#123",
		address : "ImpossibleWord@$%#123",
		lat : 1000000,
		lon : 1000000
	};
	return building;
}

export function checkValidRoom(room: Rooms): boolean {
	let result: boolean =
		room.fullname !== "ImpossibleWord@$%#123" &&
		room.shortname !== "ImpossibleWord@$%#123" &&
		room.number !== "ImpossibleWord@$%#123" &&
		room.name !== "ImpossibleWord@$%#123" &&
		room.address !== "ImpossibleWord@$%#123" &&
		room.lat !== 1000000 &&
		room.lon !== 1000000 &&
		typeof (room.lat) !== "string" &&
		typeof (room.lon) !== "string" &&
		typeof (room.lat) !== "undefined" &&
		typeof (room.lon) !== "undefined" &&
		room.seats !== 1000000 &&
		room.type !== "ImpossibleWord@$%#123" &&
		room.furniture !== "ImpossibleWord@$%#123" &&
		room.href !== "ImpossibleWord@$%#123";
	return result;
}


// Encodes building address (string) for use in a URL request
export function encodeAddress (address: string) {
	return encodeURIComponent(address);
}

// Takes in building address and returns its lat and lon coordinates.
export function getGeoData (address: string): any {
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
