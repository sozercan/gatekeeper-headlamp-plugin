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
    console.log('🔍 Discovering constraint types from ConstraintTemplates...');

    const templatesResponse = await request('/apis/templates.gatekeeper.sh/v1beta1/constrainttemplates');
    console.log('📋 Templates API response:', templatesResponse);

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

      console.log('🎯 Discovered constraint types:', constraintTypes);
      return constraintTypes;
    }

    console.log('⚠️ No constraint templates found');
    return [];
  } catch (error) {
    console.error('❌ Error discovering constraint types:', error);
    return [];
  }
}

// Function to fetch constraints for a specific type
async function fetchConstraintsOfType(constraintType: string): Promise<any[]> {
  try {
    const url = `/apis/constraints.gatekeeper.sh/v1beta1/${constraintType}`;
    console.log(`📡 Fetching constraints from: ${url}`);

    const response = await request(url);
    console.log(`📦 Response for ${constraintType}:`, response?.items?.length || 0, 'items');

    return response?.items || [];
  } catch (error) {
    console.error(`❌ Error fetching constraints of type ${constraintType}:`, error);
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
        console.log('🚀 Starting constraint type discovery...');
        
        // Use cached promise to avoid multiple simultaneous discoveries
        if (!constraintTypesPromise) {
          constraintTypesPromise = discoverConstraintTypes();
        }
        
        const types = await constraintTypesPromise;
        console.log('✅ Discovery complete, found types:', types);
        setDiscoveredTypes(types);
      };

      performDiscovery();
    }, []);

    // Set up hooks for each discovered constraint type
    React.useEffect(() => {
      if (discoveredTypes.length === 0) return;

      console.log('🔗 Setting up hooks for constraint types:', discoveredTypes);
      
      // We'll use direct API calls instead of dynamic hooks since React doesn't allow conditional hooks
      const fetchAllConstraintData = async () => {
        const allData: any[] = [];
        
        for (const type of discoveredTypes) {
          try {
            const constraints = await fetchConstraintsOfType(type);
            if (constraints.length > 0) {
              console.log(`📊 Found ${constraints.length} constraints of type ${type}`);
              allData.push(...constraints);
            }
          } catch (error) {
            console.error(`💥 Failed to fetch constraints for type ${type}:`, error);
          }
        }
        
        console.log('🎯 Total constraints discovered:', allData.length);
        setAllConstraints(allData);
      };

      fetchAllConstraintData();
    }, [discoveredTypes]);

    // Update the data callback when constraints change
    React.useEffect(() => {
      console.log('📤 Sending constraints to component:', allConstraints.length);
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
        console.log(`🔍 Discovering types to find constraint: ${name}`);
        
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
        console.log(`🎯 Searching for constraint ${name} in types:`, discoveredTypes);

        // If a specific constraint type is provided, try that first
        if (constraintType) {
          try {
            const url = `/apis/constraints.gatekeeper.sh/v1beta1/${constraintType}/${name}`;
            const response = await request(url);
            if (response) {
              console.log(`✅ Found constraint ${name} in specified type ${constraintType}`);
              setConstraintData(response);
              return;
            }
          } catch (error) {
            console.log(`❌ Constraint ${name} not found in specified type ${constraintType}`);
          }
        }

        // Search through all discovered types
        for (const type of discoveredTypes) {
          try {
            const url = `/apis/constraints.gatekeeper.sh/v1beta1/${type}/${name}`;
            const response = await request(url);
            if (response) {
              console.log(`✅ Found constraint ${name} in type ${type}`);
              setConstraintData(response);
              return;
            }
          } catch (error) {
            console.log(`🔍 Constraint ${name} not found in type ${type}, continuing...`);
          }
        }

        console.log(`❌ Constraint ${name} not found in any type`);
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
