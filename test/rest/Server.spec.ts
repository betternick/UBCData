import Server from "../../src/rest/Server";
import InsightFacade from "../../src/controller/InsightFacade";
import {expect} from "chai";
import request, {Response} from "supertest";
import * as fs from "fs";
import {query} from "express";

describe("Server", () => {

	let facade: InsightFacade;
	let server: Server;
	let serverURL: string;
	let sections: any;
	let jsonQuery: object;

	before(async () => {
		sections = fs.readFileSync("./test/resources/archives/pair.zip");
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
		// TODO: start server here once and handle errors properly
		server.start().then(() => {
			console.log("Server Started");
		}).catch((error: Error) => {
			console.log("Server startup failed because " + error);
		});
	});

	after(async () => {
		// TODO: stop server here once!
		server.stop().then(() => {
			console.log("Server stopped");
		});
	});

	beforeEach(() => {
		// might want to add some process logging here to keep track of what's going on
	});

	afterEach(() => {
		// might want to add some process logging here to keep track of what's going on
	});

	// Sample on how to format PUT requests

	it("Successful PUT test for courses dataset", async () => {
		try {
			return request(serverURL)
				.put("/dataset/sections/sections")
				.send(sections)
				.set("Content-Type", "application/x-zip-compressed")
				.then((res: Response) => {
					expect(res.status).to.be.equal(200);
					// more assertions here
				})
				.catch((err) => {
					console.log(err);
					expect.fail();
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
					console.log(err);
					expect.fail();
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
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			console.log(err);
		}
	});
});
