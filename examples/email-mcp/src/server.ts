import { Implementation } from '@modelcontextprotocol/sdk/types.js';
import { McpHonoServerDO } from '@xava-labs/mcp/dist/mcp/src/mcp/hono-server.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { EmailRepository } from './repository';
import { setupServerTools } from './tools';
import { setupServerResources } from './resources';
import { setupServerPrompts } from './prompts';
import { z } from 'zod';

// Shape of inbound email payload posted by the top-level email handler
const inboundEmailSchema = z.object({
  id: z.string().uuid(),
  from_addr: z.string(),
  to_addr: z.string(),
  subject: z.string().optional().default(''),
  text: z.string().optional().default(''),
  raw_size: z.number().int().nonnegative(),
  received_at: z.string(), // ISO
});

export class EmailMcpServer extends McpHonoServerDO {
  private repository!: EmailRepository;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  getImplementation(): Implementation {
    return {
      name: 'EmailMcpServer',
      version: '1.0.0',
    };
  }

  configureServer(server: McpServer): void {
    // Initialize repository (uses D1)
    this.repository = new EmailRepository(this.env.EMAILS_DB);

    // Ensure DB schema exists
    this.ctx.blockConcurrencyWhile(async () => {
      await this.repository.initializeDatabase();
    });

    // Wire tools/resources
    setupServerTools(server, this.repository, this.env);
    setupServerResources(server, this.repository);
    setupServerPrompts(server);
  }
}