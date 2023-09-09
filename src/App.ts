import Server from "./rest/Server";

/**
 * Main app class that is run with the node command. Starts the server.
 */
export class App {
	// public initServer(port: number) {
	// 	console.info(`App::initServer( ${port} ) - start`);
	//
	// 	const server = new Server(port);
	// 	return server.start().then(() => {
	// 		console.info("App::initServer() - started");
	// 	}).catch((err: Error) => {
	// 		console.error(`App::initServer() - ERROR: ${err.message}`);
	// 	});
	// }

	public initServer() {
		console.info("App::initServer() - start");

		// Use the PORT environment variable, or 4321 if it's not set
		const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4321;

		const server = new Server(port);
		return server.start().then(() => {
			console.info(`App::initServer() - started on port ${port}`);
		}).catch((err: Error) => {
			console.error(`App::initServer() - ERROR: ${err.message}`);
		});
	}
}

// This ends up starting the whole system and listens on a hardcoded port (4321)
console.info("App - starting");
const app = new App();
(async () => {
	await app.initServer();
})();
