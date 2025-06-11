import { Injectable, OnModuleInit } from '@nestjs/common';
import { BffDebuggerGateway } from './bff-debugger.gateway';

@Injectable()
export class StdoutInterceptorService implements OnModuleInit {
  private originalStdoutWrite: any;
  private originalStdoutEnd: any;

  constructor(private readonly bffDebuggerGateway: BffDebuggerGateway) {}

  onModuleInit() {
    this.interceptStdout();
  }

  private interceptStdout() {
    const stdout = process.stdout;
    this.originalStdoutWrite = stdout.write;
    this.originalStdoutEnd = stdout.end;

    stdout.write = (chunk: any, ...args: any[]) => {
      const result = this.originalStdoutWrite.apply(stdout, [chunk, ...args]);

      try {
        const message = chunk.toString();
        this.bffDebuggerGateway.emitConsoleLog({
          message,
          level: 'info',
        });
      } catch (error) {
        // Ignore errors in the interceptor to prevent breaking the application
      }

      return result;
    };

    stdout.end = (chunk: any, ...args: any[]) => {
      const result = this.originalStdoutEnd.apply(stdout, [chunk, ...args]);

      if (chunk) {
        try {
          const message = chunk.toString();
          this.bffDebuggerGateway.emitConsoleLog({
            message,
            level: 'info',
          });
        } catch (error) {
          // Ignore errors in the interceptor
        }
      }

      return result;
    };
  }
}
