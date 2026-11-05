import {
  Injectable,
  StreamableFile,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { map, type Observable } from 'rxjs';

import { toWire } from './to-wire.js';

/** Normalize JSON transport dates before schema validation while preserving streaming responses. */
@Injectable()
export class WireInterceptor implements NestInterceptor {
  /**
   * Convert public JSON values without touching streams or already handled raw replies.
   *
   * @param _context - Current Nest execution context.
   * @param next - Remaining response processing chain.
   * @returns The stream of normalized transport values.
   */
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next
      .handle()
      .pipe(map((value) => (value instanceof StreamableFile || Buffer.isBuffer(value) ? value : toWire(value))));
  }
}
