
import { MockApi } from "./index";

const port = 3000;

async function main(): Promise<void> {
    const mockApi = new MockApi();
    await mockApi.start(port);

    console.log(`Mock API started at http://localhost:${port}`);
    mockApi.displayFixtures();
}

main()
    .catch(err => {
        console.error(`Failed with error:`);
        console.error(err && err.stack || err);
    });
