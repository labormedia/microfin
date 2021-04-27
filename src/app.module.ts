import { Module } from '@nestjs/common';
import { Transport, ClientsModule } from '@nestjs/microservices';
import { GraphQLModule, Resolver, Query, Args } from '@nestjs/graphql';
import { AppController } from './app.controller';
import { AppService, FinResolver } from './app.service';
import { V1Module } from './v1/v1.module';

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
    GraphQLModule.forRoot({
      autoSchemaFile: true,
      installSubscriptionHandlers: true,
      // debug: false,
      // playground: false,
    }),
    V1Module,
  ],
  controllers: [AppController],
  providers: [AppService, FinResolver],
})
export class AppModule {}
