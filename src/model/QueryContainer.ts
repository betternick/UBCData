import {Dataset, InsightResult, ResultTooLargeError} from "../controller/IInsightFacade";
import {
	returnIdentifier, transformQueryToDatasetConvention, transformDatasetToQueryConvention, wildcardMatcher,
	sort, createIResWhereHelper
} from "./helperFunctionsQueryContainer";
import Decimal from "decimal.js";

export class QueryContainer {

	public fieldsToExtract: string[];	// keys needed to create InsightResult
	public group: string[];				// keys used to group sections together
	public applyRules: {[key: string]: object};
	public columns: string[];			// only used if there are TRANSFORMATIONS
	public order: string[];
	public dir: number;

	constructor() {
		this.fieldsToExtract = [];
		this.group = [];
		this.applyRules = {};
		this.columns = [];
		this.order = [];
		this.dir = 1;		// UP = ascending = 1      DOWN = descending = -1
	}

	public handleWhere (query: any, datasetID: string, dataset: Dataset): InsightResult[] {
		let resultArray: InsightResult[] = [];
		let sections = dataset.datasetArray;
		if (this.group.length === 0) {
			for (let sec in sections) {
				let mySection = sections[sec];
				if (this.applyFilters(query, datasetID, dataset.datasetArray[sec])) {
					let myInsightResult = createIResWhereHelper(datasetID, mySection, this.fieldsToExtract);
					resultArray.push(myInsightResult);
				}
			}
		} else {
			let tempArray: InsightResult[] = [];
			for (let sec in sections) {
				let mySection = sections[sec];
				if (this.applyFilters(query, datasetID, dataset.datasetArray[sec])) {
					let myInsightResult = createIResWhereHelper(datasetID, mySection, this.fieldsToExtract);
					tempArray.push(myInsightResult);
				}
			}
			tempArray = sort(tempArray, this.group, 1);
			resultArray = this.applyGroupAndRules(tempArray, datasetID);
		}

		if (resultArray.length > 5000) {
			throw new ResultTooLargeError("Too many results!");
		}

		return resultArray;
	}

	private applyGroupAndRules(tempArray: InsightResult[], datasetID: string): InsightResult[] {
		let result: InsightResult[] = [];
		let indivGroup: InsightResult[] = []; // all insight results in a single group
		let firstRes: InsightResult = tempArray[0];
		indivGroup.push(firstRes);
		let lastGroupVals: Array<string | number> = [];
		for (let prop in this.group) {
			lastGroupVals.push(firstRes[this.group[prop]]);
		}
		let index: number = 1;
		while (index !== tempArray.length) {
			let thisRes: InsightResult = tempArray[index];
			let currGroupVals: Array<string | number> = [];
			for (let prop in this.group) {
				currGroupVals.push(thisRes[this.group[prop]]);
			}
			let match = lastGroupVals.every((val, i) => val === currGroupVals[i]);
			if (match) {
				indivGroup.push(thisRes);
				index++;
			} else {
				let myInsightResult = this.createIResApplyHelper(datasetID, indivGroup[0], indivGroup);
				result.push(myInsightResult);
				lastGroupVals = currGroupVals;
				indivGroup = [];
				indivGroup.push(tempArray[index]);
				index++;
			}
		}
		let myInsightResult: InsightResult = this.createIResApplyHelper(datasetID, tempArray[tempArray.length - 1],
			indivGroup);
		result.push(myInsightResult);
		return result;
	}

	private createIResApplyHelper(datasetID: string, insRes: InsightResult, group: InsightResult[]): InsightResult {
		let myInsightResult: InsightResult = {};
		for (let col in this.columns) {
			let key = this.columns[col];
			let val: string | number;
			if (key.includes(datasetID)) {
				val = insRes[key];
			} else {
				let rule = this.applyRules[key];
				let token = Object.keys(rule)[0];
				let field = rule[token as keyof typeof rule];
				val = this.applyTheRule(token, field, group); // apply the rule!!!
			}
			myInsightResult[key] = val;
		}
		return myInsightResult;
	}

	private applyTheRule(token: string, field: string, group: InsightResult[]): number {
		let result = 0;
		if (token === "MAX") {
			for (let res in group) {
				if (group[res][field] > result) {
					result = group[res][field] as typeof result;
				}
			}
		} else if (token === "MIN") {
			result = Infinity;
			for (let res in group) {
				if (group[res][field] < result) {
					result = group[res][field] as typeof result;
				}
			}
		} else if (token === "AVG") {
			let total = new Decimal(0);
			let count = 0;
			for (let res in group){
				let val = new Decimal(group[res][field] as typeof result);
				total = Decimal.add(total, val);
				count++;
			}
			let avg = total.toNumber() / count;
			result = Number(avg.toFixed(2));
		} else if (token === "SUM") {
			for (let res in group) {
				result += group[res][field] as typeof result;
			}
			result = Number(result.toFixed(2));
		} else { // (token === "COUNT")
			let valArray = [];
			for (let res in group) {
				valArray.push(group[res][field]);
			}
			result = new Set(valArray).size;
		}
		return result;
	}


// Applies the filters in the query to the given section and returns
	// true if the section matches all filters, false otherwise
	public applyFilters(query: any, datasetID: string, section: any): boolean {
		let result: boolean = false;
		if (JSON.stringify(query) !== "{}") {  // WHERE block is not empty
			// recursively traverse JSON query object:
			// ref: https://blog.boot.dev/javascript/how-to-recursively-traverse-objects/
			for (let queryKey in query) {
				if (queryKey === "OR") {
					let firstItem = query[queryKey][0];
					let tempResult: boolean = this.applyFilters(firstItem, datasetID, section);
					for (let item = 1; item < query[queryKey].length; item++) {
						let nextItem = query[queryKey][item];
						if (!tempResult) {
							tempResult = this.applyFilters(nextItem, datasetID, section);
						}
					}
					result = tempResult;
				} else if (queryKey === "AND") {
					let firstItem = query[queryKey][0];
					let tempResult: boolean = this.applyFilters(firstItem, datasetID, section);
					for (let item = 1; item < query[queryKey].length; item++) {
						let nextItem = query[queryKey][item];
						if (tempResult) {
							tempResult = this.applyFilters(nextItem, datasetID, section);
						}
					}
					result = tempResult;
				} else if (queryKey === "NOT") {
					return !this.applyFilters(query[queryKey], datasetID, section);
				} else {
					let key = Object.keys(query[queryKey])[0]; 						// something like: sections_avg
					let value = Object.values(query[queryKey])[0];   				// something like: 40
					let identifier = transformQueryToDatasetConvention(returnIdentifier(key));	// something like: Avg
					result = this.doesThisSectionMatch(section, identifier, value, queryKey);
				}
			}
			return result;
		} else { // empty where block -> return all sections
			return true;
		}
	}

	// checks if the given section matches the values from the query for the
	// given comparator. Returns true if it matches, false otherwise
	public doesThisSectionMatch(section: any, identifier: string, value: any, comparator: string): boolean {
		let valOfSection = section[identifier];
		if (identifier === "id") {
			valOfSection = valOfSection.toString();
		}
		if (identifier === "Year") {
			if (section["Section"] === "overall") {
				valOfSection = 1900;
			} else {
				valOfSection = Number(valOfSection);
			}
		}
		if (identifier === "seats") {
			valOfSection = Number(valOfSection);
		}
		if (comparator === "EQ") {
			return valOfSection === value;
		} else if (comparator === "GT") {
			return valOfSection > value;
		} else if (comparator === "LT") {
			return valOfSection < value;
		} else { // comparator === "IS"
			if (value.includes("*")) {
				return wildcardMatcher(valOfSection, value);
			} else {
				return valOfSection === value;
			}
		}
	}

	public handleOptions(query: any) {
		// if there is an ORDER section, extract the order
		if (Object.prototype.hasOwnProperty.call(query, "ORDER")) {
			if (typeof query.ORDER === "string") {
				this.order.push(query.ORDER);
			} else {
				this.order = query.ORDER.keys;
				this.dir = (query.ORDER.dir === "UP") ? 1 : -1;
			}
		}
		this.columns = query.COLUMNS;
	}

	public handleTransformations(query: any) {
		// if the query does not have a transformation block
		if (query === undefined) {
			for (let col in this.columns) {
				this.fieldsToExtract.push(transformQueryToDatasetConvention(returnIdentifier(this.columns[col])));
			}
			return;
		}

		// extracts all the group identifiers and puts them into the group array
		this.group = query.GROUP;

		// extracts all the fields from group, and add to fieldsToExtract array
		for (let col in this.group) {
			this.fieldsToExtract.push(transformQueryToDatasetConvention(returnIdentifier(this.group[col])));
		}

		// extract apply rules, add them to applyRules Object, and add appropriate fields to fieldsToExtract array
		let ruleArray = query.APPLY;
		for (let col in ruleArray){
			let applyRule = ruleArray[col];
			let applyKey = Object.keys(applyRule)[0];
			let applyKeyObj = applyRule[applyKey as keyof typeof applyRule];

			// add rule to applyRules Object
			this.applyRules[applyKey] = applyKeyObj;

			// extract fields from the applyRules and add to fieldsToExtract array
			let token = Object.keys(applyKeyObj)[0];
			this.fieldsToExtract.push(returnIdentifier(applyKeyObj[token as keyof typeof applyKeyObj]));
		}

		for (let col in this.fieldsToExtract) {
			this.fieldsToExtract[col] = transformQueryToDatasetConvention(this.fieldsToExtract[col]);
		}
	}

	public handleSort (array: InsightResult[]): InsightResult[] {
		return sort(array, this.order, this.dir);
	}
}


