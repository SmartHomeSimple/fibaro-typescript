# fibaro-typescript

TypeScript SDK client for the Fibaro Home Center API.

## Install

```bash
npm install fibaro-typescript
```

## Package usage

```ts
import { client, getDevices } from 'fibaro-typescript';

client.setConfig({
  baseUrl: 'http://YOUR-HC3-IP/api',
});

const devices = await getDevices();
```

## Prerequisites

- Node.js 18+ (uses built-in `fetch`)

## Usage

Install dependencies (none required currently):

```bash
npm install
```

Download all swagger files into the default `swagger` folder:

```bash
npm run download:swagger
```

Download into a custom folder:

```bash
npm run download:swagger -- ./swagger-files
```

Use a custom base URL:

```bash
FIBARO_SWAGGER_BASE_URL=http://192.168.1.35/assets/docs/hc npm run download:swagger
```

## SDK generation

Merge all downloaded OpenAPI files and generate the TypeScript client:

```bash
npm run generate
```

Generated files are written to [src/](src/).

## Build package

```bash
npm run build
```

Build artifacts are emitted to [dist/](dist/).

## Publish

```bash
npm login
npm publish
```

## Examples

A simple example is available in [examples/get-devices.ts](examples/get-devices.ts).

1. Fill in [.env](.env):

```env
FIBARO_BASE_URL=http://192.168.1.35/api
FIBARO_USERNAME=admin
FIBARO_PASSWORD=your-password-here
```

2. Run the example:

```bash
npm run example:get-devices
```

The script will authenticate against HC3 and print the result of `getDevices()`.
