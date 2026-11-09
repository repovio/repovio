/** Build case-insensitive User discovery filters without bypassing server authorization.
 * @param search Entered personal name or username.
 * @returns Resource-query predicate, or an empty predicate for an empty query.
 */
export function userSearchWhere(search: string): Record<string, unknown> {
  const text = search.trim();
  if (!text) return {};
  return {
    OR: [
      { username: { contains: text, mode: 'insensitive' } },
      {
        AND: text.split(/\s+/).map(
          /** Match each name token against either personal-name field. */ (token) => ({
            OR: [
              { firstName: { contains: token, mode: 'insensitive' } },
              { lastName: { contains: token, mode: 'insensitive' } },
            ],
          }),
        ),
      },
    ],
  };
}
