import {Dataset, InsightError, InsightResult, ResultTooLargeError} from "../controller/IInsightFacade";
import {
	returnIdentifier, getValue, transformQueryToDatasetConvention, transformDatasetToQueryConvention,
	singleDatasetID, wildcardMatcher
} from "./helperFunctionsQueryContainer";

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

	// Applies the filters in the query to the given section and returns
	// true if the section matches all filters, false otherwise
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
						if (!tempResult) {
							tempResult = this.applyFilters(nextItem, datasetID, section);
						}
					}
					result = tempResult;
				} else if (queryKey === "AND") {
					let firstItem = query[queryKey][0];
					let tempResult: boolean = this.applyFilters(firstItem, datasetID, section);
					for (let item = 1; item < query[queryKey].length; item++) {
						let nextItem = query[queryKey][item];
						if (tempResult) {
							tempResult = this.applyFilters(nextItem, datasetID, section);
						}
					}
					result = tempResult;
				} else if (queryKey === "NOT") {
					return !this.applyFilters(query[queryKey], datasetID, section);
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

	// checks if the given section matches the values from the query for the
	// given comparator. Returns true if it matches, false otherwise
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
			if (value.includes("*")) {
				return wildcardMatcher(valOfSection, value);
			} else {
				return valOfSection === value;
			}
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


