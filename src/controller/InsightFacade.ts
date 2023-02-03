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

		// Step 1): CheckParams: Check if add dataset params (ID and kind) are acceptable.
		if (!this.checkIdAndKind(id,kind)) {
			throw new InsightError("ID and kind check failed");
		}

		// Step 2): unZip: read zip file. check that not empty

		// Step 3): makeDataset: add valid sections to array. if valid sections are zero, throw error.

		// Step 4): createDataset: add the dataset created in prev step to insightFacade object. Update insight
		// facade object with info about added dataset.

		// Step 5): diskWrite: write this object to data folder for persistence.


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

	// ---------PRIVATE HELPER FUNCTIONS FOR addDataset FAMILY------------------
	// SYED: Checks that ID param observes rules for naming and kind is of type "sections".
	private checkIdAndKind (id: string, kind: InsightDatasetKind): boolean {
		if (id.includes("_")){
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
