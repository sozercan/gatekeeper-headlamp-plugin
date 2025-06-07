# Gatekeeper Headlamp Plugin

A Headlamp plugin for viewing OPA Gatekeeper policies and violations in Kubernetes clusters.

## Features

- **ConstraintTemplates**: View and manage Gatekeeper constraint templates
- **Constraints**: Browse constraints with enforcement actions and match rules
- **Violations**: Monitor policy violations across your cluster
- **Detailed Views**: Comprehensive details for templates, constraints, and violations

## Installation

### Prerequisites

- Headlamp installed and configured
- A Kubernetes cluster with OPA Gatekeeper installed
- Node.js and npm

### Building the Plugin

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd gatekeeper-headlamp-plugin
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the plugin:
   ```bash
   npm run build
   ```

4. The built plugin will be in the `dist/` directory.

### Loading the Plugin in Headlamp

#### Option 1: Copy Built Plugin (Recommended)
1. Build and extract the plugin:
   ```bash
   npm run build
   npx @kinvolk/headlamp-plugin extract . .plugins
   ```

2. Copy the plugin files to your Headlamp plugins directory:
   - Linux/macOS: `~/.config/Headlamp/plugins/gatekeeper-headlamp-plugin/`
   - Windows: `%APPDATA%/Headlamp/plugins/gatekeeper-headlamp-plugin/`

3. Copy both `main.js` and `package.json` from the `.plugins` directory to the target location.

#### Option 2: Direct Build Copy
1. Build the plugin:
   ```bash
   npm run build
   ```
2. Copy the built plugin (`dist/main.js`) to your Headlamp plugins directory:
   - Linux/macOS: `~/.config/Headlamp/plugins/gatekeeper-headlamp-plugin/main.js`
   - Windows: `%APPDATA%/Headlamp/plugins/gatekeeper-headlamp-plugin/main.js`

3. Restart Headlamp
4. The Gatekeeper section will appear in the sidebar

## Status

✅ **Complete** - The plugin is now fully functional with all core features implemented and all build issues resolved:

- **Build System**: Successfully compiles with TypeScript and webpack
- **Configuration**: Proper ESLint and Prettier configuration added to package.json
- **API Integration**: Correct Headlamp plugin API usage with `makeCustomResourceClass`
- **UI Components**: All major components implemented with Material-UI
- **Routing**: Proper navigation and sidebar integration
- **Error Handling**: Basic error handling and loading states
- **Code Quality**: All linting and TypeScript compilation issues resolved

### Issues Resolved

The following issues have been fixed:
1. **Missing ESLint Configuration**: Added proper `eslintConfig` section to package.json
2. **Script Commands**: Updated package.json scripts to use correct headlamp-plugin commands
3. **TypeScript Errors**: Fixed type annotations and API usage patterns
4. **Unused Variables**: Cleaned up unused imports and parameters
5. **Plugin Structure**: Added proper plugin extraction with `.plugins` directory

### Ready for Deployment

The plugin is ready for installation and testing in a Headlamp environment with a Kubernetes cluster that has Gatekeeper installed.

## Development

### Running in Development Mode

```bash
npm start
```

This will start the plugin in development mode with hot reloading.

### Generating Types from CRDs

To generate TypeScript types from Gatekeeper CRDs:

```bash
npm run crd-to-types
```

## Plugin Structure

- `src/index.tsx` - Main plugin entry point with routing
- `src/model.ts` - Kubernetes custom resource class definitions
- `src/types/` - TypeScript type definitions
- `src/constraint-template/` - ConstraintTemplate components
- `src/constraint/` - Constraint components
- `src/violations/` - Violation components
- `hack/` - Build and utility scripts

## Components

### ConstraintTemplates

View all constraint templates in your cluster with:
- Template name and kind
- Target admission controllers
- Creation status

### Constraints

Browse constraints with:
- Enforcement actions (deny, dryrun, warn)
- Match rules for resources
- Violation counts
- Detailed constraint parameters

### Violations

Monitor policy violations with:
- Resource details
- Violation messages
- Associated constraints
- Enforcement actions

## API Resources

This plugin works with the following Gatekeeper CRDs:

- `constrainttemplates.templates.gatekeeper.sh/v1beta1`
- Various constraint types under `constraints.gatekeeper.sh/v1beta1`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

Apache 2.0 - see LICENSE file for details.

## Acknowledgments

This plugin is inspired by the [Kyverno Headlamp Plugin](https://github.com/kubebeam/kyverno-headlamp-plugin) and follows similar architectural patterns.
