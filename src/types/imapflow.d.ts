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

  export type ImapMailboxInfo = {
    path: string;
    name?: string;
    specialUse?: string;
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
    list(): Promise<ImapMailboxInfo[]>;
    mailboxCreate(path: string | string[]): Promise<unknown>;
    getMailboxLock(path: string): Promise<{ release(): void }>;
    search(query: Record<string, unknown>, options?: { uid?: boolean }): Promise<number[] | false>;
    fetchOne(uid: number | string, query: Record<string, unknown>, options?: { uid?: boolean }): Promise<ImapMessage | false>;
    messageMove(range: number | string, destination: string, options?: { uid?: boolean }): Promise<unknown>;
  }
}
