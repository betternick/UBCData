import Server from "../../src/rest/Server";
import InsightFacade from "../../src/controller/InsightFacade";
import {expect} from "chai";
import request, {Response} from "supertest";
import * as fs from "fs";
import {clearDisk} from "../TestUtil";
import {InsightDataset, InsightDatasetKind} from "../../src/controller/IInsightFacade";


describe("Server", () => {

	let facade: InsightFacade;
	let server: Server;
	let serverURL: string;
	let sections: any;
	let sections3Course: any;
	let jsonQuery: object;

	before(async () => {
		sections = fs.readFileSync("./test/resources/archives/pair.zip");
		sections3Course = fs.readFileSync("./test/resources/archives/pair3CoursesOnly.zip");
		serverURL = "http://localhost:4321";
		jsonQuery = {
			WHERE: {
				IS: {
					sections_title: "strctr bond chem"
				}
			},
			OPTIONS: {
				COLUMNS: [
					"sections_dept",
					"sections_avg"
				],
				ORDER: "sections_avg"
			}
		};

		facade = new InsightFacade();
		server = new Server(4321);
		server.start().then(() => {
			console.log("Server Started");
		}).catch((error: Error) => {
			console.log("Server startup failed because " + error);
		});
	});

	after(async () => {
		server.stop().then(() => {
			console.log("Server stopped");
		});
	});

	beforeEach(() => {
		// might want to add some process logging here to keep track of what's going on
		clearDisk();
	});

	afterEach(() => {
		// might want to add some process logging here to keep track of what's going on
	});

	it("Successful PUT test for courses dataset", async () => {
		try {
			return request(serverURL)
				.put("/dataset/sections/sections")
				.send(sections)
				.set("Content-Type", "application/x-zip-compressed")
				.then((res: Response) => {
					expect(res.status).to.be.equal(200);
				})
				.catch((err) => {
					expect.fail(err);
				});
		} catch (err) {
			console.log(err);
		}
	});

	it("Failure PUT test for courses dataset - wrong kind", async () => {
		try {
			return request(serverURL)
				.put("/dataset/sections2/sec")
				.send(sections)
				.set("Content-Type", "application/x-zip-compressed")
				.then((res: Response) => {
					expect(res.status).to.be.equal(400);
					// more assertions here
				})
				.catch((err) => {
					expect.fail(err);
				});
		} catch (err) {
			console.log(err);
		}
	});

	it("Successful DEL test for courses dataset", async () => {
		try {
			await request(serverURL)
				.put("/dataset/sections3Course/sections")
				.send(sections3Course)
				.set("Content-Type", "application/x-zip-compressed");

			return request(serverURL)
				.delete("/dataset/sections3Course")
				.then((res: Response) => {
					expect(res.status).to.be.equal(200);
					expect(res.body.result).to.be.equal("sections3Course");
				}).catch((err) => {
					expect.fail(err);
				});
		} catch (err) {
			console.log(err);
		}
	});

	it("Failure (InsightError) DEL test for courses dataset", async () => {
		try {
			return request(serverURL)
				.delete("/dataset/sections_3Course")
				.then((res: Response) => {
					expect(res.status).to.be.equal(400);
				}).catch((err) => {
					expect.fail(err);
				});
		} catch (err) {
			console.log(err);
		}
	});

	it("Failure (NotFoundError) DEL test for courses dataset", async () => {
		try {
			return request(serverURL)
				.delete("/dataset/sections3Course")
				.then((res: Response) => {
					expect(res.status).to.be.equal(404);
				}).catch((err) => {
					expect.fail(err);
				});
		} catch (err) {
			console.log(err);
		}
	});

	it("Successful POST test for courses dataset", async () => {
		try {
			return request(serverURL)
				.post("/query")
				.send(jsonQuery)
				.then((res: Response) => {
					expect(res.status).to.be.equal(200);
					// more assertions here
				})
				.catch((err) => {
					expect.fail(err);
				});
		} catch (err) {
			console.log(err);
		}
	});

	it("Failure POST test for courses dataset", async () => {
		try {
			return request(serverURL)
				.post("/query")
				.send("jsonQuery")
				.then((res: Response) => {
					expect(res.status).to.be.equal(400);
					// more assertions here
				})
				.catch((err) => {
					expect.fail(err);
				});
		} catch (err) {
			console.log(err);
		}
	});

	it("Successful GET test for courses dataset", async () => {
		try {
			return request(serverURL)
				.get("/datasets")
				.then((res: Response) => {
					let expected: InsightDataset = {
						id: "sections",
						kind: InsightDatasetKind.Sections,
						numRows: 64612};
					let expectedArr: InsightDataset[] = [expected];
					expect(res.status).to.be.equal(200);
					expect(res.body.result).to.deep.equal(expectedArr);

				})
				.catch((err) => {
					expect.fail(err);
				});
		} catch (err) {
			console.log(err);
		}
	});
});

