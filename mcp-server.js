import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// Create an MCP server
const server = new McpServer({
    name: 'gliter-argentina-server',
    version: '1.0.0'
});

// Add an addition tool
server.registerTool(
    'add',
    {
        title: 'Addition Tool',
        description: 'Add two numbers',
        inputSchema: { a: z.number(), b: z.number() }
    },
    async ({ a, b }) => ({
        content: [{ type: 'text', text: String(a + b) }]
    })
);

// Add a dynamic greeting resource
server.registerResource(
    'greeting',
    new ResourceTemplate('greeting://{name}', { list: undefined }),
    {
        title: 'Greeting Resource',
        description: 'Dynamic greeting generator'
    },
    async (uri, { name }) => ({
        contents: [
            {
                uri: uri.href,
                text: `Hello, ${name}! Welcome to Gliter Argentina 💕`
            }
        ]
    })
);

// Gliter-specific: User profile resource
server.registerResource(
    'user-profile',
    new ResourceTemplate('gliter://users/{userId}/profile', { list: undefined }),
    {
        title: 'User Profile',
        description: 'Get user profile information from Gliter Argentina'
    },
    async (uri, { userId }) => ({
        contents: [
            {
                uri: uri.href,
                text: `User profile data for user ${userId} from Gliter Argentina`
            }
        ]
    })
);

// Gliter-specific: Create match tool
server.registerTool(
    'create-match',
    {
        title: 'Create Match',
        description: 'Create a match between two users in Gliter Argentina',
        inputSchema: { 
            userId1: z.string().describe('First user ID'), 
            userId2: z.string().describe('Second user ID') 
        }
    },
    async ({ userId1, userId2 }) => ({
        content: [{ type: 'text', text: `Match created between ${userId1} and ${userId2} 💕` }]
    })
);

// Gliter-specific: Chat messages resource
server.registerResource(
    'chat-messages',
    new ResourceTemplate('gliter://chats/{chatId}/messages', { list: undefined }),
    {
        title: 'Chat Messages',
        description: 'Get chat messages from Gliter Argentina'
    },
    async (uri, { chatId }) => ({
        contents: [
            {
                uri: uri.href,
                text: `Chat messages for chat ${chatId} from Gliter Argentina`
            }
        ]
    })
);

// Start receiving messages on stdin and sending messages on stdout
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch(console.error);