import * as express from "express";
import  * as fs from "fs-extra";
import { networkInterfaces } from "os";
import * as path from "path";

//
// Class that represents the mock API.
//
export class MockApi {
    
    //
    // The Express app object.
    //
    private app?: express.Express;
    
    //
    // Lookup table for all fixtures.
    //
    private fixturesMap: any;

    //
    // The name of the currently loaded fixture.
    //
    private loadedFixtureName?: string;
    
    //
    // The currently loaded fixture.
    //
    private loadedFixture?: any;

    //
    // The port number the server is running on.
    //
    private port?: number;

    //
    // Normalizes a URL for comparison.
    //
    private normalizeUrl(url: string): string {
        let normalized = url.replace(/\\/g, "/");
        if (normalized[normalized.length-1] !== "/") {
            normalized += "/"; // Always add a trailing slash.
        }
        return normalized;
    }

    //
    // Recursively loads api fixtures from the file system.
    //
    private async loadFixture(fixturePath: string, apiPath: string, fixtureMap: any): Promise<void> {
        const items = await fs.readdir(fixturePath);
        
        for (const item of items) {
            const itemPath = path.join(fixturePath, item);
            if ((await fs.lstat(itemPath)).isDirectory()) {
                const nestedApiPath = path.join(apiPath, item);
                await this.loadFixture(itemPath, nestedApiPath, fixtureMap);
            }
            else {
                if (item === "response.json") {
                    const normalizedApiPath = this.normalizeUrl(apiPath);
                    fixtureMap[normalizedApiPath] = {
                        jsonResponse: JSON.parse(await fs.readFile(itemPath, "utf8")),
                    };
                }
            }
        }
    }

    //
    // Load fixtures from the file system.
    //
    private async loadFixtures() {
        const fixtures = await fs.readdir("fixtures");
        const fixturesMap: any = {};
        for (const fixtureName of fixtures) {
            const fixtureMap = {};
            fixturesMap[fixtureName] = fixtureMap;
            await this.loadFixture(path.join("fixtures", fixtureName), "/", fixtureMap);
        }
        return fixturesMap;
    }

    //
    // Matches a url to find a fixture.
    // Returns the fixture's reponse if there is one, otherwise it returns undefined.
    //
    private matchUrl(url: string, fixtureName: string, loadedFixture: any): any {
        url = this.normalizeUrl(url);

        const match = loadedFixture[url];
        if (match && match.jsonResponse) {
            console.log(`Matched ${url} and found a JSON response.`);
            return match.jsonResponse;
        }
        else {
            console.log(`Failed to match ${url} against route table for fixture ${fixtureName}:`);
            this.displayFixture(loadedFixture);
            return undefined;
        }

    }

    //
    // Displays all fixtures.
    //
    public displayFixtures(): void {
        for (const [fixtureName, fixture] of Object.entries(this.fixturesMap)) {
            console.log(`== Fixture ${fixtureName}`);
            console.log(`To load this fixture click: http://localhost:${this.port}/load-fixture?name=${fixtureName}`);
            this.displayFixture(fixture);
        }
    }

    //
    // Displays the fixture.
    //
    private displayFixture(fixture: any) {
        console.log(JSON.stringify(fixture, (key, value) => {
            if (key === "jsonResponse") {
                return "...";
            }
            else {
                return value;
            }
        }, 4));
    }

    //
    // Starts the mock API server.
    //
    async start(port: number): Promise<void> {
        if (this.app !== undefined) {
            throw new Error(`Server already started.`);
        }

        this.app = express();

        this.fixturesMap = await this.loadFixtures();

        this.app.use((req, res, next) => {
            if (!this.loadedFixture) {
                console.warn(`No fixture is loaded, use the "http://localhost:${this.port}/load-fixture?name=<fixture-name>" route to load a particular fixture.`);
            }
            else {
                const response = this.matchUrl(req.url, this.loadedFixtureName!, this.loadedFixture);
                if (response) {
                    res.json(response);
                    return;
                }
            }

            next();
        });

        this.app.get("/load-fixture", (req, res) => {
            if (!req.query.name) {
                res.send(`Expected query parameter "name=<fixture-name>"`).status(400);
                return;
            }
            
            const fixtureName = req.query.name as string;
            const fixture = this.fixturesMap[fixtureName];
            if (fixture === undefined) {
                const message = `Failed to load fixture '${fixtureName}', a fixture with this name doesn't exist.`;
                console.error(message);
                res.json({
                        message: message + ` See below for valid fixtures.`,
                        fixtures: this.fixturesMap,   
                    })
                    .status(400);
                    return;
            }

            this.loadedFixture = fixtureName;
            this.loadedFixture = fixture;
            res.json({ 
                    message: `Loaded fixture ${fixtureName}`,
                })
                .status(200);
        });

        this.app.use((req, res, next) => {
            if (!this.loadedFixture) {
                res.json({
                    message: `No fixture is loaded, so failed to match incoming route '${req.url}'. See valid fixtures below.`,
                    fixtures: this.fixturesMap,   
                });
            }
            else {
                res.json({
                    message: `Failed to match incoming route '${req.url}' against any route any fixture ${this.loadedFixtureName}. See valid routes below.`,
                    fixtures: this.loadedFixture,   
                });
            }
        });

        await startExpress(this.app, port);

        this.port = port;
    }
}

//
// A helper function to start Express.
//
function startExpress(app: express.Express, port: number): Promise<void> {
    return new Promise<void>(resolve => {
        app.listen(port, () => {
            resolve();
        });
    });
}