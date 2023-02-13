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
	public handleWhere(query: JSON, datasetID: string, dataset: Dataset): InsightResult[] {
		let resultArray: InsightResult[] = [];
		if (JSON.stringify(query) !== "{}") {
			let queryJSON = JSON.parse(JSON.stringify(query));
			// WHERE block is not empty

			// recursively traverse JSON query object:
			// ref: https://blog.boot.dev/javascript/how-to-recursively-traverse-objects/
			for (let queryKey in query) {
				if (queryKey === "OR") {
					// LINDA -> FOR THE MORNING------------------------------------------------------------------------
					// change apply comparator to always add uuid to Insight Result
					// Then, after handleWhere has returned, but before handleSort:
					//     1) remove duplicates (can I use a set???)
					//	   2) if uuid is not part of columns, remove it from each InsightResult
					// ------------------------------------------------------------------------------------------------
					for (let item in Object.values(query)[0]) {
						let nextItem = Object.values(query)[0][item];
						let arr = this.handleWhere(nextItem, datasetID, dataset);
						resultArray = resultArray.concat(arr);
					}
				} else if (queryKey === "AND") {
					let temp: InsightResult[] = [];
					let firstItem = queryJSON[queryKey][0];
					let arr = this.handleWhere(firstItem, datasetID, dataset);

					for (let item = 1; item < queryJSON[queryKey].length; item++) {
						let nextItem = queryJSON[queryKey][item];
						temp = this.handleWhere(nextItem, datasetID, dataset);
						let filtered: InsightResult[] = [];
						for (let i in arr) {
							let itemi = arr[i];
							let cont = true;
							for (let j in temp) {
								let itemj = temp[j];
								if (JSON.stringify(itemi) === JSON.stringify(itemj) && cont === true) {
									filtered.push(itemi);
									cont = false;
								}
							}
						}
						arr = filtered;
					}
					resultArray = resultArray.concat(arr);
				} else if (queryKey === "NOT") {
					// console.log("got to NOT"); TODO: recurse, but keeping in mind the not structure
					for (let courseSection in dataset.datasetArray) {
						// iterate through every course section in the dataset
					}
				} else {
					for (let courseSection in dataset.datasetArray) {
						// iterate through every course section in the dataset
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
		this.singleDatasetID("", datasetID); // check that multiple datasets aren't referenced
		// query = { sections_avg: 40}
		let key = Object.keys(query)[0];   				    // something like: sections_avg
		let value = Object.values(query)[0];   				// something like: 40
		let identifier = this.transformQueryToDatasetConvention(this.returnIdentifier(key));	// something like: Avg

		let match = this.doesThisSectionMatch(section, identifier, value, comparator);
		if (match) {
			let myInsightResult: InsightResult = {};
			for (let col in this.columns) {
				let keyCol = datasetID.concat("_", this.transformDatasetToQueryConvention(this.columns[col]));
				let valOfSection = this.getValue(section, this.columns[col]);

				let keyVal: string | number = "";
				if (keyCol === datasetID + "_year") {
					// need to check if sections = overall, if yes, year = 1900
					let sec = this.getValue(section, "Section");
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
		// creates a substring that contains only the columns
		let columnsJSON = queryJSON.COLUMNS;

		// extracts all the column identifiers and puts them into the columns array
		for (let col in columnsJSON) {
			this.columns.push(this.returnIdentifier(columnsJSON[col]));
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
		return query.substring(indexUnderscore + 1);
	}

	// return value after identifier in a string
	// Linda -> probably want to refactor returnValueToSearch and doesThisSectionMatch to just use this function instead
	public getValue(section: JSON, identifier: string): string | number {
		let sectionJSON = JSON.parse(JSON.stringify(section));
		return sectionJSON[identifier];
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

}
