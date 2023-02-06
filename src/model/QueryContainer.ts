import {InsightError} from "../controller/IInsightFacade";

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
	// found in the WHERE block do not match the datasetID parameter
	// LINDA - this is recursive
	public populateWhere(query: JSON, datasetID: string) {
		// recursively traverse JSON object: ref: https://blog.boot.dev/javascript/how-to-recursively-traverse-objects/
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
			}
		}
	}

	// handles the OPTIONS block in a query
	// throws InsightError("multiple datasets referenced") if any dataset ID's
	// found in the OPTIONS block do not match the datasetID parameter
	public populateOptions(query: string, datasetID: string) {
		if (!this.singleDatasetIDInColumns(query, datasetID)) {
			return new InsightError("multiple data set IDs referenced");
		}
		this.order = JSON.parse(query).order;
		this.columns = JSON.parse(query).columns;
	}

	// checks whether only a single ID is referenced in columns
	public singleDatasetIDInColumns(query: string, datasetID: string): boolean{
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

}
