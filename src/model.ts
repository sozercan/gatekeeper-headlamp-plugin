import * as ApiProxyModuleFromLib from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';
import React from 'react';

console.log('[model.ts] Top-level: Attempting to import * as ApiProxyModuleFromLib from "@kinvolk/headlamp-plugin/lib/ApiProxy"');
console.log('[model.ts] Top-level: Imported ApiProxyModuleFromLib:', ApiProxyModuleFromLib);
console.log('[model.ts] Top-level: typeof ApiProxyModuleFromLib:', typeof ApiProxyModuleFromLib);

// Extensive logging of the imported module's properties
if (ApiProxyModuleFromLib && typeof ApiProxyModuleFromLib === 'object') {
  console.log('[model.ts] Top-level: Keys in ApiProxyModuleFromLib:', Object.keys(ApiProxyModuleFromLib));

  const requestProp = (ApiProxyModuleFromLib as any).request;
  console.log('[model.ts] Top-level: ApiProxyModuleFromLib.request is:', requestProp);
  console.log('[model.ts] Top-level: typeof ApiProxyModuleFromLib.request is:', typeof requestProp);

  const defaultProp = (ApiProxyModuleFromLib as any).default;
  console.log('[model.ts] Top-level: ApiProxyModuleFromLib.default is:', defaultProp);
  console.log('[model.ts] Top-level: typeof ApiProxyModuleFromLib.default is:', typeof defaultProp);

  if (defaultProp && typeof defaultProp === 'object') {
    console.log('[model.ts] Top-level: ApiProxyModuleFromLib.default is an object. Keys:', Object.keys(defaultProp));
    const defaultRequestProp = (defaultProp as any).request;
    console.log('[model.ts] Top-level: ApiProxyModuleFromLib.default.request is:', defaultRequestProp);
    console.log('[model.ts] Top-level: typeof ApiProxyModuleFromLib.default.request is:', typeof defaultRequestProp);
  }
}


let effectiveRequestFunc: ((url: string, M?: any, O?: any, P?: any) => Promise<any>) | undefined = undefined;

// Assign effectiveRequestFunc based on the findings from ApiProxyModuleFromLib, safely
if (ApiProxyModuleFromLib) {
  const moduleAsAny = ApiProxyModuleFromLib as any;
  if (typeof moduleAsAny.request === 'function') {
    console.log('[model.ts] Top-level: Assigning effectiveRequestFunc from ApiProxyModuleFromLib.request.');
    effectiveRequestFunc = moduleAsAny.request;
  } else if (typeof moduleAsAny.default === 'function') {
    console.log('[model.ts] Top-level: Assigning effectiveRequestFunc from ApiProxyModuleFromLib.default (assuming it is the request function).');
    effectiveRequestFunc = moduleAsAny.default;
  } else if (moduleAsAny.default && typeof moduleAsAny.default === 'object' && typeof moduleAsAny.default.request === 'function') {
    console.log('[model.ts] Top-level: Assigning effectiveRequestFunc from ApiProxyModuleFromLib.default.request.');
    effectiveRequestFunc = moduleAsAny.default.request;
  } else {
    console.error('[model.ts] Top-level: Failed to assign effectiveRequestFunc. No suitable function found in ApiProxyModuleFromLib or its .default property. Module content:', ApiProxyModuleFromLib);
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
  console.log('[model.ts] discoverConstraintTypes: Attempting to discover constraint types...');
  console.log('[model.ts] discoverConstraintTypes: Checking effectiveRequestFunc before call. Is function?', typeof effectiveRequestFunc === 'function');

  if (typeof effectiveRequestFunc !== 'function') {
    console.error('[model.ts] discoverConstraintTypes: effectiveRequestFunc is NOT a function. Cannot make API call. Value:', effectiveRequestFunc);
    return []; // Early exit if request function is not available
  }

  try {
    console.log('[model.ts] discoverConstraintTypes: Making API request to /apis/templates.gatekeeper.sh/v1beta1/constrainttemplates using effectiveRequestFunc.');
    const templatesResponse = await effectiveRequestFunc('/apis/templates.gatekeeper.sh/v1beta1/constrainttemplates');
    // Log the raw response structure carefully
    console.log('[model.ts] discoverConstraintTypes: API request completed. Raw response (first level keys):', templatesResponse ? Object.keys(templatesResponse) : 'null response');
    if (templatesResponse && typeof templatesResponse === 'object') {
      // Avoid overly verbose logging if response is huge, focus on items
      if (templatesResponse.items) {
        console.log('[model.ts] discoverConstraintTypes: templatesResponse.items type:', typeof templatesResponse.items, 'is Array?', Array.isArray(templatesResponse.items), 'length:', Array.isArray(templatesResponse.items) ? templatesResponse.items.length : 'N/A');
      } else {
        console.log('[model.ts] discoverConstraintTypes: templatesResponse.items is missing. Full raw response (if not too large, up to 2000 chars):', JSON.stringify(templatesResponse, null, 2).substring(0, 2000));
      }
    }


    if (templatesResponse && templatesResponse.items && Array.isArray(templatesResponse.items)) {
      if (templatesResponse.items.length === 0) {
        console.log('[model.ts] discoverConstraintTypes: templatesResponse.items is an empty array. No constraint templates defined in the cluster or accessible?');
      }
      const constraintTypes = templatesResponse.items.map((template: any, index: number) => {
        // Log structure of individual items carefully
        console.log(`[model.ts] discoverConstraintTypes: Processing template item [${index}]. Keys:`, template ? Object.keys(template) : 'null item');
        if (!template || !template.spec || !template.spec.crd || !template.spec.crd.spec || !template.spec.crd.spec.names) {
          console.warn(`[model.ts] discoverConstraintTypes: Template item [${index}] has unexpected structure. Skipping. Path spec.crd.spec.names not fully available. Item:`, JSON.stringify(template, null, 2).substring(0, 500));
          return null;
        }

        const kind = template.spec.crd.spec.names.kind;
        const plural = template.spec.crd.spec.names.plural;
        console.log(`[model.ts] discoverConstraintTypes: Template item [${index}] - Kind: ${kind}, Plural: ${plural}`);

        if (plural) {
          return plural.toLowerCase();
        } else if (kind) {
          console.warn(`[model.ts] discoverConstraintTypes: Template item [${index}] missing plural name, falling back to kind: ${kind}`);
          return kind.toLowerCase();
        }
        console.warn(`[model.ts] discoverConstraintTypes: Template item [${index}] missing both plural and kind names in spec.crd.spec.names. Skipping.`);
        return null;
      }).filter(Boolean); // filter(Boolean) removes nulls

      console.log('[model.ts] discoverConstraintTypes: Successfully processed templates. Discovered types:', constraintTypes);
      return constraintTypes as string[];
    }

    console.warn('[model.ts] discoverConstraintTypes: templatesResponse.items is missing, null, or not an array. Cannot extract types. templatesResponse (first level keys):', templatesResponse ? Object.keys(templatesResponse) : 'null response');
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
  console.log('[model.ts] fetchConstraintsOfType: Checking effectiveRequestFunc. Is function?', typeof effectiveRequestFunc === 'function');
  if (typeof effectiveRequestFunc !== 'function') {
    console.error(`[model.ts] fetchConstraintsOfType: effectiveRequestFunc is NOT a function for type ${constraintType}.`);
    return [];
  }

  try {
    const url = `/apis/constraints.gatekeeper.sh/v1beta1/${constraintType}`;
    console.log(`[model.ts] Fetching constraints from URL: ${url} using effectiveRequestFunc.`);
    const response = await effectiveRequestFunc(url);
    const items = response?.items || [];
    console.log(`[model.ts] Received ${items.length} constraints of type ${constraintType}`);
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
      console.log('[model.ts] useApiList: Mount effect for discovery triggered.');
      const performDiscovery = async () => {
        console.log('[model.ts] useApiList: performDiscovery started. Initial state - loading: true, error: null.');
        constraintTypesPromise = null;
        console.log('[model.ts] useApiList: Cleared constraintTypesPromise.');

        setLoading(true);
        setError(null);

        console.log('[model.ts] useApiList/performDiscovery: Checking effectiveRequestFunc. Is function?', typeof effectiveRequestFunc === 'function');

        if (typeof effectiveRequestFunc !== 'function') {
          console.error('[model.ts] useApiList/performDiscovery: effectiveRequestFunc is not available. Cannot discover types.');
          setError(new Error('API request function not available for discovery.'));
          setDiscoveredTypes([]);
          setLoading(false);
          return;
        }
        
        console.log('[model.ts] useApiList: Creating new discoverConstraintTypes() promise.');
        const currentDiscoveryPromise = discoverConstraintTypes();

        try {
          const types = await currentDiscoveryPromise;
          console.log('[model.ts] useApiList: discoverConstraintTypes() promise resolved. Types:', types);
          setDiscoveredTypes(types);
        } catch (e: any) {
          console.error('[model.ts] useApiList: Error during type discovery await:', e);
          setError(e);
          setDiscoveredTypes([]);
        } finally {
          console.log('[model.ts] useApiList: performDiscovery finished. Setting loading to false.');
          setLoading(false);
        }
      };

      performDiscovery();
      console.log('[model.ts] useApiList: Mount effect for discovery finished setup. Current state - discoveredTypes:', discoveredTypes.length, 'loading:', loading, 'error:', error);
    }, [setData]);

    // Fetch constraints based on discovered types
    React.useEffect(() => {
      console.log(`[model.ts] useApiList: Constraint fetching effect triggered. Dependencies state - discoveredTypes: ${discoveredTypes?.length}, loading: ${loading}, error: ${error}`);

      if (loading) {
        console.log('[model.ts] useApiList: Constraint fetching effect: Still loading (discovery phase), skipping constraint fetch.');
        return;
      }

      if (error) {
        console.error('[model.ts] useApiList: Constraint fetching effect: Error occurred during discovery, setting empty constraints. Error:', error);
        setAllConstraints([]);
        setData([]);
        return;
      }

      if (discoveredTypes.length === 0) {
        console.log('[model.ts] useApiList: Constraint fetching effect: No types discovered (or discovery failed cleanly), setting empty constraints.');
        setAllConstraints([]);
        setData([]);
        return;
      }
      
      console.log('[model.ts] useApiList/fetchAllConstraintData: Checking effectiveRequestFunc. Is function?', typeof effectiveRequestFunc === 'function');
      if (typeof effectiveRequestFunc !== 'function') {
        console.error('[model.ts] useApiList/fetchAllConstraintData: effectiveRequestFunc is not available. Cannot fetch constraints.');
        setError(new Error('API request function not available for fetching constraints.'));
        setAllConstraints([]);
        setData([]);
        return;
      }

      console.log('[model.ts] useApiList: Constraint fetching effect: Proceeding to fetch all constraint data for types:', discoveredTypes);
      const fetchAllConstraintData = async () => {
        // setError(null); // Reset error before fetching new data, if applicable
        const allData: any[] = [];
        let fetchErrorOccurred = false;

        for (const type of discoveredTypes) {
          try {
            const constraints = await fetchConstraintsOfType(type);
            if (constraints.length > 0) {
              console.log(`[model.ts] useApiList: Fetched ${constraints.length} constraints for type ${type}`);
              allData.push(...constraints);
            }
          } catch (e: any) {
            console.error(`[model.ts] useApiList: Failed to fetch constraints for type ${type}:`, e);
            // setError(e); // Setting error here might be too aggressive if one type fails
            fetchErrorOccurred = true; // Track if any fetch failed
          // Optionally, decide if you want to stop all or continue with partial data
          }
        }

        if (fetchErrorOccurred) {
          console.warn("[model.ts] useApiList: One or more constraint types failed to fetch. Displaying partial data if available.");
          // Potentially set a non-blocking error state here for the UI to indicate partial data
        }

        console.log('[model.ts] useApiList: All constraint data fetched:', allData);
        setAllConstraints(allData);
      };

      fetchAllConstraintData();
      console.log('[model.ts] useApiList: Constraint fetching effect finished setup.');
    }, [discoveredTypes, loading, error, setData]);

    // Update the data callback when allConstraints change
    React.useEffect(() => {
      console.log('[model.ts] useApiList: Effect to update parent (setData) triggered. allConstraints count:', allConstraints.length);
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
      console.log(`[model.ts] useApiGet: Mount effect for discovery triggered. Name: "${name}"`);
      if (!name) {
        console.log('[model.ts] useApiGet: No name provided, skipping discovery. Setting loading to false.');
        setLoading(false);
        setConstraintData(null);
        setData(null);
        return;
      }

      const performDiscovery = async () => {
        console.log('[model.ts] useApiGet: performDiscovery started. Initial state - loading: true, error: null.');
        setLoading(true);
        setError(null);
        
        console.log('[model.ts] useApiGet/performDiscovery: Checking effectiveRequestFunc. Is function?', typeof effectiveRequestFunc === 'function');

        if (typeof effectiveRequestFunc !== 'function') {
          console.error('[model.ts] useApiGet/performDiscovery: effectiveRequestFunc is not available. Cannot discover types.');
          setError(new Error('API request function not available for discovery.'));
          setDiscoveredTypes([]);
          setLoading(false);
          return;
        }

        console.log('[model.ts] useApiGet: Creating new discoverConstraintTypes() promise.');
        const currentDiscoveryPromise = discoverConstraintTypes();

        try {
          const types = await currentDiscoveryPromise;
          console.log('[model.ts] useApiGet: discoverConstraintTypes() promise resolved. Types:', types);
          setDiscoveredTypes(types);
        } catch (e: any) {
          console.error('[model.ts] useApiGet: Error during type discovery await:', e);
          setError(e);
          setDiscoveredTypes([]);
        } finally {
          console.log('[model.ts] useApiGet: performDiscovery finished. Setting loading to false.');
          setLoading(false);
        }
      };

      performDiscovery();
      console.log('[model.ts] useApiGet: Mount effect for discovery finished setup. Current state - discoveredTypes:', discoveredTypes.length, 'loading:', loading, 'error:', error);
    }, [name, setData]);

    // Search for the constraint across all types
    React.useEffect(() => {
      console.log(`[model.ts] useApiGet: Constraint searching effect triggered. Dependencies state - name: "${name}", constraintType: "${constraintType}", discoveredTypes: ${discoveredTypes?.length}, loading: ${loading}, error: ${error}`);

      if (!name) {
        console.log('[model.ts] useApiGet: Constraint searching effect: No name, skipping search.');
        return;
      }

      if (loading) {
        console.log('[model.ts] useApiGet: Constraint searching effect: Still loading (discovery phase), skipping search.');
        return;
      }

      if (error) {
        console.error('[model.ts] useApiGet: Constraint searching effect: Error occurred during discovery, setting data to null. Error:', error);
        setConstraintData(null);
        return;
      }

      if (discoveredTypes.length === 0) {
        console.log('[model.ts] useApiGet: Constraint searching effect: No types discovered, cannot find constraint. Setting data to null.');
        setConstraintData(null);
        return;
      }
      
      console.log('[model.ts] useApiGet/findConstraint: Checking effectiveRequestFunc. Is function?', typeof effectiveRequestFunc === 'function');
      if (typeof effectiveRequestFunc !== 'function') {
        console.error(`[model.ts] useApiGet/findConstraint: effectiveRequestFunc is not usable.`);
        setConstraintData(null);
        setError(new Error('API request function not available for finding constraint.'));
        return;
      }

      console.log(`[model.ts] useApiGet: Constraint searching effect: Proceeding to search for constraint "${name}" of type "${constraintType || 'any'}" among types:`, discoveredTypes);
      const findConstraint = async () => {
        let foundConstraint = null;
        let findErrorOccurred = false;

        // If a specific constraint type is provided, try that first
        if (constraintType) {
          try {
            const url = `/apis/constraints.gatekeeper.sh/v1beta1/${constraintType}/${name}`;
            console.log(`[model.ts] useApiGet: Attempting to fetch (specific type) from URL: ${url}`);
            const response = await effectiveRequestFunc(url);
            if (response) {
              console.log(`[model.ts] useApiGet: Found constraint "${name}" of type "${constraintType}"`);
              foundConstraint = response;
              // setConstraintData(response); // Set data at the end
              // setLoading(false); // Set loading at the end
              // return; // Don't return early, set data at the end
            }
          } catch (e: any) {
            console.warn(`[model.ts] useApiGet: Constraint "${name}" not found in specified type "${constraintType}". Error: ${e.message}`);
            // Constraint not found in specified type, continue to search all types
            findErrorOccurred = true;
          }
        }

        // Search through all discovered types if not found yet
        if (!foundConstraint) {
          for (const type of discoveredTypes) {
            // If a constraintType was specified and we are in this loop, it means the specific search failed.
            // If constraintType was specified, and it matches the current type in the loop, we've already tried it.
            if (constraintType && type === constraintType) {
              continue;
            }
            try {
              const url = `/apis/constraints.gatekeeper.sh/v1beta1/${type}/${name}`;
              console.log(`[model.ts] useApiGet: Attempting to fetch (general search) from URL: ${url}`);
              const response = await effectiveRequestFunc(url);
              if (response) {
                console.log(`[model.ts] useApiGet: Found constraint "${name}" in type "${type}"`);
                foundConstraint = response;
                break; // Found it
              }
            } catch (e: any) {
            // Continue searching in other types
              console.debug(`[model.ts] useApiGet: Constraint "${name}" not found in type "${type}". Error: ${e.message}`);
              findErrorOccurred = true;
            }
          }
        }

        if (findErrorOccurred && !foundConstraint) {
          console.warn(`[model.ts] useApiGet: Errors occurred while searching for constraint "${name}", and it was not found.`);
        }

        if (foundConstraint) {
          console.log(`[model.ts] useApiGet: Setting constraint data for "${name}":`, foundConstraint);
          setConstraintData(foundConstraint);
        } else {
          console.log(`[model.ts] useApiGet: Constraint "${name}" not found in any discovered type. Setting data to null.`);
          setConstraintData(null);
        }
        // setLoading(false); // Loading state for the hook itself, not individual fetches. Already handled by discovery.
      };

      findConstraint();
      console.log('[model.ts] useApiGet: Constraint searching effect finished setup.');
    }, [name, constraintType, discoveredTypes, loading, error]); // Dependencies for searching

    // Update the data callback when constraintData changes
    React.useEffect(() => {
      console.log(`[model.ts] useApiGet: Effect to update parent (setData) for "${name}" triggered. constraintData:`, constraintData);
      setData(constraintData);
    }, [constraintData, setData, name]);
  },
};

// Export aliases for convenience
export { ConstraintTemplateClass as ConstraintTemplate };
export { ConstraintClass as Constraint };
