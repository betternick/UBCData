// import {
// 	IInsightFacade,
// 	InsightDatasetKind,
// 	InsightError,
// 	InsightResult,
// 	NotFoundError,
// 	ResultTooLargeError,
// } from "../../src/controller/IInsightFacade";
// import InsightFacade from "../../src/controller/InsightFacade";
//
// import {folderTest} from "@ubccpsc310/folder-test";
// import {expect, use} from "chai";
// import chaiAsPromised from "chai-as-promised";
// import {clearDisk, getContentFromArchives} from "../TestUtil";
//
// use(chaiAsPromised);
//
// describe("InsightFacade", function () {
// 	let facade: IInsightFacade;
//
// 	// Declare datasets used in tests. You should add more datasets like this!
// 	let sections: string;
// 	// SYED: Additional sections added for testing
// 	let sectionsTextFile: string;
// 	let sectionsEmptyFile: string;
// 	let sectionsInvalidSection: string;
// 	// SYED: The following section only has the first 15 courses from pair
// 	let sectionsLightSection: string;
//
// 	before(function () {
// 		// This block runs once and loads the datasets.
// 		sections = getContentFromArchives("pair.zip");
// 		// SYED: Instantiating sections
// 		sectionsTextFile = getContentFromArchives("textFile.rtf");
// 		sectionsEmptyFile = getContentFromArchives("pairEmpty.zip");
// 		sectionsInvalidSection = getContentFromArchives("pairInvalidSection.zip");
// 		sectionsLightSection = getContentFromArchives("pairLight.zip");
// 		// Just in case there is anything hanging around from a previous run of the test suite
// 		clearDisk();
// 	});
//
// 	describe("Add/Remove/List Dataset", function () {
// 		before(function () {
// 			console.info(`Before: ${this.test?.parent?.title}`);
// 		});
//
// 		beforeEach(function () {
// 			// SYED: adding the below to see if maybe fixes cause for flaky tests
// 			clearDisk();
// 			// This section resets the insightFacade instance
// 			// This runs before each test
// 			console.info(`BeforeTest: ${this.currentTest?.title}`);
// 			facade = new InsightFacade();
// 		});
//
// 		after(function () {
// 			console.info(`After: ${this.test?.parent?.title}`);
// 		});
//
// 		afterEach(function () {
// 			// This section resets the data directory (removing any cached data)
// 			// This runs after each test, which should make each test independent of the previous one
// 			console.info(`AfterTest: ${this.currentTest?.title}`);
// 			clearDisk();
// 		});
//
// 		describe("addDataset tests", function () {
// 			describe("addDataset_ID_errors", function () {
// 				it("should reject with an empty dataset id", function () {
// 					const result = facade.addDataset("", sectionsLightSection, InsightDatasetKind.Sections);
// 					return expect(result).to.eventually.be.rejectedWith(InsightError);
// 				});
//
// 				it("should reject with an whitespace id", function () {
// 					const result = facade.addDataset(" ", sectionsLightSection, InsightDatasetKind.Sections);
// 					return expect(result).to.eventually.be.rejectedWith(InsightError);
// 				});
//
// 				it("should reject because of an _ in the id", function () {
// 					const result = facade.addDataset("qwerty_123", sectionsLightSection, InsightDatasetKind.Sections);
// 					return expect(result).to.eventually.be.rejectedWith(InsightError);
// 				});
// 			});
//
// 			describe("addDataset_content_errors", function () {
// 				it("should reject due to a non-zip source file", function () {
// 					// let sections_text: string;
// 					// sections_text = getContentFromArchives("textFile.rtf");
// 					const result = facade.addDataset("qwerty", sectionsTextFile, InsightDatasetKind.Sections);
// 					return expect(result).to.eventually.be.rejectedWith(InsightError);
// 				});
//
// 				it("should reject due to an empty zip source file", function () {
// 					const result = facade.addDataset("qwerty", sectionsEmptyFile, InsightDatasetKind.Sections);
// 					return expect(result).to.eventually.be.rejectedWith(InsightError);
// 				});
//
// 				it("should reject due to one section that is invalid in the zip source file", function () {
// 					const result = facade.addDataset("qwerty", sectionsInvalidSection, InsightDatasetKind.Sections);
// 					// console.log(InsightError);
// 					return expect(result).to.eventually.be.rejectedWith(InsightError);
// 				});
// 			});
//
// 			describe("Other_addDataset_errors", function () {
// 				it("should reject due to attempting to add a Rooms kind", function () {
// 					const result = facade.addDataset("qwerty", sectionsLightSection, InsightDatasetKind.Rooms);
// 					return expect(result).to.eventually.be.rejectedWith(InsightError);
// 				});
//
// 				it("should reject due to a duplicate add chai-as-promised V2", function () {
// 					const result = facade
// 						.addDataset("qwerty", sectionsLightSection, InsightDatasetKind.Sections)
// 						.then(() => facade.addDataset("qwerty", sectionsLightSection, InsightDatasetKind.Sections));
//
// 					expect(result).to.eventually.be.rejectedWith(InsightError);
// 					// return expect(result2).to.eventually.be.rejectedWith(InsightError);
// 				});
// 			});
//
// 			describe("addDataset_assertions", function () {
// 				it("database should be successfully added", async function () {
// 					const result = await facade.addDataset("qwerty", sectionsLightSection, InsightDatasetKind.Sections);
// 					expect(result.length).to.equals(1);
// 					expect(result[0]).to.equals("qwerty");
// 					const len2 = await facade.listDatasets();
// 					expect(len2.length).to.equals(1);
// 				});
//
// 				it("second database should be successfully added", async function () {
// 					try {
// 						const result = await facade.addDataset("qw", sectionsLightSection, InsightDatasetKind.Sections);
// 						const len0 = await facade.listDatasets();
// 						expect(len0.length).to.equals(1);
// 						const result2 = await facade.addDataset(
// 							"qw2",
// 							sectionsLightSection,
// 							InsightDatasetKind.Sections
// 						);
// 						expect(result2.length).to.equals(2);
// 						const len1 = await facade.listDatasets();
// 						expect(len1.length).to.equals(2);
// 						expect(result2[0]).to.equals("qw");
// 						expect(result2[1]).to.equals("qw2");
// 					} catch (err) {
// 						console.error(err);
// 						expect.fail("Should not have rejected!");
// 						//  expect(err).to.be.instanceof(TooSimple);
// 					}
// 				});
// 			});
// 		});
//
// 		describe("removeDataset", function () {
// 			describe("removeDataset_errors", function () {
// 				it("should reject since no dataset is added", function () {
// 					const result = facade.removeDataset("asd");
// 					return expect(result).to.eventually.be.rejectedWith(NotFoundError);
// 				});
//
// 				it("should reject since dataset was already removed", function () {
// 					const result = facade
// 						.addDataset("qwerty", sectionsLightSection, InsightDatasetKind.Sections)
// 						.then(() => facade.removeDataset("qwerty"))
// 						.then(() => facade.removeDataset("qwerty"));
// 					return expect(result).to.eventually.be.rejectedWith(NotFoundError);
// 				});
//
// 				it("should reject since ID is not valid - whitespace", function () {
// 					const result = facade.removeDataset(" ");
// 					return expect(result).to.eventually.be.rejectedWith(InsightError);
// 				});
//
// 				it("should reject since ID is not valid - underscore", function () {
// 					const result = facade.removeDataset("asd_qwe");
// 					return expect(result).to.eventually.be.rejectedWith(InsightError);
// 				});
// 			});
//
// 			describe("removeDataset_assertions", function () {
// 				it("database removal, checking order of removal", async function () {
// 					await facade.addDataset("qwerty", sectionsLightSection, InsightDatasetKind.Sections);
// 					await facade.addDataset("qwerty2", sectionsLightSection, InsightDatasetKind.Sections);
// 					const result3 = await facade.listDatasets();
// 					expect(result3.length).to.equals(2);
// 					await facade.addDataset("qwerty3", sectionsLightSection, InsightDatasetKind.Sections);
// 					const result5 = await facade.listDatasets();
// 					expect(result5.length).to.equals(3);
// 					const result6 = await facade.removeDataset("qwerty2");
// 					expect(result6).to.equals("qwerty2");
// 					const result7 = await facade.listDatasets();
// 					expect(result7.length).to.equals(2);
// 					expect(result7[0].id).to.equals("qwerty");
// 					expect(result7[1].id).to.equals("qwerty3");
// 				});
// 			});
// 		});
//
// 		it("list dataset when nothing has been added", async function () {
// 			const result = await facade.listDatasets();
// 			expect(result.length).to.equals(0);
// 		});
//
// 		// SYED: the async calls are not wrapped in try-catch
// 		it("listDataset after datasets are added. Check return values (ID,KIND,ROWS)", async function () {
// 			// Adding one dataset
// 			const result = await facade.addDataset("qwertyList", sections, InsightDatasetKind.Sections);
// 			const result2 = await facade.listDatasets();
// 			expect(result2.length).to.equals(1);
// 			// Check the elements inside the first array element of return value
// 			expect(result2[0].id).to.equals("qwertyList");
// 			expect(result2[0].kind).to.equals("sections");
// 			expect(result2[0].numRows).to.equals(64612);
// 			// Adding second dataset
// 			const result4 = await facade.addDataset("qwerty2List", sectionsLightSection, InsightDatasetKind.Sections);
// 			const result3 = await facade.listDatasets();
// 			// Check length and properties of returned array after two datasets added.
// 			expect(result3.length).to.equals(2);
// 			expect(result3[0].id).to.equals("qwertyList");
// 			expect(result3[1].id).to.equals("qwerty2List");
// 		});
// 	});
//
// 	/*
// 	 * This test suite dynamically generates tests from the JSON files in test/resources/queries.
// 	 * You should not need to modify it; instead, add additional files to the queries directory.
// 	 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
// 	 */
// 	describe("PerformQuery Dynamic Folder Test Suite", () => {
// 		before(function () {
// 			// SYED: added the below to see if fixes flakiness
// 			clearDisk();
// 			console.info(`Before: ${this.test?.parent?.title}`);
//
// 			facade = new InsightFacade();
//
// 			// Load the datasets specified in datasetsToQuery and add them to InsightFacade.
// 			// Will *fail* if there is a problem reading ANY dataset.
// 			const loadDatasetPromises = [facade.addDataset("sections", sections, InsightDatasetKind.Sections)];
//
// 			return Promise.all(loadDatasetPromises);
// 		});
//
// 		after(function () {
// 			console.info(`After: ${this.test?.parent?.title}`);
// 			clearDisk();
// 		});
//
// 		type PQErrorKind = "ResultTooLargeError" | "InsightError";
//
// 		// SYED: Folder test for ORDERED queries
// 		folderTest<unknown, Promise<InsightResult[]>, PQErrorKind>(
// 			"Dynamic InsightFacade PerformQuery tests",
// 			(input) => facade.performQuery(input),
// 			"./test/resources/queries",
// 			{
// 				assertOnResult: (actual, expected) => {
// 					// SYED: Assertion to check equality
//
// 					expect(actual).to.deep.equal(expected);
// 				},
// 				errorValidator: (error): error is PQErrorKind =>
// 					error === "ResultTooLargeError" || error === "InsightError",
// 				assertOnError: (actual, expected) => {
// 					// SYED: Assertion to check if actual error is of the expected type
// 					if (expected === "InsightError") {
// 						expect(actual).to.be.an.instanceOf(InsightError);
// 					} else {
// 						expect(actual).to.be.an.instanceOf(ResultTooLargeError);
// 					}
// 				},
// 			}
// 		);
//
// 		// SYED: Folder test for UNORDERED queries
// 		folderTest<unknown, Promise<InsightResult[]>, PQErrorKind>(
// 			"Dynamic InsightFacade PerformQuery tests",
// 			(input) => facade.performQuery(input),
// 			"./test/resources/unorderedQueries",
// 			{
// 				assertOnResult: (actual, expected: any) => {
// 					// SYED: Assertion to check equality
//
// 					expect(actual).to.have.deep.members(expected);
// 				},
// 				errorValidator: (error): error is PQErrorKind =>
// 					error === "ResultTooLargeError" || error === "InsightError",
// 				assertOnError: (actual, expected) => {
// 					// SYED: Assertion to check if actual error is of the expected type
// 					if (expected === "InsightError") {
// 						expect(actual).to.be.an.instanceOf(InsightError);
// 					} else {
// 						expect(actual).to.be.an.instanceOf(ResultTooLargeError);
// 					}
// 				},
// 			}
// 		);
// 	});
// });
