import {Dataset, InsightError, InsightResult, ResultTooLargeError} from "../controller/IInsightFacade";
import {singleDatasetID, transformQueryToDatasetConvention, transformDatasetToQueryConvention,
	returnValueType, returnIdentifier,
	returnValueToSearch, insResultEquals} from "../model/helperFunctionsQueryContainer";

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
	public handleWhere(query: object, datasetID: string, dataset: Dataset): InsightResult[] {
		let resultArray: InsightResult[] = [];
		if (JSON.stringify(query) !== "{}") {
			// WHERE block is not empty

			// recursively traverse JSON query object:
			// ref: https://blog.boot.dev/javascript/how-to-recursively-traverse-objects/
			for (let queryKey in query) {
				if (queryKey === "OR") {
					for (let item in Object.values(query)[0]) {
						let nextItem = Object.values(query)[0][item];
						let arr = this.handleWhere(nextItem, datasetID, dataset);
						resultArray = resultArray.concat(arr);
					}
				} else if (queryKey === "AND") {
					let arr: InsightResult[] = [];
					let temp: InsightResult[] = [];
					let firstItem = Object.values(query)[0][0];
					arr = this.handleWhere(firstItem, datasetID, dataset);
					for (let item in Object.values(query)[0]) {
						let nextItem = Object.values(query)[0][item];
						temp = this.handleWhere(nextItem, datasetID, dataset);
						// need to filter arr based on where arr[item] is included in temp.
						// arr = arr.filter((item) => temp.includes(item));
						// create a function that check equality of InsightResults because above is not working
						// idk why -> but I think making function will be easiest
					}
				} else if (queryKey === "NOT") {
					// console.log("got to NOT"); TODO: recurse, but keeping in mind the not structure
				} else {
					for (let courseSection in dataset.datasetArray) {
						// iterate through every course section in the dataset
						let section = JSON.stringify(dataset.datasetArray[courseSection]);
						this.applyComparator(datasetID, query, section, resultArray, queryKey);
					}
				}
			}
		} else {
			// WHERE body is empty -> return all entries -> create test case that doesn't return too many results
			let courseResultArray = dataset.datasetArray[0];
			for (let course in courseResultArray) {
				// for each course in the dataset
				for (let column in this.columns) {
					// for each column option in the query
				}
			}
		}
		return resultArray;
	}

	private applyComparator(
		datasetID: string,
		query: object,
		section: string,
		resultArray: InsightResult[],
		comparator: string
	) {
		singleDatasetID("", datasetID); // check that multiple datasets aren't referenced
		let arr = Object.values(query);
		let field = transformQueryToDatasetConvention(returnIdentifier(JSON.stringify(arr[0])));
		let value = returnValueToSearch(JSON.stringify(arr[0]));
		let valueType = returnValueType(field);
		let match = this.doesThisSectionMatch(section, field, value, valueType, comparator);
		if (match) {
			let myInsightResult: InsightResult = {};
			for (let col in this.columns) {
				let keyCol = datasetID.concat("_", transformDatasetToQueryConvention(this.columns[col]));
				let val = this.getValue(section, this.columns[col], returnValueType(this.columns[col]));
				// To convert string to number: ref: https://stackoverflow.com/questions/23437476/in-
				// typescript-how-to-check-if-a-string-is-numeric/23440948#23440948
				let keyVal: string | number;
				if (returnValueType(this.columns[col]) === "number") {
					keyVal = Number(val);
				} else {
					keyVal = val;
				}
				if (keyCol === datasetID + "_year") {
					// need to check if sections = overall, if yes, year = 1900
					let sec = this.getValue(section, "Section", "string");
					if (sec === "overall") {
						keyVal = 1900;
					} else {
						keyVal = Number(keyVal);
					}
				} else if (keyCol === datasetID + "_uuid") {
					keyVal = keyVal.toString();
				}
				myInsightResult[keyCol] = keyVal;
			}
			resultArray.push(myInsightResult);
			if (resultArray.length > 5000) {
				throw new ResultTooLargeError("Exceeded 5000 entries");
			}
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

	public doesThisSectionMatch(section: string, field: string, value: string, valueType: string, comparator: string
	): boolean {
		let indexStartOfValue: number;
		let indexEndOfValue: number;
		if (valueType === "string") {
			indexStartOfValue = section.indexOf("\"" + field + "\"") + field.length + 3;
			indexEndOfValue = section.indexOf('"', indexStartOfValue + 1) + 1;
		} else {
			indexStartOfValue = section.indexOf("\"" + field + "\"") + field.length + 3;
			indexEndOfValue = section.indexOf(",", indexStartOfValue);
		}
		let val: string = "";
		if (field === "Year") {
			// need to check if sections = overall, if yes, year = 1900
			let sec = this.getValue(section, "Section", "string");
			if (sec === "overall") {
				val = "1900";
			} else {
				val = section.substring(indexStartOfValue + 1, indexEndOfValue - 1);
			}
		} else {
			val = section.substring(indexStartOfValue, indexEndOfValue);
		}
		if (comparator === "EQ" || comparator === "IS") {
			if (field === "id") {
				val = "\"" + val + "\"";
			}
			return val === value;
		} else if (comparator === "GT") {
			return Number(val) > Number(value);
		} else { // comparator === "LT"
			return Number(val) < Number(value);
		}
	}

	// handles the OPTIONS block in a query
	// throws InsightError("multiple datasets referenced") if any dataset ID's
	// found in the OPTIONS block do not match the datasetID parameter
	public handleOptions(query: object, datasetID: string) {
		let queryString: string = JSON.stringify(query);
		singleDatasetID(queryString, datasetID);

		// if there is an ORDER section, extract the order
		if (queryString.includes("ORDER")) {
			let indexOfOrderStart = queryString.indexOf("ORDER") + 8;
			let indexOfOrderEnd = queryString.indexOf("\"", indexOfOrderStart);
			this.order = queryString.substring(indexOfOrderStart, indexOfOrderEnd);
		}
		// creates a substring that contains only the columns
		let indexOfColumnsStart = queryString.indexOf("[") + 2;
		let indexOfColumnsEnd = queryString.indexOf("]");
		let columnsString = queryString.substring(indexOfColumnsStart, indexOfColumnsEnd);

		// extracts all the column identifiers and puts them into the columns array
		while (columnsString.length !== 0) {
			let indexStartOfNextColIden = columnsString.indexOf('"') + 3;
			this.columns.push(returnIdentifier(columnsString));
			columnsString = columnsString.substring(indexStartOfNextColIden);
		}
		this.columns.sort(); // sort columns alphabetically
		for (let col in this.columns) {
			this.columns[col] = transformQueryToDatasetConvention(this.columns[col]);
		}
	}


	// return value after identifier in a string
	// Linda -> probably want to refactor returnValueToSearch and doesThisSectionMatch to just use this function instead
	public getValue(str: string, identifier: string, type: string): string {
		let indexStartOfValue = str.indexOf("\"" + identifier + "\"") + identifier.length + 3;
		let indexEndOfValue: number;
		if (type === "string") {
			indexStartOfValue += 1;
			indexEndOfValue = str.indexOf('"', indexStartOfValue);
			return str.substring(indexStartOfValue, indexEndOfValue);
		} else {
			indexEndOfValue = str.indexOf(",", indexStartOfValue);
			return str.substring(indexStartOfValue, indexEndOfValue);
		}
	}
}
