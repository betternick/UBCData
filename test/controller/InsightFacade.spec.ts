import {
	IInsightFacade,
	InsightDatasetKind,
	InsightError,
	InsightResult, NotFoundError,
	ResultTooLargeError,
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";

import {folderTest} from "@ubccpsc310/folder-test";
import {expect, use} from "chai";
import chaiAsPromised from "chai-as-promised";
import {clearDisk, getContentFromArchives} from "../TestUtil";

use(chaiAsPromised);


// syed test branch

describe("InsightFacade", function () {
	let facade: IInsightFacade;

	// Declare datasets used in tests. You should add more datasets like this!
	let sections: string;
	// SYED: Additional sections added for testing
	let sectionsTextFile: string;
	let sectionsEmptyFile: string;
	let sectionsInvalidSection: string;
	// SYED: The following section only has the first 15 courses from pair
	let sectionsLightSection: string;

	before(function () {
		// This block runs once and loads the datasets.
		sections = getContentFromArchives("pair.zip");
		// SYED: Instantiating sections
		sectionsTextFile = getContentFromArchives("textFile.rtf");
		sectionsEmptyFile = getContentFromArchives("pairEmpty.zip");
		sectionsInvalidSection = getContentFromArchives("pairInvalidSection.zip");
		sectionsLightSection = getContentFromArchives("pairLight.zip");
		// Just in case there is anything hanging around from a previous run of the test suite
		clearDisk();
	});


	// describe("local tests", function () {
	//
	// 	it("a local test of equals", function () {
	// 		const result = [
	// 			{
	// 				sections_dept: "aanb",
	// 				sections_avg: 87.83
	// 			},
	// 			{
	// 				sections_dept: "aanb",
	// 				sections_avg: 87.83
	// 			},
	// 			{
	// 				sections_dept: "aanb",
	// 				sections_avg: 94.44
	// 			},
	// 			{
	// 				sections_dept: "aanb",
	// 				sections_avg: 94.44
	// 			}
	// 		];
	//
	// 		let result2 = [
	// 			{
	// 				sections_dept: "aanb",
	// 				sections_avg: 87.83
	// 			},
	// 			{
	// 				sections_dept: "aanb",
	// 				sections_avg: 87.83
	// 			},
	// 			{
	// 				sections_dept: "aanb",
	// 				sections_avg: 94.44
	// 			},
	// 			{
	// 				sections_dept: "aanb",
	// 				sections_avg: 94.44
	// 			}
	// 		];
	// 		expect(result2).to.deep.equals(result);
	// 	});
	//
	//
	// 	it("a local test of equals 2", function () {
	// 		const result = [
	// 			{
	// 				sections_dept: "aanb",
	// 				sections_avg: 87.83
	// 			},
	// 			{
	// 				sections_dept: "aanb",
	// 				sections_avg: 94.44
	// 			},
	// 			{
	// 				sections_dept: "aanb",
	// 				sections_avg: 95
	// 			}
	// 		];
	//
	// 		let result2 = [
	// 			{
	// 				sections_dept: "aanb",
	// 				sections_avg: 87.83
	// 			},
	// 			{
	// 				sections_dept: "aanb",
	// 				sections_avg: 95
	// 			},
	// 			{
	// 				sections_dept: "aanb",
	// 				sections_avg: 94.44
	// 			}
	// 		];
	// 		expect(result2).to.deep.equals(result);
	// 	});
	//
	//
	// 	it("a local test of in", function () {
	//
	// 		let json1 = {
	// 			WHERE: {
	// 				AND:
	// 					[
	// 						{LT: {sections_avg: 99}},
	// 						{IS: {sections_dept: "aanb"}}
	// 					]
	// 			},
	// 			OPTIONS: {
	// 				COLUMNS: [
	// 					"sections_dept",
	// 					"sections_avg"
	// 				],
	// 				ORDER: "sections_avg"
	// 			}
	// 		};
	// 		// let myObj = JSON.parse(json1);
	// 		let flag = false;
	// 		if ("OPTIONS" in json1) {
	// 			if ("ORDER" in json1["OPTIONS"]){
	// 				flag = true;
	// 			}
	//
	// 		}
	// 		expect(flag).to.deep.equals(true);
	// 	});
	//
	//
	// });


	describe("Add/Remove/List Dataset", function () {
		before(function () {
			console.info(`Before: ${this.test?.parent?.title}`);
		});

		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			console.info(`BeforeTest: ${this.currentTest?.title}`);
			facade = new InsightFacade();
		});

		after(function () {
			console.info(`After: ${this.test?.parent?.title}`);
		});

		afterEach(function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent of the previous one
			console.info(`AfterTest: ${this.currentTest?.title}`);
			clearDisk();
		});


		describe("addDataset tests", function () {


			describe("addDataset_ID_errors", function () {

				it("should reject with an empty dataset id", function () {
					const result = facade.addDataset("", sectionsLightSection, InsightDatasetKind.Sections);
					return expect(result).to.eventually.be.rejectedWith(InsightError);
				});


				it("should reject with an whitespace id", function () {
					const result = facade.addDataset(" ", sectionsLightSection, InsightDatasetKind.Sections);
					return expect(result).to.eventually.be.rejectedWith(InsightError);
				});


				it("should reject because of an _ in the id", function () {
					const result = facade.addDataset("qwerty_123", sectionsLightSection, InsightDatasetKind.Sections);
					return expect(result).to.eventually.be.rejectedWith(InsightError);
				});


			});

			describe("addDataset_content_errors", function () {

				it("should reject due to a non-zip source file", function () {
					// let sections_text: string;
					// sections_text = getContentFromArchives("textFile.rtf");
					const result = facade.addDataset("qwerty", sectionsTextFile, InsightDatasetKind.Sections);
					return expect(result).to.eventually.be.rejectedWith(InsightError);
				});


				it("should reject due to an empty zip source file", function () {

					const result = facade.addDataset("qwerty", sectionsEmptyFile, InsightDatasetKind.Sections);
					return expect(result).to.eventually.be.rejectedWith(InsightError);
				});

				it("should reject due to one section that is invalid in the zip source file", function () {

					const result = facade.addDataset("qwerty", sectionsInvalidSection, InsightDatasetKind.Sections);
					return expect(result).to.eventually.be.rejectedWith(InsightError);
				});

			});

			describe("Other_addDataset_errors", function () {

				it("should reject due to attempting to add a Rooms kind", function () {
					const result = facade.addDataset("qwerty", sectionsLightSection, InsightDatasetKind.Rooms);
					return expect(result).to.eventually.be.rejectedWith(InsightError);
				});

				it("should reject due to a duplicate add chai-as-promised V2", function () {
					const result = facade.addDataset("qwerty", sectionsLightSection, InsightDatasetKind.Sections).then(
						() => facade.addDataset("qwerty", sectionsLightSection, InsightDatasetKind.Sections));

					expect(result).to.eventually.be.rejectedWith(InsightError);
					// return expect(result2).to.eventually.be.rejectedWith(InsightError);
				});
			});

			describe("addDataset_assertions", function () {


				// it("database should be successfully added - with try-catch block", async function () {
				// 	try {
				// 		const result = await facade.addDataset("qwerty", sectionsLightSection,
				// 			InsightDatasetKind.Sections);
				// 		expect(result.length).to.equals(1);
				// 		expect(result[0]).to.equals("qwerty");
				// 		const len2 = await facade.listDatasets();
				// 		expect(len2.length).to.equals(1);
				// 	} catch (err) {
				// 		expect.fail("Should not have rejected!");
				// 	}
				// });


				it("database should be successfully added", async function () {
					const result = await facade.addDataset("qwerty", sectionsLightSection, InsightDatasetKind.Sections);
					expect(result.length).to.equals(1);
					expect(result[0]).to.equals("qwerty");
					const len2 = await facade.listDatasets();
					expect(len2.length).to.equals(1);
				});

				it("second database should be successfully added", async function () {
					try {
						const result = await facade.addDataset("qwerty", sectionsLightSection,
							InsightDatasetKind.Sections);
						const len0 = await facade.listDatasets();
						expect(len0.length).to.equals(1);
						const result2 = await facade.addDataset("qwerty2", sectionsLightSection,
							InsightDatasetKind.Sections);
						expect(result2.length).to.equals(2);
						const len1 = await facade.listDatasets();
						expect(len1.length).to.equals(2);
						expect(result2[0]).to.equals("qwerty");
						expect(result2[1]).to.equals("qwerty2");

					} catch (err) {
						expect.fail("Should not have rejected!");
						//  expect(err).to.be.instanceof(TooSimple);
					}
				});
			});
		});


		describe("removeDataset", function () {

			describe("removeDataset_errors", function () {

				it("should reject since no dataset is added", function () {
					const result = facade.removeDataset("asd");
					return expect(result).to.eventually.be.rejectedWith(NotFoundError);
				});

				it("should reject since dataset was already removed", function () {
					const result = facade.addDataset("qwerty", sectionsLightSection, InsightDatasetKind.Sections).then(
						() => facade.removeDataset("qwerty")).then(
						() => facade.removeDataset("qwerty"));
					return expect(result).to.eventually.be.rejectedWith(NotFoundError);
				});

				it("should reject since ID is not valid - whitespace", function () {
					const result = facade.removeDataset(" ");
					return expect(result).to.eventually.be.rejectedWith(InsightError);
				});

				it("should reject since ID is not valid - underscore", function () {
					const result = facade.removeDataset("asd_qwe");
					return expect(result).to.eventually.be.rejectedWith(InsightError);
				});


			});


			describe("removeDataset_assertions", function () {

				it("database removal, checking order of removal", async function () {
					await facade.addDataset("qwerty", sectionsLightSection, InsightDatasetKind.Sections);
					await facade.addDataset("qwerty2", sectionsLightSection, InsightDatasetKind.Sections);
					const result3 = await facade.listDatasets();
					expect(result3.length).to.equals(2);
					await facade.addDataset("qwerty3", sectionsLightSection, InsightDatasetKind.Sections);
					const result5 = await facade.listDatasets();
					expect(result5.length).to.equals(3);
					const result6 = await facade.removeDataset("qwerty2");
					expect(result6).to.equals("qwerty2");
					const result7 = await facade.listDatasets();
					expect(result7.length).to.equals(2);
					expect(result7[0].id).to.equals("qwerty");
					expect(result7[1].id).to.equals("qwerty3");
				});
			});
		});


		describe("calling listDataset before any dataset is added", async function () {

			try {
				const result = await facade.listDatasets();
			} catch (err) {
				console.log("error was thrown calling the method");
			}
		});

		// SYED: This test fails. Not sure what happens if listDataset is called when no dataset has been added
		it("list database when nothing has been added", async function () {
			const result = await facade.listDatasets();
			expect(result.length).to.equals(0);
		});

			// SYED: the async calls are not wrapped in try-catch
		it("listDataset after databases are added. Check return values (ID,KIND,ROWS)", async function () {
				// Adding one dataset
			const result = await facade.addDataset("qwerty", sections, InsightDatasetKind.Sections);
			const result2 = await facade.listDatasets();
			expect(result2.length).to.equals(1);
				// Check the elements inside the first array element of return value
			expect(result2[0].id).to.equals("qwerty");
			expect(result2[0].kind).to.equals("sections");
			expect(result2[0].numRows).to.equals(64612);
				// Adding second dataset
			const result4 = await facade.addDataset("qwerty2", sectionsLightSection, InsightDatasetKind.Sections);
			const result3 = await facade.listDatasets();
				// Check length and properties of returned array after two datasets added.
			expect(result3.length).to.equals(2);
			expect(result3[0].id).to.equals("qwerty");
			expect(result3[1].id).to.equals("qwerty2");
		});


	// describe("performQuery_errors_tested_manually", function () {

			// Moved this test to dynamic as well
			// // SYED: This test failed in the dynamic set so trying a manual version here.
			// it("Result too large error - manual version - async version", async function () {
			// 	try {
			// 		await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
			// 		const result = await facade.performQuery({
			// 			WHERE: {
			// 				GT: {
			// 					sections_avg: 1
			// 				}
			// 			},
			// 			OPTIONS: {
			// 				COLUMNS: [
			// 					"sections_dept",
			// 					"sections_avg"
			// 				],
			// 				ORDER: "sections_avg"
			// 			}
			// 		});
			// 	}  catch (err) {
			// 		expect(err).to.be.instanceof(ResultTooLargeError);
			// 	}
			// });

			// Syed: moved this to dynamic
		// 	it("should reject since incorrectly formatted query", function () {
		// 		const result = facade.addDataset("sections", sections, InsightDatasetKind.Sections).then(
		// 			() => facade.performQuery("asd"));
		//
		// 		return expect(result).to.eventually.be.rejectedWith(InsightError);
		// 	});
		// });


		describe("performQuery_asserts", function () {
			it("testing that performQuery returns the correct order", async function () {
				try {
					await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
					const result2 = await facade.performQuery({
						WHERE: {
							GT: {
								sections_avg: 98.75
							}
						},
						OPTIONS: {
							COLUMNS: [
								"sections_dept",
								"sections_avg"
							],
							ORDER: "sections_avg"
						}
					});

					expect(result2.length).to.equals(8);

					expect(result2).to.deep.equals([
						{
							sections_dept: "epse",
							sections_avg: 98.76
						},
						{
							sections_dept: "epse",
							sections_avg: 98.76
						},
						{
							sections_dept: "epse",
							sections_avg: 98.8
						},
						{
							sections_dept: "spph",
							sections_avg: 98.98
						},
						{
							sections_dept: "spph",
							sections_avg: 98.98
						},
						{
							sections_dept: "cnps",
							sections_avg: 99.19
						},
						{
							sections_dept: "math",
							sections_avg: 99.78
						},
						{
							sections_dept: "math",
							sections_avg: 99.78
						}
					]);

				} catch (err) {
					expect.fail("it shouldnt throw error");
				}
			});

			it("testing that performQuery returns the correct order - just function", async function () {
				try {
					await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
					const result2 = await facade.performQuery({
						WHERE: {
							GT: {
								sections_avg: 98.75
							}
						},
						OPTIONS: {
							COLUMNS: [
								"sections_dept",
								"sections_avg"
							],
							ORDER: "sections_avg"
						}
					});
				} catch (err) {
					expect.fail("it shouldnt throw error");
				}
			});

			it("testing that performQuery returns the correct order - just expect length", async function () {
				try {
					await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
					const result2 = await facade.performQuery({
						WHERE: {
							GT: {
								sections_avg: 98.75
							}
						},
						OPTIONS: {
							COLUMNS: [
								"sections_dept",
								"sections_avg"
							],
							ORDER: "sections_avg"
						}
					});

					expect(result2.length).to.equals(8);
				} catch (err) {
					expect.fail("it shouldnt throw error");
				}
			});


			it("testing that performQuery returns the correct order - to have deep members", async function () {
				try {
					await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
					const result2 = await facade.performQuery({
						WHERE: {
							GT: {
								sections_avg: 98.75
							}
						},
						OPTIONS: {
							COLUMNS: [
								"sections_dept",
								"sections_avg"
							],
							ORDER: "sections_avg"
						}
					});

					expect(result2.length).to.equals(8);

					expect(result2).to.have.deep.members([
						{
							sections_dept: "epse",
							sections_avg: 98.76
						},
						{
							sections_dept: "epse",
							sections_avg: 98.76
						},
						{
							sections_dept: "epse",
							sections_avg: 98.8
						},
						{
							sections_dept: "spph",
							sections_avg: 98.98
						},
						{
							sections_dept: "spph",
							sections_avg: 98.98
						},
						{
							sections_dept: "cnps",
							sections_avg: 99.19
						},
						{
							sections_dept: "math",
							sections_avg: 99.78
						},
						{
							sections_dept: "math",
							sections_avg: 99.78
						}
					]);

				} catch (err) {
					expect.fail("it shouldnt throw error");
				}
			});


		});
	});


	/*
	 * This test suite dynamically generates tests from the JSON files in test/resources/queries.
	 * You should not need to modify it; instead, add additional files to the queries directory.
	 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
	 */
	describe("PerformQuery Dynamic Folder Test Suite", () => {
		before(function () {
			console.info(`Before: ${this.test?.parent?.title}`);

			facade = new InsightFacade();

			// Load the datasets specified in datasetsToQuery and add them to InsightFacade.
			// Will *fail* if there is a problem reading ANY dataset.
			const loadDatasetPromises = [facade.addDataset("sections", sections, InsightDatasetKind.Sections)];

			return Promise.all(loadDatasetPromises);
		});

		after(function () {
			console.info(`After: ${this.test?.parent?.title}`);
			clearDisk();
		});

		type PQErrorKind = "ResultTooLargeError" | "InsightError";


		folderTest<unknown, Promise<InsightResult[]>, PQErrorKind>(
			"Dynamic InsightFacade PerformQuery tests",
			(input) => facade.performQuery(input),
			"./test/resources/queries",
			{


				assertOnResult: (actual, expected) => {
					// SYED: Assertion to check equality

					expect(actual).to.deep.equal(expected);
				},
				errorValidator: (error): error is PQErrorKind =>
					error === "ResultTooLargeError" || error === "InsightError",
				assertOnError: (actual, expected) => {
					// SYED: Assertion to check if actual error is of the expected type
					if (expected === "InsightError") {
						expect(actual).to.be.an.instanceOf(InsightError);
					} else {
						expect(actual).to.be.an.instanceOf(ResultTooLargeError);
					}
				},
			}
		);
	});
});
