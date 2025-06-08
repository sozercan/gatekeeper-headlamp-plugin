import { request } from '@kinvolk/headlamp-plugin/lib/lib/k8s/apiProxy';
import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';
import React from 'react';

const apiGatekeeperTemplatesGroupVersionV1beta1 = [{ group: 'templates.gatekeeper.sh', version: 'v1beta1' }];

export const ConstraintTemplateClass = makeCustomResourceClass({
  apiInfo: apiGatekeeperTemplatesGroupVersionV1beta1,
  isNamespaced: false,
  singularName: 'constrainttemplate',
  pluralName: 'constrainttemplates',
});

// Utility function to discover constraint types from ConstraintTemplates
async function discoverConstraintTypes(): Promise<string[]> {
  try {
    const templatesResponse = await request('/apis/templates.gatekeeper.sh/v1beta1/constrainttemplates');

    if (templatesResponse?.items) {
      const constraintTypes = templatesResponse.items.map((template: any) => {
        const kind = template.spec?.crd?.spec?.names?.kind;
        const plural = template.spec?.crd?.spec?.names?.plural;

        // Prefer plural name, fallback to kind converted to lowercase
        if (plural) {
          return plural.toLowerCase();
        } else if (kind) {
          return kind.toLowerCase();
        }
        return null;
      }).filter(Boolean);

      return constraintTypes;
    }

    return [];
  } catch (error) {
    console.error('Error discovering constraint types:', error);
    return [];
  }
}

// Function to fetch constraints for a specific type
async function fetchConstraintsOfType(constraintType: string): Promise<any[]> {
  try {
    const url = `/apis/constraints.gatekeeper.sh/v1beta1/${constraintType}`;
    const response = await request(url);
    return response?.items || [];
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

    // Discover constraint types on component mount
    React.useEffect(() => {
      const performDiscovery = async () => {
        // Use cached promise to avoid multiple simultaneous discoveries
        if (!constraintTypesPromise) {
          constraintTypesPromise = discoverConstraintTypes();
        }

        const types = await constraintTypesPromise;
        setDiscoveredTypes(types);
      };

      performDiscovery();
    }, []);

    // Set up hooks for each discovered constraint type
    React.useEffect(() => {
      if (discoveredTypes.length === 0) return;

      // We'll use direct API calls instead of dynamic hooks since React doesn't allow conditional hooks
      const fetchAllConstraintData = async () => {
        const allData: any[] = [];

        for (const type of discoveredTypes) {
          try {
            const constraints = await fetchConstraintsOfType(type);
            if (constraints.length > 0) {
              allData.push(...constraints);
            }
          } catch (error) {
            console.error(`Failed to fetch constraints for type ${type}:`, error);
          }
        }

        setAllConstraints(allData);
      };

      fetchAllConstraintData();
    }, [discoveredTypes]);

    // Update the data callback when constraints change
    React.useEffect(() => {
      setData(allConstraints);
    }, [allConstraints, setData]);
  },

  // Get a specific constraint by name, trying all discovered constraint types
  useApiGet: (setData: (data: any) => void, name: string, constraintType?: string) => {
    const [constraintData, setConstraintData] = React.useState<any>(null);
    const [discoveredTypes, setDiscoveredTypes] = React.useState<string[]>([]);

    // Discover constraint types first
    React.useEffect(() => {
      const performDiscovery = async () => {
        if (!constraintTypesPromise) {
          constraintTypesPromise = discoverConstraintTypes();
        }

        const types = await constraintTypesPromise;
        setDiscoveredTypes(types);
      };

      if (name) {
        performDiscovery();
      }
    }, [name]);

    // Search for the constraint across all types
    React.useEffect(() => {
      if (!name || discoveredTypes.length === 0) return;

      const findConstraint = async () => {
        // If a specific constraint type is provided, try that first
        if (constraintType) {
          try {
            const url = `/apis/constraints.gatekeeper.sh/v1beta1/${constraintType}/${name}`;
            const response = await request(url);
            if (response) {
              setConstraintData(response);
              return;
            }
          } catch (error) {
            // Constraint not found in specified type, continue to search all types
          }
        }

        // Search through all discovered types
        for (const type of discoveredTypes) {
          try {
            const url = `/apis/constraints.gatekeeper.sh/v1beta1/${type}/${name}`;
            const response = await request(url);
            if (response) {
              setConstraintData(response);
              return;
            }
          } catch (error) {
            // Continue searching in other types
          }
        }

        // Constraint not found in any type
        setConstraintData(null);
      };

      findConstraint();
    }, [name, constraintType, discoveredTypes]);

    // Update the data callback when constraint data changes
    React.useEffect(() => {
          setData(constraintData);
    }, [constraintData, setData]);
  },
};

// Export aliases for convenience
export { ConstraintTemplateClass as ConstraintTemplate };
export { ConstraintClass as Constraint };
