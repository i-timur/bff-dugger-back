import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BffDebuggerModule } from './bff-debugger/bff-debugger.module';
import { DemoModule } from './demo/demo.module';

@Module({
  imports: [BffDebuggerModule, DemoModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
