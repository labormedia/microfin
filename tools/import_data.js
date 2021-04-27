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

const forLoading = 
[{
  "file": './data/bitcoin_historical.csv',
  "pair": "BTCUSD",
  "frame": "1d"
},
{
  "file": './data/ethereum_historical.csv',
  "pair": "ETHUSD",
  "frame": "1d"
}
]

function populate(list) {
  redis.flushall()
    list.forEach((element) => {
      console.log("Writing:", element)
      const readstream = fs.createReadStream(element.file)
      readstream.pipe(transformer)
        .pipe(toRedis(element.pair, element.frame))
      readstream.on('close', () => redis.end(false))
      delete readstream
    }) 
  }

populate(forLoading)