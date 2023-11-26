# licit-style-service
![Last commit](https://img.shields.io/github/last-commit/MO-Movia/licit-style-service)
![Build Status](https://github.com/MO-Movia/licit-style-service/workflows/build/badge.svg?branch=main)
[![Coverage](https://codecov.io/gh/MO-Movia/licit-style-service/branch/main/graph/badge.svg?token=40H9P8IZRC)](https://codecov.io/gh/MO-Movia/licit-style-service)
[![License](https://shields.io/github/license/MO-Movia/licit-style-service)](./LICENSE)


Reference service for serving styles to licit editor

## Build / Run
While it can be built and run locally, the project is designed to be run in a docker container.

### Environment Variables

| Name                | Default   | Description                                                          |
| ------------------- | --------- | -------------------------------------------------------------------- |
| HTTP_PORT           | 3000      | Listen port.                                                         |
| DATA_ROOT           | /app/data | Folder where styles.json is stored.                                  |
| SAVE_SECONDS        | 60        | The number of seconds to wait before saving in-memory data to disk   |
| REQUESTS_PER_MINUTE | 60        | Configures rate limiting.                                            |
| LOG_LEVEL           | info      | Log level. Other options debug or warn                               |

### Building / Running Locally
```shell
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

```shell
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

### `GET /status`

Adds simple status check to service.  Returns number of styles.

#### Response
```
200 OK

{ size: 999 }
```
