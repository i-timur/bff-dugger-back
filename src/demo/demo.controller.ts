import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { Logger } from '@nestjs/common';

@Controller('demo')
export class DemoController {
  private readonly logger = new Logger(DemoController.name);

  @Get('test')
  async testEndpoint(
    @Query('message') message: string = 'Hello from BFF Debugger!',
  ) {
    // Generate some console logs
    this.logger.log(`Received test request with message: ${message}`);
    console.log('This is a console.log message');
    console.warn('This is a console.warn message');
    console.error('This is a console.error message');

    // Simulate some processing time
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      message,
      timestamp: new Date().toISOString(),
      status: 'success',
    };
  }

  @Post('echo')
  async echoEndpoint(@Body() body: any) {
    this.logger.log('Received echo request with body:', body);

    // Generate some console logs
    console.log('Echo request received:', body);

    // Simulate some processing time
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      echo: body,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('error')
  async errorEndpoint() {
    this.logger.error('This is a test error');
    console.error('This is a console.error message');

    throw new Error('This is a test error endpoint');
  }
}
