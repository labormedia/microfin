import { Controller, Get, Inject } from '@nestjs/common';
import { AppService } from './app.service';
import { FINANCIAL_SERVICE } from './financial.constants';
import { MessagePattern, ClientRedis, RedisContext, Ctx, Payload } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(@Inject(FINANCIAL_SERVICE) private readonly client: ClientRedis, private readonly appService: AppService) {}

  @Get()
  async execute(): Promise<String> {
    return await this.appService.makeQuery();
  }

  @MessagePattern({ type: 'payload' })
  informAbout(@Payload() newMessage: String, @Ctx() context: RedisContext): String {
    // console.log(`Channel: ${context.getChannel()}`);
    // console.log(`Message: ${newMessage}`);
    return `Message Pattern "informAbout" Activated with message: ${newMessage}`;
  }

}
