# Test Files

This directory contains test and verification scripts used during the development of the dynamic constraint discovery feature.

## Files

- **test-api-access.js** - Tests basic API access to Kubernetes cluster
- **test-discovery.js** - Tests constraint type discovery from ConstraintTemplates
- **test-dynamic-discovery.js** - Tests the full dynamic discovery and data fetching process
- **test-headlamp-api.html** - HTML test page for testing API calls in browser context
- **verify-discovery.js** - Final verification script that confirms discovery finds all constraint types and violations

## Usage

These scripts were used to validate the dynamic constraint discovery implementation during development. They can be run individually to test different aspects of the Gatekeeper API integration:

```bash
# Test basic API access
node test/test-api-access.js

# Test constraint type discovery
node test/test-discovery.js

# Test complete dynamic discovery process
node test/test-dynamic-discovery.js

# Verify final implementation
node test/verify-discovery.js
```

The HTML file can be opened in a browser for client-side testing.

## Development Context

These files were created as part of replacing hardcoded constraint classes with dynamic constraint discovery that automatically detects any Gatekeeper constraint types present in the cluster.