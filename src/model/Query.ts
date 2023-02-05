class Query{

	constructor() {
		console.log("Query Object created");
	}

	// handles the WHERE block in a query
	// throws InsightError("multiple datasets referenced") if any dataset ID's
	// found in the WHERE block do not match the datasetID parameter
	// LINDA - this is recursive
	public handleWhere(query: JSON, datasetID: string) {
		// TODO
	}

	// handles the OPTIONS block in a query
	// throws InsightError("multiple datasets referenced") if any dataset ID's
	// found in the OPTIONS block do not match the datasetID parameter
	// Linda- I don't think this is recursive
	public handleOptions(query: JSON, datasetID: string) {
		// TODO
	}

}
