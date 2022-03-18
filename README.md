# mock-rest-api

Creates a mock REST API from JSON files.

Used to mock dependencies of frontends and backends for testing.

The dataset that is returned by the mock API is called an API fixture and is the same sort of concept as a database fixture.

# Usage

You need Node.js installed to use mock-api.

## Global usage

Install mock-api globally:

```bash
npm install --global @optio-labs/mock-api
```

Change directory to the project for your mock API.

Run the mock-api server:

```bash
mock-api
```

## Local usage

Change directory to the Node.js project for your mock API.

Install mock-api in your project:

```bash
npm install --save @optio-labs/mock-api
```

Run the mock-api server:

```bash
mock-api
```

## Creating API fixtures

Create API fixtures under the `fixtures` directory in your project.

Each subdirectory under `fixtures` is a named fixture, for example:

- `fixtures`
    - `first-fixture`
      - ...
    - `second-fixture`
      - ...
    - etc...

Under each fixture are nested subdirectories that create routes in the mock API, for example:

- `first-fixture`
  - `nested-route`
    - `deeper-route`

Under each route directory create a file `response.json` to create a mock JSON response for that route. for example:

`first-fixture/nested-route/deeper-route/response.json`:

```json
{
    "msg": "Hello world!"
}
```

## Loading fixtures

A named fixture is loaded by invoking the mock-api route `load-fixture`.

You can invoke it your browser, for example to load `first-fixture` open a browser tab and open http://localhost:3000/load-fixture?name=first-fixture.

Alternatively you can use Postman or VS Code REST Client to invoke that route.

Or for the purposes of automated testing (say, using Jest) you could use something like Axios to invoke the route. That means you can make a helper function like the following to load fixtures before running tests:

```typescript
import axios from "axios";

//
// Loads a named API fixture.
//
export function loadFixture(fixtureName: string): Promise<void> {
    await axios.get(`http://localhost:3000/load-fixture?name=${fixtureName}`);
}
```

## Development

Clone this repo.

Install dependencies:

```bash
cd mock-api
pnpm install
```

Run in development mode:

```bash
npm run start:dev
```

Run tests:

```bash
npm test
```

Run in prod mode:

```bash
npm run build
npm start
```