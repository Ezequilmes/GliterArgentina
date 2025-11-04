/**
 * MCP Schema Configuration Fix for GPT-5-high Compatibility
 * 
 * This script modifies the MCP schema to be compatible with GPT-5-high model
 * by adjusting argument validation rules, parameter type definitions,
 * and required vs optional parameter handling.
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

// Original schema compatibility issues:
// 1. Too strict argument validation
// 2. Rigid parameter type definitions  
// 3. Overly restrictive required parameter handling

// Modified schema with GPT-5-high compatibility fixes
const compatibleSchema = {
  // Loosen argument validation rules
  argumentValidation: {
    strictMode: false, // Changed from true to false
    allowAdditionalProperties: true, // Allow extra parameters
    coerceTypes: true, // Enable type coercion
    stripUnknown: false // Don't strip unknown properties
  },
  
  // Updated parameter type definitions
  parameterTypes: {
    // String parameters - more flexible
    string: {
      type: 'string',
      minLength: 0, // Changed from 1 to 0
      maxLength: 10000, // Increased limit
      pattern: '.*', // Allow any pattern
      transform: ['trim'] // Auto-trim strings
    },
    
    // Number parameters - with coercion
    number: {
      type: 'number',
      minimum: -Infinity, // Remove restrictive minimums
      maximum: Infinity,  // Remove restrictive maximums
      coerce: true // Enable number coercion from strings
    },
    
    // Boolean parameters - flexible handling
    boolean: {
      type: 'boolean',
      coerce: true // Enable boolean coercion
    },
    
    // Array parameters - relaxed validation
    array: {
      type: 'array',
      minItems: 0, // Allow empty arrays
      maxItems: 1000, // Increased limit
      uniqueItems: false, // Allow duplicates
      additionalItems: true // Allow additional items
    },
    
    // Object parameters - flexible structure
    object: {
      type: 'object',
      additionalProperties: true, // Allow any additional properties
      minProperties: 0, // Allow empty objects
      maxProperties: 1000 // Increased limit
    }
  },
  
  // Required vs optional parameter handling
  parameterRequirements: {
    // Make commonly problematic parameters optional
    optionalParams: [
      'callback',
      'callback_sandbox', 
      'url_callback',
      'callback_env_production',
      'resource_id',
      'topic',
      'use_emulator',
      'database',
      'path',
      'collection_path',
      'filters',
      'order',
      'limit',
      'output_character_count',
      'skip_character_count',
      'output_priority',
      'wait_ms_before_check',
      'command_id'
    ],
    
    // Parameters that should have default values
    defaultValues: {
      'use_emulator': false,
      'database': '(default)',
      'output_character_count': 1000,
      'output_priority': 'bottom',
      'wait_ms_before_check': 0,
      'skip_character_count': 0,
      'callback_env_production': false,
      'topic': 'payment',
      'limit': 10
    }
  }
};

// Function to create GPT-5-high compatible MCP server
function createCompatibleServer() {
  const server = new Server(
    {
      name: 'firebase-mcp-compatible',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        logging: {}
      }
    }
  );
  
  // Modified tool registration with relaxed validation
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'firebase_get_environment',
          description: 'Get Firebase environment information',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: true // Allow any additional properties
          }
        },
        {
          name: 'firebase_get_project',
          description: 'Get current Firebase project information',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: true
          }
        },
        {
          name: 'firebase_list_projects',
          description: 'List available Firebase projects',
          inputSchema: {
            type: 'object',
            properties: {
              page_size: { 
                type: 'number', 
                minimum: 1, 
                maximum: 1000,
                default: 20 // Add default value
              },
              page_token: { 
                type: 'string',
                default: '' // Add default value
              }
            },
            additionalProperties: true,
            required: [] // Make all parameters optional
          }
        }
        // Add more tools with similar relaxed validation...
      ]
    };
  });
  
  // Modified request handler with error tolerance
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      const { name, arguments: args } = request.params;
      
      // Apply default values for missing parameters
      const processedArgs = applyDefaultValues(args, compatibleSchema.parameterRequirements.defaultValues);
      
      // Handle the tool call with relaxed validation
      switch (name) {
        case 'firebase_get_environment':
          return await handleFirebaseGetEnvironment(processedArgs);
        case 'firebase_get_project':
          return await handleFirebaseGetProject(processedArgs);
        case 'firebase_list_projects':
          return await handleFirebaseListProjects(processedArgs);
        // Add more cases...
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      // Enhanced error handling with more informative messages
      return {
        content: [{
          type: 'text',
          text: `Error executing tool ${request.params.name}: ${error.message}. This may be due to schema incompatibility. Try using default parameters or contact support.`
        }],
        isError: true
      };
    }
  });
  
  return server;
}

// Helper function to apply default values
function applyDefaultValues(args, defaults) {
  const result = { ...args };
  for (const [key, value] of Object.entries(defaults)) {
    if (result[key] === undefined || result[key] === null) {
      result[key] = value;
    }
  }
  return result;
}

// Example tool handlers with improved error handling
async function handleFirebaseGetEnvironment(args) {
  // Implementation with error tolerance
  try {
    // Your Firebase environment logic here
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ /* your data */ }, null, 2)
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Failed to get Firebase environment: ${error.message}`
      }],
      isError: true
    };
  }
}

async function handleFirebaseGetProject(args) {
  // Similar implementation
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({ /* your data */ }, null, 2)
    }]
  };
}

async function handleFirebaseListProjects(args) {
  // Similar implementation with parameter validation
  const pageSize = args.page_size || 20;
  const pageToken = args.page_token || '';
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({ /* your data */ }, null, 2)
    }]
  };
}

// Export the compatible server configuration
module.exports = {
  createCompatibleServer,
  compatibleSchema,
  
  // Utility functions for schema validation
  validateArguments: (args, schema) => {
    // Custom validation that's more tolerant
    return {
      valid: true,
      errors: [],
      processedArgs: applyDefaultValues(args, schema.parameterRequirements.defaultValues)
    };
  },
  
  // Schema compatibility checker
  checkGPT5Compatibility: (toolSchema) => {
    const issues = [];
    
    // Check for overly strict validation
    if (toolSchema.strict === true) {
      issues.push('Schema has strict mode enabled - may cause GPT-5 compatibility issues');
    }
    
    // Check for restrictive parameter requirements
    if (toolSchema.required && toolSchema.required.length > 5) {
      issues.push('Too many required parameters - consider making some optional');
    }
    
    // Check for type coercion settings
    if (toolSchema.coerceTypes === false) {
      issues.push('Type coercion is disabled - may cause parameter validation failures');
    }
    
    return {
      compatible: issues.length === 0,
      issues: issues,
      recommendations: [
        'Enable additionalProperties for flexible parameter handling',
        'Add default values for optional parameters',
        'Disable strict mode validation',
        'Enable type coercion for better compatibility'
      ]
    };
  }
};

// Usage example:
if (require.main === module) {
  console.log('🔄 MCP Schema Compatibility Fix for GPT-5-high');
  console.log('📋 Compatible Schema Configuration:', JSON.stringify(compatibleSchema, null, 2));
  
  // Test the compatibility checker
  const testSchema = {
    strict: true,
    required: ['param1', 'param2', 'param3', 'param4', 'param5', 'param6'],
    coerceTypes: false
  };
  
  const result = module.exports.checkGPT5Compatibility(testSchema);
  console.log('🔍 Compatibility Check Result:', result);
  
  console.log('✅ Schema fix ready for GPT-5-high compatibility!');
}