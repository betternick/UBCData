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
	public handleWhere(query: JSON, datasetID: string, dataset: Dataset): InsightResult[] {
		// recursively traverse JSON object: ref: https://blog.boot.dev/javascript/how-to-recursively-traverse-objects/
		let resultArray: InsightResult[] = [];
		for (let k in query) {
			if (k === "OR"){
				// TODO: recurse, but keeping in mind the or structure
			} else if (k === "AND") {
				// TODO: recurse, but keeping in mind the and structure
			} else if (k === "NOT") {
				// TODO: recurse, but keeping in mind the not structure
			} else if (k === "IS") {
				// TODO: check that id matches datasetID and store info
			} else if (k === "GT") {
				// TODO: check that id matches datasetID and store info
			} else if (k === "LT") {
				// TODO: check that id matches datasetID and store info
			} else if (k === "EQ") {
				// TODO: check that id matches datasetID and store info
			} else {
				// WHERE body is empty -> return all entries
				// LINDA -> move this into its own method for cleanliness and single purpose principle
				// LINDA -> do the same thing with other options above

				// for the dataset array
				let courseResultArray = dataset.datasetArray[0];
				let insResult: InsightResult;
				// for each course in the dataset
				for (let course in courseResultArray) {
					// for each column in the query
					for (let column in this.columns) {
							// TODO: extract info from the course based on the required columns and add it
							//  to the insight result array
							// LINDA -> for reference:
							// An insightResult = {"sections_dept": "chem", "sections_avg": 94.5}
					}
				}
			}
		}
		return resultArray;
	}

	// handles the OPTIONS block in a query
	// throws InsightError("multiple datasets referenced") if any dataset ID's
	// found in the OPTIONS block do not match the datasetID parameter
	public handleOptions(query: string, datasetID: string) {
		if (!this.singleDatasetID(query, datasetID)) {
			return new InsightError("multiple data set IDs referenced");
		}
		let orderSection = JSON.parse(query).order;
		this.order = this.returnIdentifier(JSON.stringify(orderSection));
		let columnsSection = JSON.parse(query);
		for (let i in columnsSection){
			this.columns.push(this.returnIdentifier(i));
		}
	}

	// checks whether only a single ID is referenced
	public singleDatasetID(query: string, datasetID: string): boolean{
		for (let i = 0; i < query.length; i++) {
			if (query[i] === "_"){
				let indexStartOfID = query.lastIndexOf('"', i) + 1;
				let result = query.substring(indexStartOfID, i);
				if (result !== datasetID) {
					return false;
				}
			}
		}
		return true;
	}

	public returnIdentifier(query: string): string {
		const indexUnderscore = query.indexOf("_");
		const indexEndOfIdentifier = query.indexOf('"', indexUnderscore) - 1;
		let result: string;
		result = query.substring(indexUnderscore + 1, indexEndOfIdentifier);
		return result;
	}

}
