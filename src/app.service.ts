import { Injectable } from '@nestjs/common';
import { Client, Transport, ClientRedis } from '@nestjs/microservices';
import { GraphQLModule, Resolver, Query, Args, Mutation, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions'

/* GraphQL Resolvers */
@Resolver()
export class FinResolver {

  private pubSub : PubSub;
  constructor() {
    this.pubSub = new PubSub()
  }

  @Client({
    transport: Transport.REDIS,
    options: {
      url: 'redis://localhost:6379',
    },
  })
  private client: ClientRedis;

  @Query(() => String)
  async getHistory(@Args('end') end: String, @Args('start') start: String): Promise<String> {
    await this.client.send({ type: 'sum' }, Array.from({length:100}, (_,i) => i).toString()).toPromise();
    return [start,end].join(" ");
  }

  @Mutation(returns => String)
  async addAsset(
    @Args('assetId') assetId: Number,
    @Args('data') assetData: String,
  ) {
    console.log('Mutating', assetId, 'with', assetData)
    this.pubSub.publish('assets', `{ data: \"${assetData}\" }`);
    return `{ assetId: assetId, data: assetData }`;
  }

  @Subscription( returns => String, {
    name: 'assets',
    // resolve: value => value,
    resolve(value) {
      // "this" refers to an instance of "AuthorResolver"
      return value;
    }
  })
  addAssetHandler(@Args('handler') handler: String) {
    const check = this.pubSub.asyncIterator('assets')
    return check;
  }

}

/* General App Service */
@Injectable()
export class AppService {

  @Client({
    transport: Transport.REDIS,
    options: {
      url: 'redis://localhost:6379',
    },
  })
  private client: ClientRedis;

  async onModuleInit() {
    // Connect your client to the redis server on startup.
    await this.client.connect();
  }

  async makeQuery(): Promise<String> {
    const customeMessage = `</br></br>Hello from Redis Stream
    </br> Please go to: <a href="http://localhost:3001/api/v1">http://localhost:3001/api/v1</a> 
    for details about this service.
    </br> Examples:
    </br> <a href="http://localhost:3001/api/v1/BTCUSD">Tiempos disponible para BTCUSD.</a>
    </br> <a href="http://localhost:3001/api/v1/BTCUSD/1d/1619049600000/1">Un elemento de BTCUSD con fecha "1619049600000" (millis) y período 1d.</a>
    </br> <a href="http://localhost:3001/api/v1/BTCUSD/1d/1619049600000/10">10 elementos de BTCUSD precediendo 1619049600000.</a>
    </br> <a href="http://localhost:3001/api/v1/BTCUSD/1d/1619049600000/100">100 elementos de BTCUSD precediendo 1619049600000.</a>
    </br> <a href="http://localhost:3001/api/v1/BTCUSD/1d/1619049600000/100/RSI">RSI aplicado a 100 elementos de BTCUSD precediendo 1619049600000.</a>
    </br> <a href="http://localhost:3001/api/v1/BTCUSD/1d/1619049600000/100/STEMA">EMA de corto plazo aplicado a 100 elementos de BTCUSD precediendo 1619049600000.</a>
    </br> <a href="http://localhost:3001/api/v1/BTCUSD/1d/1619049600000/140/MACD">MACD aplicado a 140 elementos de BTCUSD precediendo 1619049600000.</a>
    `
    const response = await this.client.send({ type: 'payload' }, customeMessage).toPromise();
    return response;
  }

}
