import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { BffDebuggerGateway } from './bff-debugger.gateway';
import { StdoutInterceptorService } from './stdout-interceptor.service';
import { NetworkInterceptorService } from './network-interceptor.service';

@Module({
  providers: [
    BffDebuggerGateway,
    StdoutInterceptorService,
    NetworkInterceptorService,
  ],
  exports: [BffDebuggerGateway],
})
export class BffDebuggerModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(NetworkInterceptorService).forRoutes('*'); // Apply to all routes
  }
}
