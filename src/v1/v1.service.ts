import { Injectable, Inject } from '@nestjs/common';
import { Client, Transport, ClientRedis } from '@nestjs/microservices';
import { Subject } from 'rxjs';
import { validate } from 'class-validator';
import { FINANCIAL_SERVICE, DEFAULT_SPAN, SHORT_TERM_SPAN, LONG_TERM_SPAN } from '../financial.constants';
import { V1Dto } from './dto/v1.dto';

@Injectable()
export class V1Service {
  client: any;
  subject: Subject<Error>;

  constructor( @Inject(FINANCIAL_SERVICE) private readonly clientClass: ClientRedis) {
    this.client = clientClass.createClient(this.subject)
  }

    async validateDto(dto: V1Dto, verbose?: Boolean): Promise<any> {
      return validate(dto).then(errors => {
        // errors is an array of validation errors
        verbose ? errors.length > 0 ? 
          console.error('validation failed. errors: ', errors)
          :
          console.log('validation succeed')
          : 0
        return errors
      });
    }

    async parseWithScores(
      data: any[]
      ): Promise<any> {
      const prom = new Promise( (resolve, reject) => {
        Array.isArray(data) && data.length > 0 ? 
          resolve(
            data
              .map( (x,i) => i % 2 == 0 ? x : [x].concat(data[i-1].split(',')) )
              .filter( (x,i) => i % 2 !== 0) 
          )
          : reject("Incorrect Type")
      })
      return await prom
    }

    async apiInfo () {
      const prom = new Promise( (resolve, reject) => {
        const check = this.client.smembers("v1:pairs", (err: Error, res: String[]) => {
          const pairs = res.join(",")
          const apiInfo = 
            `{
              "version":"v1",
              "root": "/api/v1/",
              "pairs": "${pairs}",
              "usage": {
                "/api/v1/:pair": "Available timeframes for a pair.",
                "/api/v1/:pair/:frame": "Atomic elements available for a pair on a timeframe.",
                "/api/v1/:pair/:frame/:atom": "Data for an individual atom for a pair in a timeframe.",
                "/api/v1/:pair/:frame/:atom/:span": "Data for the $span preceding elements since an atom.",
                "/api/v1/:pair/:frame/:atom/:span/RSI": "RSI Technical Analysis for a Data Span.",
                "/api/v1/:pair/:frame/:atom/:span/AS": "Average Spread Technical Analysis for a Data Span.",
                "/api/v1/:pair/:frame/:atom/:span/STEMA": "Short Term EMA Technical Analysis for a Data Span.",
                "/api/v1/:pair/:frame/:atom/:span/LTEMA": "Long Term EMA Technical Analysis for a Data Span.",
                "/api/v1/:pair/:frame/:atom/:span/SMA": "Simple Moving Average Technical Analysis for a Data Span.",
                "/api/v1/:pair/:frame/:atom/:span/MACD": "Moving Average Convergence Divergence Technical Analysis for a Data Span."
              },
              "notas": "Por razones de disponibilidad de datos y tiempo el spread promedio está siendo calculado en base a los mínimos y máximos de cada elemento atómico, a la espera de ser configurado con una nueva secuencia de datos que incluya información de órdenes."
            }`
          err ? reject(err) 
          : resolve(
              JSON.parse(apiInfo)
            )
        })
      })
      return prom
    }

    async getFrameService(
      pair: String, 
      frame: String
      ) {
      const prom = new Promise( (resolve, reject) => {
        const key = pair+":"+frame
        const check = this.client.lrange(key, 0, -1, (err: Error, res: String) => {
          err ? reject(err) : resolve(res)
        })
      })
      return prom
    }

    async getPairService (
      pair: String
      ) {
      const prom = new Promise( (resolve, reject) => {
        const check = this.client.lrange(pair, 0, -1, (err: Error, res: String) => {
          console.log(pair, res)
          err ? reject(err) : resolve(res)
        })
      })
      return prom
    }

    async getAtomSpanService( 
      pair: String, 
      frame: String, 
      atom: Number, 
      span?: Number 
      ) {
      const prom = new Promise( (resolve, reject) => {
        const maxSpan = 1000
        const key = pair+":"+frame
        const pos = this.client.lpos(key, atom, (err: Error, res: String) => {
          span < 0 || span > maxSpan || err ? reject(err) : this.client.lrange([key, res , res+span.toString()], (err: Error, positions: string[]) => {
            const sorted = positions.sort()
            const first = sorted[0]
            const last = sorted[sorted.length-1]
            this.client.zrange([key+":history", last, first, "REV", "BYSCORE", "WITHSCORES", "LIMIT", 0, span], 
              (err: Error, atomContent: string[]) => {
              // Is necessary to parse Redis results to connect Ranks with Scores. (MANDATORY: WITHSCORES needs to be activated)
              const result = this.parseWithScores(atomContent)
              resolve(result)
            })
          })
        })
      }).catch( err => console.error(err))
      return await prom
    }

    async RSI(close: number[], periodLength: number) : Promise<Object> {
      const prom = new Promise( (resolve, reject) => {
        periodLength > 1 && close.length > periodLength ? 0 : reject("Invalid parameters")
        const result = close.reduce( (a,x,i) => {
          a.previous = a.previous.concat([x[1]])
          if(i > periodLength) {
            const zero = Number.MIN_VALUE
            const diff = a.previous[a.previous.length-1] - a.previous[a.previous.length-2]
            diff < 0 ? (a.D = a.D.concat([-diff]), a.U = a.U.concat([zero])) : (a.D = a.D.concat([zero]), a.U = a.U.concat([diff]))
            const localRS = a.U.slice(a.U.length - periodLength - 1, a.U.length).reduce( (a,x,i) => a + x) /
              a.D.slice(a.D.length - periodLength - 1, a.D.length).reduce( (a,x,i) => a + x)
            a.RS = a.RS.concat( [ localRS ] )
            a.RSI = a.RSI.concat([100-(100/(1+localRS))])
          } else {
            a.D = a.D.concat([0])
            a.U = a.U.concat([0])
            a.RS = a.RS.concat([0])
            a.RSI = a.RSI.concat([0])
          }
          a.atoms = a.atoms.concat([[x[0]]])
          return a
        }, { atoms: [], previous: [], U: [], D: [], RS:[], RSI:[] })
        resolve(result.RSI)
      })
      return await prom
    }

    async AS(lowhigh: number[][], periodLength: number) {
      const prom = new Promise( (resolve, reject) => {
        resolve( lowhigh.map( x => [ x[0], (x[1] + x[2]) / 2 ]) )
      } )
      return await prom
    }

    async SMA(close:number[][], periodLength: number): Promise<any> {
      periodLength = periodLength ? periodLength : SHORT_TERM_SPAN
      const prom = await new Promise( (resolve, reject) => {
        const result = close.reduce( (a,x,i) => {
          if (i > periodLength) {
            a.span.shift()
            a.span = a.span.concat([x[1]]);
            a.SMA = a.SMA.concat( [a.span.reduce( (b,y,j) => b + y ) / a.span.length] )
          } else {
            a.span = a.span.concat([x[1]])
            a.SMA = a.SMA.concat( [a.span.reduce( (b,y,j) => b + y ) / a.span.length] )
          }
          a.atoms = a.atoms.concat([x[0]])
          return a
        } , { span: [], SMA: [], atoms: [] })
        resolve( result.SMA )
      } )
      return prom
    }

    async EMA(close: number[][], periodLength: number): Promise<any> {
      const prom = new Promise( async (resolve, reject) => {
        const sma = await this.SMA(close, periodLength)
        const alpha = 2/( periodLength + 1 )
        const result = close.map( (x,i) => {
          return i > periodLength ? x[1]*alpha + close[i-1][1]*(1-alpha) : 0
        } )
        resolve( result )
      } )
      return await prom
    }

    async getAtomRSIService(pair: String, frame: String, atom: Number, span: Number, analysis: String): Promise<any> {
      const prom = new Promise( async (resolve, reject) => {
        const result = await this.getAtomSpanService(pair, frame, atom, span)
          .then( async (res: any[]) => {
            const close = res.map( x => x.slice(0,2).map( (x: any) => parseInt(x)) )
            const period = DEFAULT_SPAN
            return this.RSI(close, period)
          })
          .catch( err => reject(err))
        resolve(result)
      })
      return await prom
    }

    async getAtomASService(pair: String, frame: String, atom: Number, span: Number, analysis: String): Promise<any> {
      const prom = new Promise( async (resolve, reject) => {
        const result = await this.getAtomSpanService(pair, frame, atom, span)
          .then( async (res: any[]) => {
            const lowhigh = res.map( x => [x[0], x[3], x[4]].map( (x: any) => parseInt(x)) )
            const period = DEFAULT_SPAN
            return this.AS(lowhigh, period)
          })
          .catch( err => reject(err))
        resolve(result)
      })
      return prom
    }

    async getAtomSMAService(pair: String, frame: String, atom: Number, span: Number, analysis: String): Promise<any> {
      const prom = new Promise( async (resolve, reject) => {
        const result = await this.getAtomSpanService(pair, frame, atom, span)
          .then( async (res: any[]) => {
            const close = res.map( x => [x[0], x[1]].map( (x: any) => parseInt(x)) )
            return this.SMA(close, SHORT_TERM_SPAN)
          } )
        resolve(result)
      } )
      return prom
    }


    async getAtomEMAService(pair: String, frame: String, atom: Number, span: Number, analysis: String): Promise<any> {
      const prom = new Promise( async (resolve, reject) => {
        const result = await this.getAtomSpanService(pair, frame, atom, span)
          .then( async (res: any[]) => {
            const close = res.map( x => [x[0], x[1]].map( (x: any) => parseInt(x)) )
            const period = (): number => { 
              switch(analysis) {
                case "STEMA":
                  return SHORT_TERM_SPAN;
                  break;
                case "LTEMA":
                  return LONG_TERM_SPAN;
                  break;
                default:
                  return SHORT_TERM_SPAN;
                  break;
              }
            }
            return this.EMA(close, period())
          })
          .catch( err => reject(err))
        resolve(result)
      })
      return prom
    }

    async getAtomMACDService(pair: String, frame: String, atom: Number, span: Number, analysis: String): Promise<any> {
      const prom = new Promise( async (resolve, reject) => {
        const result = await this.getAtomSpanService(pair, frame, atom, span)
          .then( async (res: any[]) => {
            const close = res.map( x => [x[0], x[1]].map( (x: any) => parseInt(x)) )
            const stema = await this.EMA(close, SHORT_TERM_SPAN)
            const ltema = await this.EMA(close, LONG_TERM_SPAN)
            return stema.map( (x,i) => x - ltema[i] )
          })
          .catch( err => reject(err))
        resolve(result)
      })
      return prom
    }


}
