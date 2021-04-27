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
$ npm run redis
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

## MODOS DE USO

Open http://localhost:3001/api/v1 for information about the available data available.<br /><br />
"/api/v1/:pair": "Available timeframes for a pair."<br />
"/api/v1/:pair/:frame": "Atomic elements available for a pair on a timeframe."<br />
"/api/v1/:pair/:frame/:atom": "Data for an individual atom for a pair in a timeframe."<br />
"/api/v1/:pair/:frame/:atom/:span": "Data for the $span preceding elements since an atom."<br />
"/api/v1/:pair/:frame/:atom/:span/RSI": "RSI Technical Analysis for a Data Span."<br />
"/api/v1/:pair/:frame/:atom/:span/AS": "Average Spread Technical Analysis for a Data Span."<br />
"/api/v1/:pair/:frame/:atom/:span/STEMA": "Short Term EMA Technical Analysis for a Data Span."<br />
"/api/v1/:pair/:frame/:atom/:span/LTEMA": "Long Term EMA Technical Analysis for a Data Span."<br />
"/api/v1/:pair/:frame/:atom/:span/SMA": "Simple Moving Average Technical Analysis for a Data Span."<br />
"/api/v1/:pair/:frame/:atom/:span/MACD": "Moving Average Convergence Divergence Technical Analysis for a Data Span."<br />

## Examples

Please activate the demo before using this links:<br /><br />
<a href="http://localhost:3001/api/v1/BTCUSD">Períodos de tiempo disponible para BTCUSD.</a><br />
<a href="http://localhost:3001/api/v1/BTCUSD/1d/1619049600000/1">Un elemento de BTCUSD con fecha "1619049600000" (millis) y período 1d.</a><br />
<a href="http://localhost:3001/api/v1/BTCUSD/1d/1619049600000/10">10 elementos de BTCUSD precediendo 1619049600000.</a><br />
<a href="http://localhost:3001/api/v1/BTCUSD/1d/1619049600000/100">100 elementos de BTCUSD precediendo 1619049600000.</a><br />
<a href="http://localhost:3001/api/v1/BTCUSD/1d/1619049600000/100/RSI">RSI aplicado a 100 elementos de BTCUSD precediendo 1619049600000.</a><br />
<a href="http://localhost:3001/api/v1/BTCUSD/1d/1619049600000/100/STEMA">EMA de corto plazo aplicado a 100 elementos de BTCUSD precediendo 1619049600000.</a><br />
<a href="http://localhost:3001/api/v1/BTCUSD/1d/1619049600000/140/MACD">MACD aplicado a 140 elementos de BTCUSD precediendo 1619049600000.</a><br />

## LAST BUT NOT LEAST : TODO 

- [ ] Unit Tests

## Stay in touch

- Author - [Diego Correa T.](https://labormedia.cl)

## License

[MIT licensed](LICENSE).
