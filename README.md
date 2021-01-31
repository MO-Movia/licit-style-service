# licit-style-service
![Last commit](https://img.shields.io/github/last-commit/MO-Movia/licit-style-service)
![Build Status](https://github.com/MO-Movia/licit-style-service/workflows/build/badge.svg?branch=main)
[![codecov](https://codecov.io/gh/MO-Movia/licit-style-service/branch/main/graph/badge.svg?token=40H9P8IZRC)](https://codecov.io/gh/MO-Movia/licit-style-service)
![depndencies](https://david-dm.org/MO-Movia/licit-style-service.svg)
![depndencies](https://david-dm.org/MO-Movia/licit-style-service/dev-status.svg)
[![License](https://shields.io/github/license/MO-Movia/licit-style-service)](./LICENSE)


Reference service for serving styles to licit editor

## Build / Run
While it can be built and run locally, the project is designed to be run in a docker container.

### Environment Variables
NAME|DEFAULT VALUE|DESCRIPTION
---|---|---
HTTP_PORT|3000|The HTTP port to listen on.
DATA_ROOT|/app/data|The folder where styles.json file will be stored.
LOG_LEVEL|info|The level of logging. Use 'debug' to increase logging, and 'warn' to decrease.
SAVE_SECONDS|30|The number of seconds to wait before saving in-memory data to disk.

### Building / Running Locally
```bash
# Install build dependencies.
npm ci
# Run all unit tests.
npm test
# Check code style.
npm run lint
# Compile the application.
npm run build

# Run the application.
# This command uses project folder to store styles.json
npm start
```

### Docker Deployment

A Dockerfile has been included in the project. To create the image run the appropriate docker command or use the supplied npm script

```bash
# create the style-service docker image
npm run docker

# Run the docker
docker run -d -p 3000:3000 --name style-service style-service:latest
```

The above docker command will not persist styles if the container is destroyed.  To save your styles map a docker volume to the container folder `/app/data`

## REST endpoint

The service exposes the following rest endpoints. See comments in api.ts for additional information.  A [Postman Collection](./postman_collection.json) is included with some sample requests.

### `GET /styles`

Retrieve all styles from the service. See [style.ts](./src/style/ts) for more information about a style.

#### JSON Response:

```json
[
  {
    "styleName": "my-style",
    "mode": 1,
    "description": "sample style",
    "styles": {
      "fontSize": "72pt",
      ...
    }
  },
  ...
]
```

---

### `POST /style`

Add a new style or replace an existing style.

#### JSON Request:

```json
{
  "styleName": "my-style",
  "mode": 1,
  "description": "sample style",
  "styles": {
    "fontSize": "72pt",
    ...
  }
}
```
#### JSON Response:

``` json
{
  "statusCode": 200,
  "message": "OK",
  "location": "/styles/my-style"
}
```

---

### `GET /styles/:styleName`

Gets a single style from the service.

#### JSON Response:

``` json
{
  "styleName": "my-style",
  "mode": 1,
  "description": "sample style",
  "styles": {
    "fontSize": "72pt",
    ...
  }
}
```

---

### `DELETE /styles/:styleName`

Removes a single style from the service.

#### Response:

```
204 No Content
```

---

### `PATCH /styles/rename`

Renames an existing style on the service.

#### JSON Request:

```json
{
  "oldName": "my-style",
  "newName": "my-renamed-style"
}
```

#### Response

```
204 No Content
```

---

### `PATCH /styles/import`

Adds multiple styles to the service.  If `replace` is truthy, all styles will be replaced.

#### JSON Request:

```json
{
  "replace": false,
  "styles": [
    {
      "styleName": "my-style",
      "mode": 1,
      "description": "very cool",
      "styles": {
        "fontSize": "72pt",
        ...
      }
    }
  ]
}
```

## REST endpoint (deprecated)
These endpoints still exist for backward compatibility, however they will be removed once licit is configured to use them.

### `GET /getcustomstyles/`

Gets array of all styles from service.

---

### `POST /savecustomstyle/`

Adds a new style to the service

---

### `POST /renamecustomstyle/`

Renames an existing style.

---

### `POST /removecustomstyle/`

Removes an existing style.

---

### `POST /bulk-import/`

Import collection of styles.

---
### `POST /bulk-export/`

Export collection of styles.
