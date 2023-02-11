import {Dataset, InsightError, InsightResult, ResultTooLargeError} from "../controller/IInsightFacade";

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
					for (let courseSection in dataset.datasetArray) {
						// iterate through every course section in the dataset
						let section = JSON.stringify(dataset.datasetArray[courseSection]);
						// console.log("got to AND"); TODO: recurse, but keeping in mind the and structure
						// pretty sure I do something like this:
						// create # of arrays that match the total number of items in and
						// for (item in AND)
						// 		arr# = handlewhere(item)
						// traverse arr1
						// 		- for every item in arr 1, see if it's included in arr2/3/4...
						//		- if yes, keep it. If not, remove it
						//		- concat(arr1 with resultArray)
					}
				} else if (queryKey === "NOT") {
					// console.log("got to NOT"); TODO: recurse, but keeping in mind the not structure
					for (let courseSection in dataset.datasetArray) {
						// iterate through every course section in the dataset
						let section = JSON.stringify(dataset.datasetArray[courseSection]);
					}
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
		this.singleDatasetID("", datasetID); // check that multiple datasets aren't referenced
		let arr = Object.values(query);
		let field = this.transformQueryToDatasetConvention(this.returnIdentifier(JSON.stringify(arr[0])));
		let value = this.returnValueToSearch(JSON.stringify(arr[0]));
		let valueType = this.returnValueType(field);
		let match = this.doesThisSectionMatch(section, field, value, valueType, comparator);
		if (match) {
			let myInsightResult: InsightResult = {};
			for (let col in this.columns) {
				let keyCol = datasetID.concat("_", this.transformDatasetToQueryConvention(this.columns[col]));
				let val = this.getValue(section, this.columns[col], this.returnValueType(this.columns[col]));
				// To convert string to number: ref: https://stackoverflow.com/questions/23437476/in-
				// typescript-how-to-check-if-a-string-is-numeric/23440948#23440948
				let keyVal: string | number;
				if (this.returnValueType(this.columns[col]) === "number") {
					keyVal = Number(val);
				} else {
					keyVal = val;
				}
				if (keyCol === datasetID + "_year") {
					// need to check if sections = overall, if yes, year = 1900
					let sec = this.getValue(section, "Section", "string");
					console.log("SECTION IS: " + sec);
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
		array.sort(dynamicSort(this.order));
		return array;
	}

	public doesThisSectionMatch(
		courseSectionString: string,
		field: string,
		value: string,
		valueType: string,
		comparator: string
	): boolean {
		let indexStartOfValue: number;
		let indexEndOfValue: number;
		if (valueType === "string") {
			indexStartOfValue = courseSectionString.indexOf(field) + field.length + 2;
			indexEndOfValue = courseSectionString.indexOf('"', indexStartOfValue + 1) + 1;
		} else {
			indexStartOfValue = courseSectionString.indexOf(field) + field.length + 2;
			indexEndOfValue = courseSectionString.indexOf(",", indexStartOfValue);
		}
		let val = courseSectionString.substring(indexStartOfValue, indexEndOfValue);
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
		this.singleDatasetID(queryString, datasetID);

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
			this.columns.push(this.returnIdentifier(columnsString));
			columnsString = columnsString.substring(indexStartOfNextColIden);
		}
		this.columns.sort(); // sort columns alphabetically
		for (let col in this.columns) {
			this.columns[col] = this.transformQueryToDatasetConvention(this.columns[col]);
		}
	}

	// checks whether only a single ID is referenced
	public singleDatasetID(query: string, datasetID: string) {
		for (let i = 0; i < query.length; i++) {
			if (query[i] === "_") {
				let indexStartOfID = query.lastIndexOf('"', i) + 1;
				let result = query.substring(indexStartOfID, i);
				if (result !== datasetID) {
					throw new InsightError("multiple datasets referenced");
				}
			}
		}
		return;
	}

	// returns the identifier after an underscore
	public returnIdentifier(query: string): string {
		const indexUnderscore = query.indexOf("_");
		const indexEndOfIdentifier = query.indexOf('"', indexUnderscore);
		return query.substring(indexUnderscore + 1, indexEndOfIdentifier);
	}

	// return value used during the search (ie. value we are looking for)
	public returnValueToSearch(query: string) {
		const indexStartOfIdentifier = query.indexOf(":");
		const indexEndOfIdentifier = query.indexOf("}", indexStartOfIdentifier);
		return query.substring(indexStartOfIdentifier + 1, indexEndOfIdentifier);
	}

	// return value after identifier in a string
	// Linda -> probably want to refactor returnValueToSearch and doesThisSectionMatch to just use this function instead
	public getValue(str: string, identifier: string, type: string): string {
		let indexStartOfValue = str.indexOf(identifier) + identifier.length + 2;
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

	// transform field from naming convention in query to naming convention in dataset
	private transformQueryToDatasetConvention(field: string): string {
		if (field === "uuid") {
			field = "id";
		} else if (field === "id") {
			field = "Course";
		} else if (field === "title") {
			field = "Title";
		} else if (field === "instructor") {
			field = "Professor";
		} else if (field === "dept") {
			field = "Subject";
		} else if (field === "year") {
			field = "Year";
		} else if (field === "avg") {
			field = "Avg";
		} else if (field === "pass") {
			field = "Pass";
		} else if (field === "fail") {
			field = "Fail";
		} else {
			field = "Audit";
		}
		return field;
	}

	// transform field from naming convention in dataset to naming convention in query
	public transformDatasetToQueryConvention(field: string): string {
		if (field === "id") {
			field = "uuid";
		} else if (field === "Course") {
			field = "id";
		} else if (field === "Title") {
			field = "title";
		} else if (field === "Professor") {
			field = "instructor";
		} else if (field === "Subject") {
			field = "dept";
		} else if (field === "Year") {
			field = "year";
		} else if (field === "Avg") {
			field = "avg";
		} else if (field === "Pass") {
			field = "pass";
		} else if (field === "Fail") {
			field = "fail";
		} else {
			field = "audit";
		}
		return field;
	}

	// returns the expects type for the field (number or string)
	public returnValueType(field: string) {
		if (
			field === "id" ||
			field === "Avg" ||
			field === "Pass" ||
			field === "Fail" ||
			field === "Audit"
		) {
			return "number";
		} else {
			return "string";
		}
	}
}
