import * as http from "http";
import {Building, GeoResponse, InsightError, Rooms} from "./IInsightFacade";
import JSZip from "jszip";
import {getContentFromArchives} from "../../test/TestUtil";
import {parse} from "parse5";
import {checkValidRoom, getGeoData, initializeDefaultBuilding, initializeDefaultRoom} from "./helperAddDatasetRooms";

export const roomNumberString: string = "views-field views-field-field-room-number";
export const roomCapacityString: string = "views-field views-field-field-room-capacity";
export const roomFurnitureString: string = "views-field views-field-field-room-furniture";
export const roomTypeString: string = "views-field views-field-field-room-type";
export const roomURLString: string = "views-field views-field-nothing";
export const buildingShortNameString: string = "views-field views-field-field-building-code";
export const buildingFullNameString: string = "views-field views-field-title";
export const buildingAddressString: string = "views-field views-field-field-building-address";

export function readRoomsContent(content: any, dataset: JSON[]): Promise<number> {
	return new Promise(function (resolve, reject) {
		let zip = new JSZip();
		// let dataset: any = [];
		let roomsPromises: any[] = [];
		let buildingArray: Building[] = [];
		zip.loadAsync(content, {base64: true})
			.then((unzip: JSZip) => {

				let index = unzip.folder("")?.file("index.htm")?.async("string");
				console.log("wooottt");
				unzip.folder("campus/discover/buildings-and-classrooms/")?.forEach
				(function (relativePath, file) {
					roomsPromises.push(file.async("string"));

				});
				return index;
			})
			.then((index) => {
				let indexJSON = parse(index!);

				traverseIndexFile(indexJSON,buildingArray);
				// check that geolocation errors are taken care of
				// that the 9 building file is correctly disgested

				return populateGeoLocationData(buildingArray);

			})
			.then(() => {
				 	return Promise.all(roomsPromises);
			})
			.then((roomsHTMLArray) => {
				let roomsArrayJSON: any[] = [];

				for (const room of roomsHTMLArray) {
					roomsArrayJSON.push(parse(room));
				}
				for (const roomJSON of roomsArrayJSON) {
					traverseRoomsFile(roomJSON,buildingArray,dataset);
				}
				if (dataset.length === 0){
					return reject(new InsightError(("Zero valid rooms")));
				}
				console.log(dataset.length);
				return resolve(dataset.length);
			})
			.catch(function (err: any) {
				return reject(new InsightError("there is an error in Rooms readContent function???"));
			});
	});
}

function traverseRoomsFile (root: any, buildingArray: Building[], roomsArray: any) {
	// https://www.geeksforgeeks.org/level-order-tree-traversal/
	const queue = [];
	queue.push(root);
	// console.log("push for Room");
	let buildingName: string = "default";
	let tableBody;
	while (queue.length !== 0) {
		/*
		 * The shift() method removes the first element from an array and returns that removed element. This method changes the length of the array.
		 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/shift
		 */
		let tempNode = queue.shift();

		// Finds building Name in Room files
		if (tempNode.nodeName === "div" && tempNode.tagName === "div" &&
			tempNode.attrs.find((item: any) => item.value === "building-info")) {
			// console.log(tempNode.attrs.find((item: any) => item.value === "building-info"));
			let h2Node = findChildNode(tempNode,"h2");
			let spanNode = findChildNode(h2Node,"span");
			let textNode = findChildNode(spanNode,"#text");
			buildingName = textNode.value;
		}

		if (checkIfTable(tempNode) && checkIfClass(tempNode,"views-table cols-5 table")) {
			let table = tempNode;
			tableBody = findTableBody(table);
		}

		if (tempNode && tempNode.childNodes && tempNode.childNodes.length > 0) {
			queue.push(...tempNode.childNodes);
		}
	}
	if (!buildingArray.some((obj) => obj.fullname === buildingName)){
		console.log("name not found");
		return;
	}
	if (buildingName !== "default" && tableBody !== undefined) {
		iterateOverTableRowsForRooms(tableBody,buildingArray,buildingName,roomsArray);
	}
}

function iterateOverTableRowsForRooms (node: any, buildingArray: any, buildingName: string, roomsArray: any) {
	for (const element of node.childNodes) {
		if (checkIfRow(element)) {
			let room: Rooms = initializeDefaultRoom();
			let building = findBuilding(buildingArray,buildingName);
			copyBuildingDataIntoRoom(building,room);
			for (const elementTD of element.childNodes) {
				if (checkIfTD(elementTD)) {
					populateRoom(elementTD,room);
				}
			}
			if (checkValidRoom(room)) {
				roomsArray.push(room);
			}
		}
	}
}

function findBuilding (buildingArray: any, buildingName: any): Building {
	return buildingArray.find((item: any) => item.fullname === buildingName);
}

function copyBuildingDataIntoRoom (building: Building, room: Rooms) {
	room.address = building.address;
	room.fullname = building.fullname;
	room.shortname = building.shortname;
	room.lat = building.lat!;
	room.lon = building.lon!;
}

function makeRoomName (room: Rooms) {
	room.name = room.shortname + "_" + room.number ;
}

function populateRoom (node: any, room: Rooms) {
	if (checkIfClass(node,roomNumberString)){
		let roomNumberElementA = findChildNode(node,"a");
		let roomNumberElementText = findChildNode(roomNumberElementA,"#text");
		let roomNumber = roomNumberElementText.value;
		room.number = roomNumber;
		// console.log(room);
	}
	makeRoomName(room);
	if (checkIfClass(node,roomCapacityString)){
		let roomCapacityElementText = findChildNode(node,"#text");
		let roomCapacity = roomCapacityElementText.value.trim();
		room.seats = roomCapacity;
		// console.log(room);
	}
	if (checkIfClass(node,roomFurnitureString)){
		let roomFurnitureElementText = findChildNode(node,"#text");
		let roomFurniture = roomFurnitureElementText.value.trim();
		room.furniture = roomFurniture;
		// console.log(room);
	}
	if (checkIfClass(node,roomTypeString)){
		let roomTypeElementText = findChildNode(node,"#text");
		let roomType = roomTypeElementText.value.trim();
		room.type = roomType;
		// console.log(room);
	}
	if (checkIfClass(node,roomURLString)){
		let roomURLElementA = findChildNode(node,"a");
		let roomURL = FindValueInAttr(roomURLElementA,"href");
		room.href = roomURL.value;
		// console.log(room);
	}
}

function traverseIndexFile (root: any, buildingArray: Building[]) {
	// https://www.geeksforgeeks.org/level-order-tree-traversal/
	const queue = [];
	queue.push(root);
	console.log("push");
	let tableBody = "default";
	while (queue.length !== 0) {
			/*
			 * The shift() method removes the first element from an array and returns that removed element. This method changes the length of the array.
			 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/shift
			 */
		let tempNode = queue.shift();
		if (checkIfTable(tempNode) && checkIfClass(tempNode,"views-table cols-5 table")) {
			let table = tempNode;
			tableBody = findTableBody(table);
			iterateOverTableRowsForIndexFile(tableBody,buildingArray);
		}
		if (tempNode && tempNode.childNodes && tempNode.childNodes.length > 0) {
			queue.push(...tempNode.childNodes);
		}
	}
	if (tableBody === "default"){
		throw new InsightError("The index.htm contains no table.");
	}
}

function findChildNode (node: any, description: string): any {
	return node.childNodes.find((e: any) => e.nodeName === description);
}

function FindValueInAttr (node: any, givenValue: string): any {
	return node.attrs.find((e: any) => e.name === givenValue);
}

function checkIfTable (node: any) {
	return node.nodeName === "table" && node.tagName === "table";
}

function checkIfRow (node: any) {
	return node.nodeName === "tr" && node.tagName === "tr";
}

function checkIfTD (node: any) {
	return node.nodeName === "td" && node.tagName === "td";
}

// https://stackoverflow.com/questions/8217419/how-to-determine-if-javascript-array-contains-an-object-with-an-
// attribute-that-e
function checkIfClass (node: any, givenValue: string) {
	return node.attrs.some((e: any) => e.name === "class" && e.value === givenValue);
}

function findTableBody (node: any) {
	return node.childNodes.find((e: any) => e.nodeName === "tbody" && e.tagName === "tbody");
}

function iterateOverTableRowsForIndexFile (node: any, buildingArray: any): any {
	for (const element of node.childNodes) {
		if (checkIfRow(element)) {
			let building: Building = initializeDefaultBuilding();
			for (const elementTD of element.childNodes) {
				if (checkIfTD(elementTD)) {
					populateBuildingData(elementTD,building);
				}
			}
			buildingArray.push(building);
		}
	}
}

function populateGeoLocationData (buildingArray: any) {
	return new Promise(function (resolve, reject) {
		let promisesArray: Array<Promise<GeoResponse>> = [];
		for (const building of buildingArray) {
			promisesArray.push(getGeoData(building.address));
		}
		return Promise.all(promisesArray)
			.then((geoDataArray) => {
				buildingArray.forEach(function (value: Building, i: any) {
					// console.log("%d: %s", i, value);
					value.lat = geoDataArray[i].lat;
					value.lon = geoDataArray[i].lon;
				});
				return resolve("done");
			}).catch((error) => {
				return reject("populating geodata didn't work");
			});
	});
}

function populateBuildingData (node: any, building: Building) {
	if (checkIfClass(node,buildingShortNameString)){
	//	https://linuxhint.com/remove-all-non-alphanumeric-characters-in-javascript/
		let buildingCode = findChildNode(node,"#text").value.replace(/\W/g, "");
		building.shortname = buildingCode;
	}
	if (checkIfClass(node,buildingFullNameString)){
		//	https://linuxhint.com/remove-all-non-alphanumeric-characters-in-javascript/
		let buildingTitleNode = findChildNode(node,"a");
		let buildingTitle = findChildNode(buildingTitleNode,"#text").value;
		// console.log(buildingTitle);
		building.fullname = buildingTitle;
	}
	if (checkIfClass(node,buildingAddressString)){
		//	https://linuxhint.com/remove-all-non-alphanumeric-characters-in-javascript/
		let buildingAddress = findChildNode(node,"#text").value.trim();
		building.address = buildingAddress;
	}
}
