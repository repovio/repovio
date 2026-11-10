import { expect, it } from 'vitest';
import { createReadQueue } from './refresh-reads';

it('serializes period reads and preserves completion through a rejected predecessor', /** Query changes wait for real transport completion. */ async () => {
  const run = createReadQueue();
  let finish!: () => void;
  const calls: number[] = [];
  const first = run(
    /** Hold an old period response. */ () =>
      new Promise<void>(
        /** Capture the outstanding request. */ (resolve) => {
          finish = resolve;
        },
      ),
  );
  const second = run(
    /** Fail the next period without poisoning later reads. */ async () => {
      calls.push(2);
      throw Error('failed period');
    },
  );
  const rejected = expect(second).rejects.toThrow('failed period');
  const third = run(
    /** Fetch the final selected period. */ async () => {
      calls.push(3);
      return 'latest';
    },
  );
  await Promise.resolve();
  expect(calls).toEqual([]);
  finish();
  await first;
  await rejected;
  expect(await third).toBe('latest');
  expect(calls).toEqual([2, 3]);
});
