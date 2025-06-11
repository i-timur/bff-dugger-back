import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { BffDebuggerGateway } from './bff-debugger.gateway';

interface RequestTiming {
  startTime: number;
  endTime: number;
  dnsStart: number;
  dnsEnd: number;
  connectStart: number;
  connectEnd: number;
  sslStart: number;
  sslEnd: number;
  sendStart: number;
  sendEnd: number;
  receiveHeadersStart: number;
  receiveHeadersEnd: number;
  receiveBodyStart: number;
  receiveBodyEnd: number;
}

@Injectable()
export class NetworkInterceptorService implements NestMiddleware {
  private activeRequests: Map<string, RequestTiming> = new Map();

  constructor(private readonly bffDebuggerGateway: BffDebuggerGateway) {}

  use(req: Request, res: Response, next: NextFunction) {
    const requestId = Math.random().toString(36).substring(7);
    const startTime = Date.now();

    // Initialize timing data
    const timing: RequestTiming = {
      startTime,
      endTime: 0,
      dnsStart: startTime,
      dnsEnd: startTime,
      connectStart: startTime,
      connectEnd: startTime,
      sslStart: startTime,
      sslEnd: startTime,
      sendStart: startTime,
      sendEnd: startTime,
      receiveHeadersStart: 0,
      receiveHeadersEnd: 0,
      receiveBodyStart: 0,
      receiveBodyEnd: 0,
    };

    this.activeRequests.set(requestId, timing);

    // Capture request details
    const requestData = {
      id: requestId,
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      timestamp: new Date().toISOString(),
      state: 'pending',
      timing,
    };

    // Emit request started event
    this.bffDebuggerGateway.emitNetworkActivity({
      type: 'requestStarted',
      requestId,
      data: requestData,
      timing,
    });

    // Store original methods
    const originalSend = res.send;
    const originalJson = res.json;
    const originalEnd = res.end;

    // Intercept response
    res.send = function (body: any): Response {
      const now = Date.now();
      const timing = this.activeRequests.get(requestId);
      if (timing) {
        timing.receiveBodyStart = timing.receiveBodyStart || now;
        timing.receiveBodyEnd = now;
        timing.endTime = now;
      }

      const responseData = {
        id: requestId,
        statusCode: res.statusCode,
        headers: res.getHeaders(),
        body: body,
        state: 'completed',
        timing,
        timestamp: new Date().toISOString(),
      };

      // Emit request completed event
      this.bffDebuggerGateway.emitNetworkActivity({
        type: 'requestEnded',
        requestId,
        data: {
          request: requestData,
          response: responseData,
        },
        timing,
      });

      this.activeRequests.delete(requestId);
      return originalSend.call(res, body);
    }.bind(this);

    res.json = function (body: any): Response {
      const now = Date.now();
      const timing = this.activeRequests.get(requestId);
      if (timing) {
        timing.receiveBodyStart = timing.receiveBodyStart || now;
        timing.receiveBodyEnd = now;
        timing.endTime = now;
      }

      const responseData = {
        id: requestId,
        statusCode: res.statusCode,
        headers: res.getHeaders(),
        body: body,
        state: 'completed',
        timing,
        timestamp: new Date().toISOString(),
      };

      // Emit request completed event
      this.bffDebuggerGateway.emitNetworkActivity({
        type: 'requestEnded',
        requestId,
        data: {
          request: requestData,
          response: responseData,
        },
        timing,
      });

      this.activeRequests.delete(requestId);
      return originalJson.call(res, body);
    }.bind(this);

    res.end = function (chunk?: any, encoding?: any): Response {
      if (chunk) {
        const now = Date.now();
        const timing = this.activeRequests.get(requestId);
        if (timing) {
          timing.receiveBodyStart = timing.receiveBodyStart || now;
          timing.receiveBodyEnd = now;
          timing.endTime = now;
        }

        const responseData = {
          id: requestId,
          statusCode: res.statusCode,
          headers: res.getHeaders(),
          body: chunk,
          state: 'completed',
          timing,
          timestamp: new Date().toISOString(),
        };

        // Emit request completed event
        this.bffDebuggerGateway.emitNetworkActivity({
          type: 'requestEnded',
          requestId,
          data: {
            request: requestData,
            response: responseData,
          },
          timing,
        });

        this.activeRequests.delete(requestId);
      }

      return originalEnd.call(res, chunk, encoding);
    }.bind(this);

    // Handle request errors
    res.on('error', (error) => {
      const now = Date.now();
      const timing = this.activeRequests.get(requestId);
      if (timing) {
        timing.endTime = now;
      }

      const errorData = {
        id: requestId,
        error: error.message,
        state: 'failed',
        timing,
        timestamp: new Date().toISOString(),
      };

      // Emit request failed event
      this.bffDebuggerGateway.emitNetworkActivity({
        type: 'requestFailed',
        requestId,
        data: {
          request: requestData,
          error: errorData,
        },
        timing,
      });

      this.activeRequests.delete(requestId);
    });

    next();
  }
}
