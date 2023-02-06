class Query{

	constructor() {
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
	public handleWhere(query: JSON, datasetID: string) {
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
	// Linda- I don't think this is recursive
	public handleOptions(query: JSON, datasetID: string) {
		// TODO
	}

}
