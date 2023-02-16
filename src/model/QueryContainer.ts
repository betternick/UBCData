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

	public handleWhere (query: any, datasetID: string, dataset: Dataset): InsightResult[] {
		let resultArray: InsightResult[] = [];
		let sections = dataset.datasetArray;
		for (let sec in sections) {
			let mySection = sections[sec];
			if (this.applyFilters(query, datasetID, dataset.datasetArray[sec])) {
				// add this section to result, based on columns
				let myInsightResult: InsightResult = {};
				for (let col in this.columns) {
					let keyCol = datasetID.concat("_", transformDatasetToQueryConvention(this.columns[col]));
					let valOfSection = getValue(mySection, this.columns[col]);

					let keyVal: string | number = "";
					if (keyCol === datasetID + "_year") {
						// need to check if sections = overall, if yes, year = 1900
						let secField = getValue(mySection, "Section");
						if (secField === "overall") {
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
				resultArray.push(myInsightResult);
				if (resultArray.length > 5000) {
					throw new ResultTooLargeError("Exceeded over 5000 results");
				}
			}
		}
		return resultArray;
	}

	// handles the WHERE block in a query
	// throws InsightError("multiple datasets referenced") if any dataset ID's in WHERE block don't match
	// otherwise, returns the InsightResult[] that corresponds to the query
	public applyFilters(query: any, datasetID: string, section: any): boolean {
		let result: boolean = false;
		if (JSON.stringify(query) !== "{}") {  // WHERE block is not empty
			// recursively traverse JSON query object:
			// ref: https://blog.boot.dev/javascript/how-to-recursively-traverse-objects/
			for (let queryKey in query) {
				if (queryKey === "OR") {
					let firstItem = query[queryKey][0];
					let tempResult: boolean = this.applyFilters(firstItem, datasetID, section);
					for (let item = 1; item < query[queryKey].length; item++) {
						let nextItem = query[queryKey][item];
						if (tempResult === false) {
							tempResult = this.applyFilters(nextItem, datasetID, section);
						}
					}
					result = tempResult;
				} else if (queryKey === "AND") {
					let firstItem = query[queryKey][0];
					let tempResult: boolean = this.applyFilters(firstItem, datasetID, section);
					for (let item = 1; item < query[queryKey].length; item++) {
						let nextItem = query[queryKey][item];
						if (tempResult === true) {
							tempResult = this.applyFilters(nextItem, datasetID, section);
						}
					}
					result = tempResult;
				} else if (queryKey === "NOT") {
					let tempResult = this.applyFilters(query[queryKey], datasetID, section);
					if (tempResult === true) {
						result = false;
					} else {
						result = true;
					}
				} else {
					let key = Object.keys(query[queryKey])[0]; 						// something like: sections_avg
					let value = Object.values(query[queryKey])[0];   				// something like: 40
					let identifier = transformQueryToDatasetConvention(returnIdentifier(key));	// something like: Avg
					result = this.doesThisSectionMatch(section, identifier, value, queryKey);
				}
			}
			return result;
		} else {
			// empty where block -> return all sections
			return true;
		}
	}

	// private applyComparator(datasetID: string, query: JSON, section: JSON, comparator: string) {
	//
	// 	let key = Object.keys(query)[0];   				    // something like: sections_avg
	// 	let value = Object.values(query)[0];   				// something like: 40
	// 	let identifier = transformQueryToDatasetConvention(returnIdentifier(key));	// something like: Avg
	//
	// 	let match = this.doesThisSectionMatch(section, identifier, value, comparator);
	// 	if (match) {
	// 		let myInsightResult: InsightResult = {};
	// 		for (let col in this.columns) {
	// 			let keyCol = datasetID.concat("_", transformDatasetToQueryConvention(this.columns[col]));
	// 			let valOfSection = getValue(section, this.columns[col]);
	//
	// 			let keyVal: string | number = "";
	// 			if (keyCol === datasetID + "_year") {
	// 				// need to check if sections = overall, if yes, year = 1900
	// 				let sec = getValue(section, "Section");
	// 				if (sec === "overall") {
	// 					keyVal = 1900;
	// 				} else {
	// 					keyVal = Number(valOfSection); 	// need to year to number
	// 				}
	// 			} else if (keyCol === datasetID + "_uuid") {
	// 				keyVal = valOfSection.toString();	// need to convert uuid to string
	// 			} else {
	// 				keyVal = valOfSection;
	// 			}
	// 			myInsightResult[keyCol] = keyVal;
	// 		}
	//
	// 		// adding uuid to each InsightResult:
	// 		if (!this.columns.includes("id")){
	// 			myInsightResult[datasetID.concat("_", transformDatasetToQueryConvention("id"))] =
	// 				getValue(section, "id");
	// 		}
	// 		resultArray.push(myInsightResult);
	// 	}
	// }

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

	public doesThisSectionMatch(section: any, identifier: string, value: any, comparator: string): boolean {
		let valOfSection = section[identifier];
		if (identifier === "id") {
			valOfSection = valOfSection.toString();
		}
		if (identifier === "Year") {
			if (section["Section"] === "overall") {
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
	public handleOptions(query: any, datasetID: string) {
		// if there is an ORDER section, extract the order
		if (Object.prototype.hasOwnProperty.call(query, "ORDER")) {
			this.order = query.ORDER;
		}
		// creates a object that contains only the columns
		let columnsJSON = query.COLUMNS;

		// extracts all the column identifiers and puts them into the columns array
		for (let col in columnsJSON) {
			this.columns.push(returnIdentifier(columnsJSON[col]));
		}
		this.columns.sort(); // sort columns alphabetically
		for (let col in this.columns) {
			this.columns[col] = transformQueryToDatasetConvention(this.columns[col]);
		}
	}

}


