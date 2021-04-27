import { Module } from '@nestjs/common';
import { Transport, ClientsModule } from '@nestjs/microservices';
import moment from 'moment';
import { V1Controller } from './v1.controller';
import { V1Service } from './v1.service';
import { V1Dto } from './dto/v1.dto'

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'FINANCIAL_SERVICE',
        transport: Transport.REDIS,
        options: {
          url: 'redis://localhost:6379',
        }
      },
    ]),
  ],
  controllers: [V1Controller],
  providers: [
    V1Service,
    {
      provide: 'MomentWrapper',
      useValue: moment
    },
    {
      provide: 'V1Dto',
      useValue: V1Dto
    }
  ]
})
export class V1Module {}
