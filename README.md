<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo_text.svg" width="320" alt="Nest Logo" /></a>
</p>

## Description

Proof of concept of a technical analysis service using nestjs and redis with docker.

## Requirements

Docker
Ports localhost:3001 and localhost:6379 available.

## Installation

Install dependencies, deploy redis and populate data.

```bash
$ npm install
$ npm redis
$ npm run populate
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## TODO

Unit Test

## Stay in touch

- Author - [Diego Correa T.](https://labormedia.cl)

## License

[MIT licensed](LICENSE).
