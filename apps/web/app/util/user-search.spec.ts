import { describe, expect, it } from 'vitest';
import { userSearchWhere } from './user-search';

describe('User name search', /** Verifies discovery semantics before resource transport. */ () => {
  it('does not constrain empty discovery', /** Preserves initial paginated discovery. */ () => {
    expect(userSearchWhere(' \t ')).toEqual({});
  });
  it('matches complete usernames or all name tokens across both name fields', /** Preserves case-insensitive full-name and username discovery. */ () => {
    expect(userSearchWhere(' Vera  Viewer ')).toEqual({
      OR: [
        { username: { contains: 'Vera  Viewer', mode: 'insensitive' } },
        {
          AND: [
            {
              OR: [
                { firstName: { contains: 'Vera', mode: 'insensitive' } },
                { lastName: { contains: 'Vera', mode: 'insensitive' } },
              ],
            },
            {
              OR: [
                { firstName: { contains: 'Viewer', mode: 'insensitive' } },
                { lastName: { contains: 'Viewer', mode: 'insensitive' } },
              ],
            },
          ],
        },
      ],
    });
  });
});
