import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
} from "./IInsightFacade";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	constructor() {
		console.log("InsightFacadeImpl::init()");
	}

	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {

		if (!this.checkIdAndKind(id,kind)) {
			throw new InsightError("ID and kind failed check");
		}

		// TO DO: CheckParams: Check if add dataset params (ID, content, kind) are acceptable

		// TO DO: unZip: read zip file. check that not empty

		// TO DO: makeDataset: add valid sections to array

		// TO DO: createDataset: add the dataset created in prev step to insightFacade object. Update insight
		// facade object with info about added dataset.

		// TO DO: diskWrite: write this object to data folder for persistence.


		return Promise.reject("Not implemented.");
	}

	public removeDataset(id: string): Promise<string> {
		return Promise.reject("Not implemented.");
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {
		return Promise.reject("Not implemented.");
	}

	public listDatasets(): Promise<InsightDataset[]> {
		return Promise.reject("Not implemented.");
	}

	// Helper functions for addDataset
	private checkIdAndKind (id: string, kind: InsightDatasetKind): boolean {

		if (id.includes("_")){
			return false;
		};
		if (id.includes(" ")){
			return false;
		};
		// Removing whitespace reference: https://stackoverflow.com/questions/10800355/remove-whitespaces-inside-a-string-in-javascript
		if (id.replace(/\s+/g, "").length === 0){
			return false;
		};
		if (kind !== "sections"){
			return false;
		};
		return true;
	}


}
