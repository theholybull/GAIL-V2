let lastIssuedAt = 0;
let issuedInSameTick = 0;

export function createScaffoldId(prefix: string): string {
  const now = Date.now();
  if (now === lastIssuedAt) {
    issuedInSameTick += 1;
  } else {
    lastIssuedAt = now;
    issuedInSameTick = 0;
  }
  return issuedInSameTick === 0 ? `${prefix}_${now}` : `${prefix}_${now}_${issuedInSameTick}`;
}
