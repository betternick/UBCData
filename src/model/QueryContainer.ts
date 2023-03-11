import {Dataset,  InsightResult, ResultTooLargeError} from "../controller/IInsightFacade";
import {
	returnIdentifier, getValue, transformQueryToDatasetConvention, transformDatasetToQueryConvention, wildcardMatcher
} from "./helperFunctionsQueryContainer";

export class QueryContainer {
	public columns: string[];			// columns to be added to the InsightResult
	public group: string[];
	public applyRules: JSON[];
	public fieldsToExtract: string[];	// keys needed, either for grouping or applying rules
	public order: string[];
	public dir: number;

	constructor() {
		this.columns = [];
		this.group = [];
		this.applyRules = [];
		this.fieldsToExtract = [];
		this.order = [];
		this.dir = 1;		// UP = ascending = 1      DOWN = descending = -1
	}

	public handleWhere (query: any, datasetID: string, dataset: Dataset): InsightResult[] {
		let resultArray: InsightResult[] = [];
		let tempArray: InsightResult[] = [];
		let sections = dataset.datasetArray;
		for (let sec in sections) {
			let mySection = sections[sec];
			if (this.applyFilters(query, datasetID, dataset.datasetArray[sec])) {
				if (this.group.length === 0) {
					let myInsightResult = this.createInsightResult(datasetID, mySection, this.columns);
					resultArray.push(myInsightResult);
				} else {
					// do something
				}
			}
		}
		return resultArray;
	}

	private createInsightResult(datasetID: string, mySection: JSON, fieldsArray: string[]): InsightResult {
		// add this section to result, based on columns - IF THERE ARE NO Transformations
		let myInsightResult: InsightResult = {};
		for (let col in fieldsArray) {
			let keyCol = datasetID.concat("_", transformDatasetToQueryConvention(fieldsArray[col]));
			let valOfSection = getValue(mySection, fieldsArray[col]);

			let keyVal: string | number = "";
			if (keyCol === datasetID + "_year") {
				// need to check if sections = overall, if yes, year = 1900
				let secField = getValue(mySection, "Section");
				if (secField === "overall") {
					keyVal = 1900;
				} else {
					keyVal = Number(valOfSection); 	// need to convert year to number
				}
			} else if (keyCol === datasetID + "_uuid") {
				keyVal = valOfSection.toString();	// need to convert uuid to string
			} else if (keyCol === datasetID + "_seats") {
				keyVal = Number(valOfSection);		// need to convert seats to number
			} else {
				keyVal = valOfSection;
			}
			myInsightResult[keyCol] = keyVal;
		}
		return myInsightResult;
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
		if (identifier === "seats") {
			valOfSection = Number(valOfSection);
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

	public handleOptions(query: any) {
		// if there is an ORDER section, extract the order
		if (Object.prototype.hasOwnProperty.call(query, "ORDER")) {
			if (typeof query.ORDER === "string") {
				this.order.push(query.ORDER);
			} else {
				this.order = query.ORDER.keys;
				this.dir = (query.ORDER.dir === "UP") ? 1 : -1;
			}
		}
		// creates an object that contains only the columns
		let columnsJSON = query.COLUMNS;

		// extracts all the column identifiers and puts them into the columns array
		for (let col in columnsJSON) {
			this.columns.push(returnIdentifier(columnsJSON[col]));
		}

		for (let col in this.columns) {
			this.columns[col] = transformQueryToDatasetConvention(this.columns[col]);
		}
	}

	public handleTransformations(query: any) {
		// if the query does not have a transformation block, simply return
		if (query === undefined) {
			return;
		}

		// extracts all the group identifiers and puts them into the group array
		let groupJSON = query.GROUP;
		for (let col in groupJSON) {
			this.group.push(returnIdentifier(groupJSON[col]));
		}

		// extracts all the applyKeys and puts them into the applyKeys array
		this.applyRules = query.APPLY;

		// extracts all the fields that need to be collected from a section and puts them into the fieldsToExtract array
		this.fieldsToExtract = this.group;
		for (let col in this.applyRules){
			let applyRule = this.applyRules[col];
			let applyKey = Object.keys(applyRule)[0];
			let applyKeyObj = applyRule[applyKey as keyof typeof applyRule];
			let token = Object.keys(applyKeyObj)[0];
			this.fieldsToExtract.push(returnIdentifier(applyKeyObj[token as keyof typeof applyKeyObj]));
		}

		for (let col in this.group) {
			this.group[col] = transformQueryToDatasetConvention(this.group[col]);
		}
		for (let col in this.fieldsToExtract) {
			this.fieldsToExtract[col] = transformQueryToDatasetConvention(this.fieldsToExtract[col]);
		}
	}

	public handleSort (array: InsightResult[]): InsightResult[] {
		return this.sort(array, this.order, this.dir);
	}

	// sorts array by string of keys, using sortByThenBy logic, in ascending or descending order based on dir
	// Order of keys determines how ties are broken
	public sort (array: InsightResult[], keys: string[], dir: number): InsightResult[] {
		// sorting array of objects by list of keys, dynamically: https://stackoverflow.com/questions/41808710/
		// sort-an-array-of-objects-by-dynamically-provided-list-of-object-properties-in-a

		return array.sort(function(a, b) {
			// generate compare function return value by iterating over the properties array
			return keys.reduce(function(bool, k) {
				// if previous compare result is `0` then compare with the next property value and return result
				let result = (a[k] < b[k]) ? -1 : (a[k] > b[k]) ? 1 : 0;
				result = result * dir;
				let r = bool || result;
				return r;
			}, 0);   // set initial value as 0
		});
	}

}


