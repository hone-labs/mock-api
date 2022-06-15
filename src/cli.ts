import { MockApi } from './index';
import * as minimist from "minimist";

async function main(): Promise<void> {

    let port = 1234;

    const argv = minimist(process.argv.slice(2));
    
    if (argv.port !== undefined)  {
        port = argv.port;
    }

    const mockApi = new MockApi();
    await mockApi.start(port);

    if (argv.fixture) {
        if (mockApi.setFixture(argv.fixture)) {
            console.log(`Set default fixture "${argv.fixture}".`);
        }
        else {
            console.log(`Failed to set default fixture "${argv.fixture}", this fixture doesn't exist.`);
        }
    }

    console.log(`Mock API started at http://localhost:${port}`);
    mockApi.displayFixtures();
}

main()
    .catch((err) => {
        console.error(`Failed with error:`);
        console.error((err && err.stack) || err);
    });
