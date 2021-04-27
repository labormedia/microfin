import { Controller, Get, Param, Inject, ParseIntPipe, UsePipes, ValidationPipe } from '@nestjs/common';
import { Client, Transport, ClientRedis } from '@nestjs/microservices';
import { Subject } from 'rxjs';
import { validate, validateOrReject } from 'class-validator'
import { FINANCIAL_SERVICE } from '../financial.constants';
import { V1Service } from './v1.service';
import { V1Dto } from './dto/v1.dto'

@Controller('v1')
export class V1Controller {

    constructor(
      private readonly V1Service: V1Service
    ) {
    }

    @Get()
    async execute(): Promise<any> {
      const prom = this.V1Service.apiInfo()
      return await prom
    }

    @Get(':pair')
    async getPair(@Param('pair') pair: string) {
      const prom = this.V1Service.getPairService(pair)
      return await prom
    }

    @Get(':pair/:frame')
    async getFrame(@Param('pair') pair: string, @Param('frame') frame: string): Promise<any> {
      const prom = this.V1Service.getFrameService(pair,frame)
      return await prom
    }

    @Get(':pair/:frame/:atom')
    async getAtom(
      @Param('pair') pair: string, 
      @Param('frame') frame: string,
      @Param('atom', ParseIntPipe) atom: Number,
      ): Promise<any> {
        const prom = this.V1Service.getAtomSpanService(pair, frame, atom, 1)
        return await prom
      }

    @Get(':pair/:frame/:atom/:span')
    async getAtomSpan(
      @Param('pair') pair: string, 
      @Param('frame') frame: string,
      @Param('atom', ParseIntPipe) atom: Number,
      @Param('span', ParseIntPipe) span: Number,): Promise<any> {
        const prom = this.V1Service.getAtomSpanService(pair, frame, atom, span)
        return await prom
      }

    @Get(':pair/:frame/:atom/:span/:analysis')
    async getAtomSpanTechnicalAnalysis(
      @Param('pair') pair:String, 
      @Param('frame') frame: String,
      @Param('atom', ParseIntPipe) atom: Number,
      @Param('span', ParseIntPipe) span: Number,
      @Param('analysis') analysis: String): Promise<any> {
        const prom = new Promise( (resolve, reject) => {
          let dto = new V1Dto
          dto.Pair = pair
          dto.Frame = frame
          dto.Atom = atom
          dto.Span = span
          dto.Analysis = analysis
          this.V1Service.validateDto(dto, false)
            .then( async err => {
              err.length > 0 ? reject(err) 
                : 
                (() => { switch (analysis) {
                  case "RSI":
                    resolve( this.V1Service.getAtomRSIService(pair, frame, atom, span, analysis) )
                    break;
                  case "AS":
                    resolve( this.V1Service.getAtomASService(pair, frame, atom, span, analysis) )
                    break;
                  case "SMA":
                    resolve( this.V1Service.getAtomSMAService(pair, frame, atom, span, analysis) )
                    break;
                  case "STEMA":
                    resolve( this.V1Service.getAtomEMAService(pair, frame, atom, span, analysis) )
                    break;
                  case "LTEMA":
                    resolve( this.V1Service.getAtomEMAService(pair, frame, atom, span, analysis) )
                    break;
                  case "MACD":
                    resolve( this.V1Service.getAtomMACDService(pair, frame, atom, span, analysis) )
                    break;
                  default:
                    break;
                  }
                })()
                
            })
        })
        return await prom
      }

}
