import {Dataset, InsightError, InsightResult} from "../controller/IInsightFacade";

export class QueryContainer {
	public columns: string[];
	public order: string;

	constructor() {
		this.columns = [];
		this.order = "";
		console.log("Query Object created");
	}

	// let order = "ORDER", columns = "COLUMNS";
	// let is = "IS", not = "NOT", and = "AND", or = "OR";
	// let lt = "LT", gt = "GT", eq = "EQ";
	// let avg = "avg", pass = "pass", fail = "fail", audit = "audit", year = "year";
	// let dept = "dept", id = "id", instructor = "instructor", title = "title", uuid = "uuid";
	// let idstring = "idstring", inputstring = "inputstring";

	// handles the WHERE block in a query
	// throws InsightError("multiple datasets referenced") if any dataset ID's
	// otherwise, returns the InsightResult[] that corresponds to the query
	// found in the WHERE block do not match the datasetID parameter
	// LINDA - this is recursive
	public handleWhere(query: object, datasetID: string, dataset: Dataset) {
		let resultArray: InsightResult[] = [];
		if (JSON.stringify(query) !== "{}") { // WHERE block is not empty
			for (let courseSection in dataset.datasetArray) { // iterate through every course section in the dataset
				// recursively traverse JSON query object:
				// ref: https://blog.boot.dev/javascript/how-to-recursively-traverse-objects/
				for (let queryKey in query) {
					if (queryKey === "OR") {
						// console.log("got to OR"); TODO: recurse, but keeping in mind the or structure
					} else if (queryKey === "AND") {
						// console.log("got to AND"); TODO: recurse, but keeping in mind the and structure
					} else if (queryKey === "NOT") {
						// console.log("got to NOT"); TODO: recurse, but keeping in mind the not structure
					} else if (queryKey === "IS") {
						// console.log("got to IS"); TODO: check that id matches datasetID and store info
					} else if (queryKey === "GT") {
						// console.log("got to GT"); TODO: check that id matches datasetID and store info
					} else if (queryKey === "LT") {
						// console.log("got to LT"); TODO: check that id matches datasetID and store info
					} else if (queryKey === "EQ") {
						this.singleDatasetID("", datasetID); // check that multiple datasets aren't referenced
						let arr = Object.values(query);
						let field = this.transformQueryToDatasetConvention(
							this.returnIdentifier(JSON.stringify(arr[0])));
						let value = this.returnValueToSearch(JSON.stringify(arr[0]));
						let valueType = this.returnValueType(field);
						let match = this.doesThisSectionMatch(
							JSON.stringify(dataset.datasetArray[courseSection]),field,value,valueType);
						if (match) {
							let myInsightResult: InsightResult = {};
							for (let col in this.columns) {
								let keyCol = datasetID.concat("_",
									this.transformDatasetToQueryConvention(this.columns[col]));
								let val = this.getValue(JSON.stringify(dataset.datasetArray[courseSection]),
									this.columns[col],this.returnValueType(this.columns[col]));
								// To convert string to number: ref: https://stackoverflow.com/questions/23437476/in-
								// typescript-how-to-check-if-a-string-is-numeric/23440948#23440948
								let keyVal: string | number;
								if (this.returnValueType(this.columns[col]) === "number") {
									keyVal = Number(val);
								} else {
									keyVal = val;
								}
								myInsightResult[keyCol] = keyVal;
							}
							resultArray.push(myInsightResult);
						}
					}
				}
			}
			return resultArray;
		} else {
			// WHERE body is empty -> return all entries -> create test case that doesn't return too many results
			let courseResultArray = dataset.datasetArray[0];
			for (let course in courseResultArray) { // for each course in the dataset
				for (let column in this.columns) { // for each column option in the query
				}
			}
			return resultArray;
		}
	}

	// handles the OPTIONS block in a query
	// throws InsightError("multiple datasets referenced") if any dataset ID's
	// found in the OPTIONS block do not match the datasetID parameter
	public handleOptions(query: object, datasetID: string) {
		let queryString: string = JSON.stringify(query);

		this.singleDatasetID(queryString, datasetID);

		// if there is an ORDER section, extract the order
		let indexOfOrderStart = queryString.indexOf("ORDER") + datasetID.length + 8;
		let orderString = queryString.substring(indexOfOrderStart);
		if (indexOfOrderStart !== 0) {
			this.order = this.transformQueryToDatasetConvention(this.returnIdentifier(orderString));
		}

		// creates a substring that contains only the columns
		let indexOfColumnsStart = queryString.indexOf("[") + 2;
		let indexOfColumnsEnd = queryString.indexOf("]");
		let columnsString = queryString.substring(indexOfColumnsStart, indexOfColumnsEnd);

		// extracts all the column identifiers and puts them into the columns array
		while (columnsString.length !== 0) {
			let indexStartOfNextColIden = columnsString.indexOf('"') + 3;
			this.columns.push(this.transformQueryToDatasetConvention(this.returnIdentifier(columnsString)));
			columnsString = columnsString.substring(indexStartOfNextColIden);
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
		let result: string;
		result = query.substring(indexUnderscore + 1, indexEndOfIdentifier);
		return result;
	}

	// return value used during the search (ie. value we are looking for)
	public returnValueToSearch(query: string) {
		const indexUnderscore = query.indexOf(":");
		const indexEndOfIdentifier = query.indexOf("}", indexUnderscore);
		let result: string;
		result = query.substring(indexUnderscore + 2, indexEndOfIdentifier - 1);
		return result;
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

	public doesThisSectionMatch(courseSectionString: string, field: string, value: string, valueType: string): boolean {
		let indexStartOfValue = courseSectionString.indexOf(field) + field.length + 2;
		let indexEndOfValue: number;
		if (valueType === "string") {
			indexEndOfValue = courseSectionString.indexOf('"', indexStartOfValue);
		} else {
			indexEndOfValue = courseSectionString.indexOf(",", indexStartOfValue);
		}
		let val = courseSectionString.substring(indexStartOfValue, indexEndOfValue);
		return val === value;
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
			field = "Instructor";
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
			field === "Year" ||
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