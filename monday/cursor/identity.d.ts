export type IdentityResult =
  | { verified: false; reason: string }
  | {
      verified: true;
      kind: string;
      sub: string;
      name: string;
      email: string;
      stage: string;
    };

export function getIdentity(request: unknown): Promise<IdentityResult>;
