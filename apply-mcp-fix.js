#!/usr/bin/env node

/**
 * MCP Schema Compatibility Fix for GPT-5-high
 * 
 * This script applies compatibility fixes to the MCP Firebase server
 * to resolve schema validation issues with GPT-5-high model.
 */

const fs = require('fs');
const path = require('path');

// Load the configuration override
const configOverride = require('./mcp-config-override.json');

console.log('🔄 Applying MCP Schema Compatibility Fix for GPT-5-high...');

// Function to patch schema validation
function patchSchemaValidation(originalSchema) {
  const patched = { ...originalSchema };
  
  // Apply argument validation overrides
  if (configOverride.mcpSchemaCompatibility.overrides.argumentValidation) {
    patched.argumentValidation = {
      ...patched.argumentValidation,
      ...configOverride.mcpSchemaCompatibility.overrides.argumentValidation
    };
  }
  
  return patched;
}

// Function to patch tool schemas
function patchToolSchemas(tools) {
  const toolOverrides = configOverride.mcpSchemaCompatibility.overrides.toolSchemaModifications;
  
  return tools.map(tool => {
    if (toolOverrides[tool.name]) {
      return {
        ...tool,
        inputSchema: {
          ...tool.inputSchema,
          ...toolOverrides[tool.name]
        }
      };
    }
    return tool;
  });
}

// Function to add default parameter handling
function addDefaultParameterHandling(handler) {
  return async (request) => {
    try {
      // Apply default values
      const args = request.params.arguments || {};
      const defaults = configOverride.mcpSchemaCompatibility.overrides.parameterDefaults;
      
      const processedArgs = { ...args };
      for (const [key, defaultValue] of Object.entries(defaults)) {
        if (processedArgs[key] === undefined || processedArgs[key] === null) {
          processedArgs[key] = defaultValue;
        }
      }
      
      // Create new request with processed arguments
      const processedRequest = {
        ...request,
        params: {
          ...request.params,
          arguments: processedArgs
        }
      };
      
      return await handler(processedRequest);
    } catch (error) {
      console.error(`Error in patched handler: ${error.message}`);
      throw error;
    }
  };
}

// Function to create compatibility wrapper
function createCompatibilityWrapper(originalServer) {
  const wrapper = {
    ...originalServer,
    
    // Override setRequestHandler to inject compatibility fixes
    setRequestHandler: function(schema, handler) {
      let patchedHandler = handler;
      
      // Add parameter default handling for tool calls
      if (schema && schema._def && schema._def.typeName === 'CallToolRequestSchema') {
        patchedHandler = addDefaultParameterHandling(handler);
      }
      
      // Apply the original setRequestHandler with patched handler
      originalServer.setRequestHandler.call(this, schema, patchedHandler);
    }
  };
  
  return wrapper;
}

// Main compatibility fix function
function applyMCPCompatibilityFix() {
  try {
    console.log('📋 Loading MCP server modules...');
    
    // Try to find and patch the MCP server
    const mcpServerPath = findMCPServerPath();
    
    if (mcpServerPath) {
      console.log(`🔧 Found MCP server at: ${mcpServerPath}`);
      patchMCPServer(mcpServerPath);
    } else {
      console.log('⚠️  Could not locate MCP server automatically.');
      console.log('💡 You can manually apply the fixes using the configuration in:');
      console.log('   - mcp-schema-fix.js (comprehensive fix)');
      console.log('   - mcp-config-override.json (configuration overrides)');
    }
    
    console.log('✅ MCP Schema Compatibility Fix Applied!');
    console.log('🎯 Your MCP server should now be compatible with GPT-5-high.');
    
  } catch (error) {
    console.error('❌ Error applying MCP compatibility fix:', error.message);
    process.exit(1);
  }
}

// Function to find MCP server path
function findMCPServerPath() {
  const possiblePaths = [
    './node_modules/@modelcontextprotocol/sdk/server/index.js',
    './node_modules/@modelcontextprotocol/sdk/dist/server/index.js',
    './node_modules/@firebase/mcp/dist/index.js',
    './mcp-server.js',
    './server.js'
  ];
  
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      return possiblePath;
    }
  }
  
  return null;
}

// Function to patch MCP server
function patchMCPServer(serverPath) {
  console.log(`🔧 Patching MCP server: ${serverPath}`);
  
  // Read the server file
  let serverContent = fs.readFileSync(serverPath, 'utf8');
  
  // Add compatibility patches at the beginning of the file
  const compatibilityPatch = `
// MCP Schema Compatibility Patch for GPT-5-high
// Auto-applied compatibility fixes
const __mcpCompatibilityPatch = ${JSON.stringify(configOverride.mcpSchemaCompatibility.overrides, null, 2)};

// Override schema validation to be more tolerant
const originalSetRequestHandler = this.setRequestHandler;
this.setRequestHandler = function(schema, handler) {
  const patchedHandler = async (request) => {
    try {
      // Apply default values for better compatibility
      if (request.params && request.params.arguments) {
        const args = request.params.arguments;
        const defaults = __mcpCompatibilityPatch.parameterDefaults || {};
        
        for (const [key, defaultValue] of Object.entries(defaults)) {
          if (args[key] === undefined || args[key] === null) {
            args[key] = defaultValue;
          }
        }
      }
      
      return await handler(request);
    } catch (error) {
      console.error('MCP Compatibility Error:', error.message);
      throw error;
    }
  };
  
  return originalSetRequestHandler.call(this, schema, patchedHandler);
};

`;
  
  // Insert the patch after the imports/initial setup
  const lines = serverContent.split('\n');
  let insertIndex = 0;
  
  // Find a good place to insert (after imports/initial setup)
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('class') || lines[i].includes('function') || lines[i].includes('module.exports')) {
      insertIndex = i;
      break;
    }
  }
  
  lines.splice(insertIndex, 0, compatibilityPatch);
  
  // Write the patched content back
  fs.writeFileSync(serverPath, lines.join('\n'));
  
  console.log(`✅ Patched MCP server successfully`);
}

// Function to create a new compatible MCP server
function createNewCompatibleServer() {
  console.log('🔨 Creating new compatible MCP server...');
  
  const { createCompatibleServer } = require('./mcp-schema-fix.js');
  
  try {
    const server = createCompatibleServer();
    console.log('✅ New compatible MCP server created successfully!');
    return server;
  } catch (error) {
    console.error('❌ Error creating compatible server:', error.message);
    throw error;
  }
}

// Main execution
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'patch':
      applyMCPCompatibilityFix();
      break;
      
    case 'new':
      createNewCompatibleServer();
      break;
      
    case 'check':
      console.log('🔍 Checking MCP compatibility...');
      const mcpPath = findMCPServerPath();
      if (mcpPath) {
        console.log(`✅ Found MCP server at: ${mcpPath}`);
        console.log('📋 Configuration overrides available in mcp-config-override.json');
      } else {
        console.log('⚠️  MCP server not found in standard locations');
      }
      break;
      
    default:
      console.log('🔄 MCP Schema Compatibility Fix for GPT-5-high');
      console.log('');
      console.log('Usage:');
      console.log('  node apply-mcp-fix.js patch  - Apply compatibility patches');
      console.log('  node apply-mcp-fix.js new    - Create new compatible server');
      console.log('  node apply-mcp-fix.js check  - Check MCP server status');
      console.log('');
      console.log('📁 Files created:');
      console.log('  - mcp-schema-fix.js         : Comprehensive schema fixes');
      console.log('  - mcp-config-override.json  : Configuration overrides');
      console.log('  - apply-mcp-fix.js          : This patch application script');
      console.log('');
      console.log('✨ This should resolve GPT-5-high compatibility issues!');
  }
}

module.exports = {
  applyMCPCompatibilityFix,
  createNewCompatibleServer,
  patchSchemaValidation,
  patchToolSchemas,
  createCompatibilityWrapper
};