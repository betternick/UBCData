import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import {JSONchecker, queryCheckerForIs} from "./helperFunctionsQueryValidator";


export class QueryValidator {
	public whereBlock: object;
	public optionsBlock: object;
	public transformationsBlock: object | null;
	public datasetID: string;
	public datasetKind: InsightDatasetKind | null;
	public allowableWhereKeys: string[] = ["OR", "AND", "NOT", "IS", "GT", "LT", "EQ"];
	public mkeysSections: string[] = ["avg", "pass", "fail", "audit", "year"];
	public skeysSections: string[] = ["dept", "id", "instructor", "title", "uuid"];
	public mkeysRooms: string[] = ["lat", "lon", "seats"];
	public skeysRooms: string[] = ["fullname", "shortname", "number", "name", "address", "type", "furniture", "href"];
	public allowableFieldKeys: string[];
	public allowableColumnsKeys: string[];

	constructor () {
		this.whereBlock = {};
		this.optionsBlock = {};
		this.transformationsBlock = null;
		this.datasetID = "";
		this.datasetKind = null;
		this.allowableFieldKeys = [];
		this.allowableColumnsKeys = [];
	}

	public validateQuery(query: any, datasetID: string, kind: InsightDatasetKind) {
		let queryParsed = JSONchecker(query);
		this.init(queryParsed, datasetID, kind);
		this.structureChecker(queryParsed);
		this.whereChecker();
		this.transformationsChecker();
		this.optionsChecker();
	}

	public init(query: object, datasetID: string, kind: InsightDatasetKind) {
		this.datasetID = datasetID;
		this.datasetKind = kind;
		this.whereBlock = query["WHERE" as keyof typeof query];
		this.optionsBlock = query["OPTIONS" as keyof typeof query];
		if (Object.keys(query).includes("TRANSFORMATIONS")) {
			this.transformationsBlock = query["TRANSFORMATIONS" as keyof typeof query];
		}
		if (kind === InsightDatasetKind.Sections) {
			for (let i in this.mkeysSections) {
				this.mkeysSections[i] = datasetID + "_" + this.mkeysSections[i];
				this.allowableFieldKeys.push(this.mkeysSections[i]);
			}
			for (let i in this.skeysSections) {
				this.skeysSections[i] = datasetID + "_" + this.skeysSections[i];
				this.allowableFieldKeys.push(this.skeysSections[i]);
			}
		} else {
			for (let i in this.mkeysRooms) {
				this.mkeysRooms[i] = datasetID + "_" + this.mkeysRooms[i];
				this.allowableFieldKeys.push(this.mkeysRooms[i]);
			}
			for (let i in this.skeysRooms) {
				this.skeysRooms[i] = datasetID + "_" + this.skeysRooms[i];
				this.allowableFieldKeys.push(this.skeysRooms[i]);
			}
		}
	}

	public structureChecker(query: object) {
		let queryKeys = Object.keys(query);
		let allowableKeysForQuery = ["WHERE", "OPTIONS", "TRANSFORMATIONS"];
		this.areKeysValid(queryKeys, allowableKeysForQuery, "the query");
	}

	public whereChecker() {
		let whereKeys = Object.keys(this.whereBlock);
		if (this.whereBlock === undefined || this.whereBlock === null) {
			throw new InsightError("Missing WHERE");
		} else if (whereKeys.length > 1) {
			throw new InsightError("WHERE should only have 1 key, has " + whereKeys.length);
		}

		// WHERE block is empty
		if (JSON.stringify(this.whereBlock) === "{}") {
			return;
		}
		// WHERE block is not empty
		this.areKeysValid(whereKeys, this.allowableWhereKeys, "WHERE");
		this.checkFilters(this.whereBlock);
	}

	public checkFilters(query: any) {
		if (JSON.stringify(query) === "{}") {
			throw new InsightError("block in query is Empty!");
		}
		for (let queryKey in query) {
			if (queryKey === "OR" || queryKey === "AND") {
				this.areKeysValid(Object.keys(query), this.allowableWhereKeys, queryKey);
				for (let i in query[queryKey]) {
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
				if (!this.allowableFieldKeys.includes(key)) {
					throw new InsightError("Invalid key type for " + queryKey);
				}
				if (typeof (query[queryKey][key]) !== "number") {
					throw new InsightError("invalid Value type for " + queryKey + ", should be number");
				}
			} else {
				queryCheckerForIs(query, this.datasetID);
				return;
			}
		}
	}

	public transformationsChecker() {
		if (this.transformationsBlock === null) {	// no transformations block!
			this.allowableColumnsKeys = this.allowableFieldKeys;
		} else if (this.transformationsBlock === undefined) {
			throw new InsightError("TRANSFORMATIONS is undefined");
		} else if (typeof this.transformationsBlock !== "object") {
			throw new InsightError("TRANSFORMATIONS if not an object, it's a " + typeof  this.transformationsBlock);
		} else {
			let transformationsKeys = Object.keys(this.transformationsBlock);
			let allowableKeysForTransformations = ["GROUP", "APPLY"];
			this.areKeysValid(transformationsKeys, allowableKeysForTransformations, "TRANSFORMATIONS");
			if (!transformationsKeys.includes("GROUP") || !transformationsKeys.includes("APPLY")) {
				throw new InsightError("TRANSFORMATIONS missing GROUP or APPLY blocks");
			}
			this.groupChecker(this.transformationsBlock["GROUP" as keyof typeof this.transformationsBlock]);
			this.applyChecker(this.transformationsBlock["APPLY" as keyof typeof this.transformationsBlock]);
		}
	}

	public groupChecker(groupBlock: any) {
		if (groupBlock === undefined || groupBlock === null) {
			throw new InsightError("GROUP is null or undefined");
		}
		if (groupBlock.length === 0) {
			throw new InsightError("GROUP list is empty; must contain at least 1 key");
		} else {
			this.areKeysValid(groupBlock, this.allowableFieldKeys, "GROUP");
			this.allowableColumnsKeys = [...this.allowableColumnsKeys, ... groupBlock];
		}
	}

	public applyChecker(applyBlock: any) {
		if (applyBlock === undefined || applyBlock === null) {
			throw new InsightError("APPLY is null or undefined");
		}
		if (applyBlock.length === 0) {
			throw new InsightError("APPLY list is empty; must contain at least 1 apply rule");
		} else {
			let applyRulesNames: string[] = [];
			for (let i in applyBlock) {
				if (typeof applyBlock[i] !== "object") {
					throw new InsightError("apply rule " + i + "is not an object; all apply rules must be objects");
				}

				let key = Object.keys(applyBlock[i])[0];
				if (key.includes("_")) {
					throw new InsightError("apply keys cannot have '_' in their names");
				}
				applyRulesNames.push(key);

				let applyRuleObject = applyBlock[i][key];
				if (typeof applyRuleObject !== "object") {
					throw new InsightError ("apply rule defined by " + key + " is not an object; must be an object");
				}
				let tokens = Object.keys(applyRuleObject);
				let allowableTokens: string[] = ["MAX", "MIN", "AVG", "SUM", "COUNT"];
				this.areKeysValid(tokens, allowableTokens, "token");
				if (tokens[0] === "COUNT") {
					this.areKeysValid([applyRuleObject[tokens[0]]], this.allowableFieldKeys, "COUNT");
				} else {
					if (this.datasetKind === InsightDatasetKind.Sections) {
						this.areKeysValid([applyRuleObject[tokens[0]]], this.mkeysSections, tokens[0]);
					} else {
						this.areKeysValid([applyRuleObject[tokens[0]]], this.mkeysRooms, tokens[0]);
					}
				}
			}
			let duplicatesRemoved = applyRulesNames.filter((n, name) =>
				applyRulesNames.indexOf(n) === name);
			if (duplicatesRemoved.length !== applyRulesNames.length) {
				throw new InsightError("apply rule names must be unique");
			}
			this.allowableColumnsKeys = [...this.allowableColumnsKeys, ...applyRulesNames];
		}
	}

	public optionsChecker() {
		let optionsKeys = Object.keys(this.optionsBlock);
		let allowableKeysForOptions = ["COLUMNS", "ORDER"];
		if (this.optionsBlock === undefined || this.optionsBlock === null) {
			throw new InsightError("Missing OPTIONS");
		} else if (optionsKeys === undefined || optionsKeys === null) {
			throw new InsightError("OPTIONS is empty");
		} else if (!optionsKeys.includes("COLUMNS")) {
			throw new InsightError("OPTIONS missing COLUMNS");
		} else {
			this.areKeysValid(optionsKeys, allowableKeysForOptions, "OPTIONS");
			this.columnsChecker(this.optionsBlock["COLUMNS" as keyof typeof this.optionsBlock]);
			this.orderChecker(this.optionsBlock["ORDER" as keyof typeof this.optionsBlock],
				this.optionsBlock["COLUMNS" as keyof typeof this.optionsBlock]);
		}
	}

	public columnsChecker(columns: any) {
		if (columns === undefined || columns === null || columns.length === 0) {
		 	throw new InsightError("COLUMNS must be a non-empty array");
		}
		this.areKeysValid(columns, this.allowableColumnsKeys, "COLUMNS");
	}

	public orderChecker(order: any, columns: string[]) {
		if (Object.keys(this.optionsBlock).includes("ORDER")) {
			if (order === undefined) {
				throw new InsightError("ORDER is not properly defined");
			}
			if (typeof order === "string") {
				this.areKeysValid([order], columns, "ORDER");
			} else if (typeof order === "object") {
				let orderKeys = Object.keys(order);
				let allowedOrderKeys = ["dir", "keys"];
				this.areKeysValid(orderKeys, allowedOrderKeys, "ORDER");
				if (!orderKeys.includes("dir") || !orderKeys.includes("keys")) {
					throw new InsightError("Order must include 'dir' and 'keys'");
				}
				if (orderKeys.length !== 2) {
					throw new InsightError("Order must have 2 keys");
				}
				if (order.dir !== "UP" && order.dir !== "DOWN") {
					throw new InsightError("dir must be 'UP' or 'DOWN'");
				}
				this.areKeysValid(order.keys, columns, "ORDER");
			} else {
				throw new InsightError("Order must be an object or a string");
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
