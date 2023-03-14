import {InsightError} from "./IInsightFacade";
import {JSONchecker, queryCheckerForIs} from "./helperFunctionsQueryValidator";


export class QueryValidator {
	public queryWhere: object;
	public optionsBlock: object;
	public transformationsBlock: object;
	public datasetID: string;
	public allowableWhereKeys: string[] = ["OR", "AND", "NOT", "IS", "GT", "LT", "EQ"];

	constructor () {
		this.queryWhere = {};
		this.optionsBlock = {};
		this.transformationsBlock = {};
		this.datasetID = "";
	}

	public validateQuery(query: any, datasetID: string) {
		let queryParsed = JSONchecker(query);
		this.init(queryParsed, datasetID);
		this.structureChecker(query);
		this.whereChecker();
		if (!Object.keys(query).includes("TRANSFORMATIONS")) {
			this.columnsChecker(queryParsed, datasetID);
		} else {
			this.transformationsChecker();
		}
	}

	public init(query: object, datasetID: string) {
		this.datasetID = datasetID;
		this.queryWhere = query["WHERE" as keyof typeof query];
		this.optionsBlock = query["OPTIONS" as keyof typeof query];
		if (Object.keys(query).includes("TRANSFORMATIONS")) {
			this.transformationsBlock = query["TRANSFORMATIONS" as keyof typeof query];
		}
	}

	public structureChecker(query: object) {
		let queryKeys = Object.keys(query);
		let whereKeys = Object.keys(this.queryWhere);
		let optionsKeys = Object.keys(this.optionsBlock);
		let transformationsKeys = Object.keys(this.transformationsBlock);

		let allowableKeysForQuery = ["WHERE", "OPTIONS", "TRANSFORMATIONS"];
		let allowableKeysForOptions = ["COLUMNS", "ORDER"];
		let allowableKeysForTransformations = ["GROUP", "APPLY"];

		this.areKeysValid(queryKeys, allowableKeysForQuery, "the query");

		if (this.queryWhere === undefined || this.queryWhere === null) {
			throw new InsightError("Missing WHERE");
		} else if (whereKeys.length > 1) {
			throw new InsightError("WHERE should only have 1 key, has " + whereKeys.length);
		}

		if (this.optionsBlock === undefined || this.optionsBlock === null) {
			throw new InsightError("Missing OPTIONS");
		} else if (optionsKeys === undefined || optionsKeys === null) {
			throw new InsightError("OPTIONS is empty");
		} else if (!optionsKeys.includes("COLUMNS")) {
			throw new InsightError("OPTIONS missing COLUMNS");
		} else {
			this.areKeysValid(optionsKeys, allowableKeysForOptions, "OPTIONS");
		}

		if (this.transformationsBlock === null) {
			throw new InsightError("transformationsBlock is null");
		} else if (queryKeys.includes("TRANSFORMATIONS")) {
			this.areKeysValid(transformationsKeys, allowableKeysForTransformations, "TRANSFORMATIONS");
			if (!transformationsKeys.includes("GROUP") || !transformationsKeys.includes("APPLY")) {
				throw new InsightError("TRANSFORMATIONS missing GROUP or APPLY blocks");
			}
		}
	}

	public whereChecker() {
		if (JSON.stringify(this.queryWhere) === "{}") {		// WHERE block is empty
			return;
		}
		// WHERE block is not empty
		this.areKeysValid(Object.keys(this.queryWhere), this.allowableWhereKeys, "WHERE");
		this.checkFilters(this.queryWhere);
	}

	public checkFilters(query: any) {
		if (JSON.stringify(query) === "{}") {
			throw new InsightError("block in query is Empty!");
		}
		for (let queryKey in query) {
			if (queryKey === "OR" || queryKey === "AND") {
				this.areKeysValid(Object.keys(query), this.allowableWhereKeys, queryKey);
				for (let i in query[queryKey]) {
					console.log(query[queryKey][i]);
					this.checkFilters(query[queryKey][i]);
				}
			} else if (queryKey === "NOT") {
				let notBlock = query[queryKey as keyof typeof query];
				if (typeof notBlock !== "object") {
					throw new InsightError("NOT must be an object, currently: type is: " + typeof notBlock);
				}
				this.checkFilters(query[queryKey]);
			} else if (queryKey === "LT" || queryKey === "GT" || queryKey === "EQ") {
				let keys = Object.keys(query[queryKey]);
				if (keys.length !== 1) {
					throw new InsightError(queryKey + "must have only have 1 key");
				}
				let key = keys[0];
				let allowableFields: string[] = [this.datasetID + "_audit", this.datasetID + "_year",
					this.datasetID + "_pass", this.datasetID + "_fail", this.datasetID + "_avg",
					this.datasetID + "_lat", this.datasetID + "_lon", this.datasetID + "_seats"];
				if (!allowableFields.includes(key)) {
					throw new InsightError("Invalid key type for " + queryKey);
				}
				if (typeof (query[queryKey][key]) !== "number") {
					console.log(query[queryKey][key]);
					throw new InsightError("invalid Value type for " + queryKey + ", should be number");
				}
			} else {
				queryCheckerForIs(query, this.datasetID);
				return;
			}
		}
	}

	public columnsChecker(queryWhole: any, datasetID: string) {
		const queryOptionsBlock = queryWhole["OPTIONS" as keyof typeof queryWhole];

		let arrayInsideColumns = queryOptionsBlock["COLUMNS"];
		if (arrayInsideColumns.length === 0 || undefined || null) {
			throw new InsightError("COLUMNS must be a non-empty array");
		}
		let allowableKeys: string[] = ["dept", "avg", "id", "audit", "pass", "year", "fail", "uuid", "title",
			"instructor",
			"lat", "lon", "seats", "fullname", "shortname", "number", "name", "address", "type",
			"furniture", "href"];
		let validDatasetSeen = 0;
		for (let element of arrayInsideColumns) {
			if (typeof element !== "string" || !element.includes("_")) {
				throw new InsightError("Invalid type of COLUMN key: " + element);
			}
			let splitArray = element.split("_");
			if (splitArray[0] !== datasetID) {
				if (validDatasetSeen === 0) {
					throw new InsightError("Reference dataset not added yet");
				} else {
					throw new InsightError("Cannot query more than one dataset");
				}
			}
			validDatasetSeen = 1;
			if (!allowableKeys.includes(splitArray[1])) {
				throw new InsightError("Invalid key id in columns");
			}
		}
		this.orderFieldChecker(queryWhole);
	}

	public transformationsChecker() {

		// this.groupChecker(queryTransBlock["GROUP" as keyof typeof queryTransBlock], datasetID);
		// this.applyChecker(queryTransBlock["APPLY" as keyof typeof queryTransBlock], datasetID);
	}

	public groupChecker(group: string[], datasetID: string) {
		// TODO: for GROUP block of TRANSFORMATIONS
	}

	public applyChecker(apply: any, datasetID: string) {
		// TODO: for APPLY block of TRANSFORMATIONS
	}

	public orderFieldChecker(queryWhole: any) {
		const queryOptionsBlock = queryWhole["OPTIONS" as keyof typeof queryWhole];
		let arrayInsideColumns = queryOptionsBlock["COLUMNS"];
		let queryOptionsBlockKeys = Object.keys(queryOptionsBlock);
		if (queryOptionsBlockKeys.length > 1 && queryOptionsBlockKeys.includes("ORDER")) {
			let orderField = queryOptionsBlock["ORDER"];
			if (orderField === null || orderField === undefined) {
				throw new InsightError("invalid query string");
			}
			if (!arrayInsideColumns.includes(orderField)) {
				throw new InsightError("ORDER key must be in COLUMNS");
			}
		}
	}

	public areKeysValid(keys: string[], allowedKeys: string[], block: string) {
		for (let key of keys) {
			if (!allowedKeys.includes(key)) {
				throw new InsightError("Invalid key(s) in " + block);
			}
		}
	}
}
