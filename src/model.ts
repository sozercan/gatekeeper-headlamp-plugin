import * as ApiProxyModuleFromLib from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';
import React from 'react';

let effectiveRequestFunc: ((url: string, M?: any, O?: any, P?: any) => Promise<any>) | undefined = undefined;

// Assign effectiveRequestFunc based on the findings from ApiProxyModuleFromLib, safely
if (ApiProxyModuleFromLib) {
  const moduleAsAny = ApiProxyModuleFromLib as any;
  if (typeof moduleAsAny.request === 'function') {
    effectiveRequestFunc = moduleAsAny.request;
  } else if (typeof moduleAsAny.default === 'function') {
    effectiveRequestFunc = moduleAsAny.default;
  } else if (moduleAsAny.default && typeof moduleAsAny.default === 'object' && typeof moduleAsAny.default.request === 'function') {
    effectiveRequestFunc = moduleAsAny.default.request;
  } else {
    console.error('[model.ts] Top-level: Failed to assign effectiveRequestFunc. No suitable function found in ApiProxyModuleFromLib or its .default property.');
  }
} else {
  console.error('[model.ts] Top-level: ApiProxyModuleFromLib is null or undefined. Cannot assign effectiveRequestFunc.');
}

const apiGatekeeperTemplatesGroupVersionV1beta1 = [{ group: 'templates.gatekeeper.sh', version: 'v1beta1' }];

export const ConstraintTemplateClass = makeCustomResourceClass({
  apiInfo: apiGatekeeperTemplatesGroupVersionV1beta1,
  isNamespaced: false,
  singularName: 'constrainttemplate',
  pluralName: 'constrainttemplates',
});

// Utility function to discover constraint types from ConstraintTemplates
async function discoverConstraintTypes(): Promise<string[]> {
  if (typeof effectiveRequestFunc !== 'function') {
    console.error('[model.ts] discoverConstraintTypes: effectiveRequestFunc is NOT a function. Cannot make API call.');
    return []; // Early exit if request function is not available
  }

  try {
    const templatesResponse = await effectiveRequestFunc('/apis/templates.gatekeeper.sh/v1beta1/constrainttemplates');

    if (templatesResponse && templatesResponse.items && Array.isArray(templatesResponse.items)) {
      const constraintTypes = templatesResponse.items.map((template: any, index: number) => {
        if (!template || !template.spec || !template.spec.crd || !template.spec.crd.spec || !template.spec.crd.spec.names) {
          console.warn(`[model.ts] discoverConstraintTypes: Template item [${index}] has unexpected structure. Skipping. Path spec.crd.spec.names not fully available.`);
          return null;
        }

        const kind = template.spec.crd.spec.names.kind;
        const plural = template.spec.crd.spec.names.plural;

        if (plural) {
          return plural.toLowerCase();
        } else if (kind) {
          console.warn(`[model.ts] discoverConstraintTypes: Template item [${index}] missing plural name, falling back to kind: ${kind}`);
          return kind.toLowerCase();
        }
        console.warn(`[model.ts] discoverConstraintTypes: Template item [${index}] missing both plural and kind names in spec.crd.spec.names. Skipping.`);
        return null;
      }).filter(Boolean); // filter(Boolean) removes nulls

      return constraintTypes as string[];
    }

    console.warn('[model.ts] discoverConstraintTypes: templatesResponse.items is missing, null, or not an array. Cannot extract types.');
    return [];
  } catch (error: any) {
    console.error('[model.ts] discoverConstraintTypes: Error during discovery process:', error.message, error);
    if (error.response && error.response.data) {
      console.error('[model.ts] discoverConstraintTypes: Error response data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.response) {
      console.error('[model.ts] discoverConstraintTypes: Error response (no data field):', JSON.stringify(error.response, null, 2));
    }
    return [];
  }
}

// Function to fetch constraints for a specific type
async function fetchConstraintsOfType(constraintType: string): Promise<any[]> {
  if (typeof effectiveRequestFunc !== 'function') {
    console.error(`[model.ts] fetchConstraintsOfType: effectiveRequestFunc is NOT a function for type ${constraintType}.`);
    return [];
  }

  try {
    const url = `/apis/constraints.gatekeeper.sh/v1beta1/${constraintType}`;
    const response = await effectiveRequestFunc(url);
    const items = response?.items || [];
    return items;
  } catch (error) {
    console.error(`Error fetching constraints of type ${constraintType}:`, error);
    return [];
  }
}

// Cache for discovered constraint types
let constraintTypesPromise: Promise<string[]> | null = null;

// Dynamic constraint class that discovers types at runtime
export const ConstraintClass = {
  // List all constraints by discovering and aggregating from all constraint types
  useApiList: (setData: (data: any) => void) => {
    const [allConstraints, setAllConstraints] = React.useState<any[]>([]);
    const [discoveredTypes, setDiscoveredTypes] = React.useState<string[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<Error | null>(null);

    // Discover constraint types on component mount
    React.useEffect(() => {
      const performDiscovery = async () => {
        constraintTypesPromise = null; // Clear cache for fresh discovery
        setLoading(true);
        setError(null);

        if (typeof effectiveRequestFunc !== 'function') {
          console.error('[model.ts] useApiList/performDiscovery: effectiveRequestFunc is not available. Cannot discover types.');
          setError(new Error('API request function not available for discovery.'));
          setDiscoveredTypes([]);
          setLoading(false);
          return;
        }

        const currentDiscoveryPromise = discoverConstraintTypes();

        try {
          const types = await currentDiscoveryPromise;
          setDiscoveredTypes(types);
        } catch (e: any) {
          console.error('[model.ts] useApiList: Error during type discovery await:', e);
          setError(e);
          setDiscoveredTypes([]);
        } finally {
          setLoading(false);
        }
      };

      performDiscovery();
    }, [setData]); // Removed discoveredTypes, loading, error from deps as they are set within this effect

    // Fetch constraints based on discovered types
    React.useEffect(() => {
      if (loading) {
        return;
      }

      if (error) {
        setAllConstraints([]);
        setData([]);
        return;
      }

      if (discoveredTypes.length === 0) {
        setAllConstraints([]);
        setData([]);
        return;
      }

      if (typeof effectiveRequestFunc !== 'function') {
        console.error('[model.ts] useApiList/fetchAllConstraintData: effectiveRequestFunc is not available. Cannot fetch constraints.');
        setError(new Error('API request function not available for fetching constraints.'));
        setAllConstraints([]);
        setData([]);
        return;
      }

      const fetchAllConstraintData = async () => {
        const allData: any[] = [];
        let fetchErrorOccurred = false;

        for (const type of discoveredTypes) {
          try {
            const constraints = await fetchConstraintsOfType(type);
            if (constraints.length > 0) {
              allData.push(...constraints);
            }
          } catch (e: any) {
            console.error(`[model.ts] useApiList: Failed to fetch constraints for type ${type}:`, e);
            fetchErrorOccurred = true;
          }
        }

        if (fetchErrorOccurred) {
          console.warn("[model.ts] useApiList: One or more constraint types failed to fetch. Displaying partial data if available.");
        }
        setAllConstraints(allData);
      };

      fetchAllConstraintData();
    }, [discoveredTypes, loading, error, setData]);

    // Update the data callback when allConstraints change
    React.useEffect(() => {
      setData(allConstraints);
    }, [allConstraints, setData]);
  },

  // Get a specific constraint by name, trying all discovered constraint types
  useApiGet: (setData: (data: any) => void, name: string, constraintType?: string) => {
    const [constraintData, setConstraintData] = React.useState<any>(null);
    const [discoveredTypes, setDiscoveredTypes] = React.useState<string[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<Error | null>(null);

    // Discover constraint types first
    React.useEffect(() => {
      if (!name) {
        setLoading(false);
        setConstraintData(null);
        setData(null);
        return;
      }

      const performDiscovery = async () => {
        setLoading(true);
        setError(null);

        if (typeof effectiveRequestFunc !== 'function') {
          console.error('[model.ts] useApiGet/performDiscovery: effectiveRequestFunc is not available. Cannot discover types.');
          setError(new Error('API request function not available for discovery.'));
          setDiscoveredTypes([]);
          setLoading(false);
          return;
        }

        const currentDiscoveryPromise = discoverConstraintTypes();

        try {
          const types = await currentDiscoveryPromise;
          setDiscoveredTypes(types);
        } catch (e: any) {
          console.error('[model.ts] useApiGet: Error during type discovery await:', e);
          setError(e);
          setDiscoveredTypes([]);
        } finally {
          setLoading(false);
        }
      };

      performDiscovery();
    }, [name, setData]); // Removed discoveredTypes, loading, error from deps

    // Search for the constraint across all types
    React.useEffect(() => {
      if (!name) {
        return;
      }

      if (loading) {
        return;
      }

      if (error) {
        setConstraintData(null);
        return;
      }

      if (discoveredTypes.length === 0) {
        setConstraintData(null);
        return;
      }

      if (typeof effectiveRequestFunc !== 'function') {
        console.error(`[model.ts] useApiGet/findConstraint: effectiveRequestFunc is not usable.`);
        setConstraintData(null);
        setError(new Error('API request function not available for finding constraint.'));
        return;
      }

      const findConstraint = async () => {
        let foundConstraint = null;
        let findErrorOccurred = false;

        if (constraintType) {
          try {
            const url = `/apis/constraints.gatekeeper.sh/v1beta1/${constraintType}/${name}`;
            const response = await effectiveRequestFunc(url);
            if (response) {
              foundConstraint = response;
            }
          } catch (e: any) {
            console.warn(`[model.ts] useApiGet: Constraint "${name}" not found in specified type "${constraintType}". Error: ${e.message}`);
            findErrorOccurred = true;
          }
        }

        if (!foundConstraint) {
          for (const type of discoveredTypes) {
            if (constraintType && type === constraintType) {
              continue;
            }
            try {
              const url = `/apis/constraints.gatekeeper.sh/v1beta1/${type}/${name}`;
              const response = await effectiveRequestFunc(url);
              if (response) {
                foundConstraint = response;
                break;
              }
            } catch (e: any) {
              // console.debug(`[model.ts] useApiGet: Constraint "${name}" not found in type "${type}". Error: ${e.message}`);
              findErrorOccurred = true;
            }
          }
        }

        if (findErrorOccurred && !foundConstraint) {
          console.warn(`[model.ts] useApiGet: Errors occurred while searching for constraint "${name}", and it was not found.`);
        }

        if (foundConstraint) {
          setConstraintData(foundConstraint);
        } else {
          setConstraintData(null);
        }
      };

      findConstraint();
    }, [name, constraintType, discoveredTypes, loading, error]); // Dependencies for searching

    // Update the data callback when constraintData changes
    React.useEffect(() => {
      setData(constraintData);
    }, [constraintData, setData, name]);
  },
};

// Export aliases for convenience
export { ConstraintTemplateClass as ConstraintTemplate };
export { ConstraintClass as Constraint };
