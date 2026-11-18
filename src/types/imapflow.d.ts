declare module "imapflow" {
  export type ImapAddress = { name?: string; address?: string };

  export type ImapEnvelope = {
    date?: Date | string;
    subject?: string;
    from?: ImapAddress[];
    replyTo?: ImapAddress[];
  };

  export type ImapMessage = {
    source?: Buffer;
    envelope?: ImapEnvelope;
  };

  export class ImapFlow {
    constructor(options: {
      host: string;
      port: number;
      secure?: boolean;
      auth: { user: string; pass: string };
      logger?: boolean;
    });
    connect(): Promise<void>;
    logout(): Promise<void>;
    getMailboxLock(path: string): Promise<{ release(): void }>;
    search(query: Record<string, unknown>, options?: { uid?: boolean }): Promise<number[] | false>;
    fetchOne(uid: number | string, query: Record<string, unknown>, options?: { uid?: boolean }): Promise<ImapMessage | false>;
  }
}
