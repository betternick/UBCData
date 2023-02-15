import {Dataset, InsightError, InsightResult, ResultTooLargeError} from "../controller/IInsightFacade";
import {returnIdentifier, getValue, transformQueryToDatasetConvention, transformDatasetToQueryConvention,
	singleDatasetID} from "./helperFunctionsQueryContainer";

export class QueryContainer {
	public columns: string[];
	public order: string;

	constructor() {
		this.columns = [];
		this.order = "";
	}

	// handles the WHERE block in a query
	// throws InsightError("multiple datasets referenced") if any dataset ID's in WHERE block don't match
	// otherwise, returns the InsightResult[] that corresponds to the query
	public handleWhere(query: JSON, datasetID: string, dataset: Dataset): InsightResult[] {
		let resultArray: InsightResult[] = [];
		if (JSON.stringify(query) !== "{}") {  // WHERE block is not empty
			let queryJSON = JSON.parse(JSON.stringify(query));
			// recursively traverse JSON query object:
			// ref: https://blog.boot.dev/javascript/how-to-recursively-traverse-objects/
			for (let queryKey in query) {
				if (queryKey === "OR") {
					// for (let item in Object.values(query)[0]) {
					// 	let nextItem = Object.values(query)[0][item];
					// 	resultArray = resultArray.concat(this.handleWhere(nextItem, datasetID, dataset));
					// }
					// // filtering duplicate objects out of array: ref: https://stackoverflow.com/questions/2218999/
					// // how-to-remove-all-duplicates-from-an-array-of-objects
					// resultArray = resultArray.filter((value, index) => {
					// 	const myValue = JSON.stringify(value);
					// 	return index === resultArray.findIndex((obj) => {
					// 		return JSON.stringify(obj) === myValue;
					// 	});
					// });
				} else if (queryKey === "AND") {
					let temp: InsightResult[] = [];
					let firstItem = queryJSON[queryKey][0];
					let arr = this.handleWhere(firstItem, datasetID, dataset);
					let uuid = datasetID + "_" + "uuid";
					for (let item = 1; item < queryJSON[queryKey].length; item++) {
						let nextItem = queryJSON[queryKey][item];
						temp = this.handleWhere(nextItem, datasetID, dataset);
						// filtering one array by another array of objects by property: ref: https://urlis.net/fg8h2mqb
						console.time();
						arr = arr.filter((elem) => {
							return temp.some((ele) => {
								return ele[uuid] === elem[uuid];
							});
						});
						console.timeEnd();
					}
					resultArray = resultArray.concat(arr);
				} else if (queryKey === "NOT") {
					// console.log("got to NOT"); TODO: recurse, but keeping in mind the not structure
				} else {
					for (let courseSection in dataset.datasetArray) {
						let section = dataset.datasetArray[courseSection];
						this.applyComparator(datasetID, queryJSON[queryKey], section, resultArray, queryKey);
					}
				}
			}
		} else {
			// empty where block -> return all sections
		}
		return resultArray;
	}

	private applyComparator(
		datasetID: string,
		query: JSON,
		section: JSON,
		resultArray: InsightResult[],
		comparator: string
	) {
		singleDatasetID("", datasetID); // check that multiple datasets aren't referenced
		// query = { sections_avg: 40}
		let key = Object.keys(query)[0];   				    // something like: sections_avg
		let value = Object.values(query)[0];   				// something like: 40
		let identifier = transformQueryToDatasetConvention(returnIdentifier(key));	// something like: Avg

		let match = this.doesThisSectionMatch(section, identifier, value, comparator);
		if (match) {
			let myInsightResult: InsightResult = {};
			for (let col in this.columns) {
				let keyCol = datasetID.concat("_", transformDatasetToQueryConvention(this.columns[col]));
				let valOfSection = getValue(section, this.columns[col]);

				let keyVal: string | number = "";
				if (keyCol === datasetID + "_year") {
					// need to check if sections = overall, if yes, year = 1900
					let sec = getValue(section, "Section");
					if (sec === "overall") {
						keyVal = 1900;
					} else {
						keyVal = Number(valOfSection); 	// need to year to number
					}
				} else if (keyCol === datasetID + "_uuid") {
					keyVal = valOfSection.toString();	// need to convert uuid to string
				} else {
					keyVal = valOfSection;
				}
				myInsightResult[keyCol] = keyVal;
			}

			// adding uuid to each InsightResult:
			if (!this.columns.includes("id")){
				myInsightResult[datasetID.concat("_", transformDatasetToQueryConvention("id"))] =
					getValue(section, "id");
			}
			resultArray.push(myInsightResult);
		}
	}

	// sorts the array based on this.order
	public handleSort (array: InsightResult[]): InsightResult[] {
		// sorting array of arrays by string property value, dynamically: ref: https://stackoverflow.com/questions/
		// 1129216/sort-array-of-objects-by-string-property-value
		function dynamicSort(property: string) {
			let sortOrder = 1;
			return function (a: InsightResult, b: InsightResult) {
				let result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
				return result * sortOrder;
			};
		}
		return array.sort(dynamicSort(this.order));
	}

	public doesThisSectionMatch(section: JSON, identifier: string, value: string | number,
		comparator: string): boolean {
		let sectionJSON = JSON.parse(JSON.stringify(section));
		let valOfSection = sectionJSON[identifier];
		if (identifier === "id") {
			valOfSection = valOfSection.toString();
		}
		if (identifier === "Year") {
			if (sectionJSON["Section"] === "overall") {
				valOfSection = 1900;
			} else {
				valOfSection = Number(valOfSection);
			}
		}
		if (comparator === "EQ") {
			return valOfSection === value;
		} else if (comparator === "GT") {
			return valOfSection > value;
		} else if (comparator === "LT") {
			return valOfSection < value;
		} else { // comparator === "IS"
			return valOfSection === value;
		}
	}

	// handles the OPTIONS block in a query
	// throws InsightError("multiple datasets referenced") if any dataset ID's
	// found in the OPTIONS block do not match the datasetID parameter
	public handleOptions(query: JSON, datasetID: string) {
		let queryJSON = JSON.parse(JSON.stringify(query));
		// if there is an ORDER section, extract the order
		if (Object.prototype.hasOwnProperty.call(query, "ORDER")) {
			this.order = queryJSON.ORDER;
		}
		// creates a object that contains only the columns
		let columnsJSON = queryJSON.COLUMNS;

		// extracts all the column identifiers and puts them into the columns array
		for (let col in columnsJSON) {
			this.columns.push(returnIdentifier(columnsJSON[col]));
		}
		this.columns.sort(); // sort columns alphabetically
		for (let col in this.columns) {
			this.columns[col] = transformQueryToDatasetConvention(this.columns[col]);
		}
	}

	public filterUUID(results: InsightResult[], datasetID: string): InsightResult[] {
		for (let res in results) {
			delete results[res][datasetID.concat("_", transformDatasetToQueryConvention("id"))];
		}
		return results;
	}
}


