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
            console.log(JSON.stringify(loadedFixture, (key, value) => {
                if (key === "jsonResponse") {
                    return "...";
                }
                else {
                    return value;
                }
            }, 4));
            return undefined;
        }

    }

    //
    // Starts the mock API server.
    //
    async start(port: number): Promise<void> {
        if (this.app !== undefined) {
            throw new Error(`Server already started.`);
        }

        this.app = express();

        const fixturesMap: any = await this.loadFixtures();

        console.log(fixturesMap);

        const fixtureName = "my-first-fixture";
        const loadedFixture = fixturesMap[fixtureName];

        this.app.use((req, res, next) => {
            const response = this.matchUrl(req.url, fixtureName, loadedFixture);
            if (response) {
                res.json(response);
            }
            else {
                res.json({
                    message: `Failed to match route "${req.url}" against any fixture. See valid fixtures below.`,
                    fixtures: fixturesMap,   
                });
            }
        });

        await startExpress(this.app, port);
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