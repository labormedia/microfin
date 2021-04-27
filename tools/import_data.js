var fs = require('fs')
const { Transform } = require('stream')
const redis = require('redis').createClient()

const transformer = new Transform({
  transform(chunk, encoding, callback) {
    this.push(
      JSON.stringify(
        chunk.toString().split('\r\n')
        .map( x => x.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g))
        // .filter( x => x != null )
        .map( x => x.map( y => y.replace(/"|%|,|'/g, '')))
        .map( (x,i) => i == 0 ? x : [Date.parse(x.shift()).toString()].concat(x))
      )
    )
    callback();
  }
});

const toRedis = (pair, timeunit) => new Transform({
  transform(chunk, encoding, callback) {
    var data = JSON.parse(chunk)
    const schema = data.shift()
    const prepend = pair+":"+timeunit
    const key = prepend+":schema"
    redis.sadd("v1:pairs", pair)
    redis.rpush(pair, timeunit)
    redis.set(key, schema.toString())
    this.push(
      JSON.stringify(
        data
          .map( (x) => {
            const time = x.shift()
            redis.rpush(prepend, parseInt(time))
            redis.zadd(prepend+":history", time, x.toString())
            return x
          }
        )
      )
    )
    callback();
  }
});


// const writeStream = fs.createWriteStream('../data/parsed.json');

const file = process.argv[2] ? process.argv[2] : '../data/bitcoin_historical.csv'
const argPair = process.argv[3] ? process.argv[3] : 'BTCUSD'
const argFrame = process.argv[4] ? process.argv[4] : '1d'
const readstream = fs.createReadStream(file)
readstream.pipe(transformer)
  .pipe(toRedis(argPair, argFrame))
  // .pipe(writeStream)

readstream.on('close', () => redis.end(false))