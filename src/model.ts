import React from 'react';
import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';

const apiGatekeeperTemplatesGroupVersionV1beta1 = [{ group: 'templates.gatekeeper.sh', version: 'v1beta1' }];
const apiGatekeeperConstraintsGroupVersionV1beta1 = [{ group: 'constraints.gatekeeper.sh', version: 'v1beta1' }];

export const ConstraintTemplateClass = makeCustomResourceClass({
  apiInfo: apiGatekeeperTemplatesGroupVersionV1beta1,
  isNamespaced: false,
  singularName: 'constrainttemplate',
  pluralName: 'constrainttemplates',
});

// Define constraint classes for known Gatekeeper constraint types
export const K8sAllowedReposClass = makeCustomResourceClass({
  apiInfo: apiGatekeeperConstraintsGroupVersionV1beta1,
  isNamespaced: false,
  singularName: 'k8sallowedrepos',
  pluralName: 'k8sallowedrepos',
});

// Create a unified constraint class that aggregates all constraint types
export const ConstraintClass = {
  // List all constraints by aggregating from all known constraint types
  useApiList: (setData: (data: any) => void) => {
    const [k8sAllowedReposData, setK8sAllowedReposData] = React.useState<any>(null);

    // Use the standard Headlamp approach for each constraint type
    K8sAllowedReposClass.useApiList(setK8sAllowedReposData);

    React.useEffect(() => {
      // Aggregate data from all constraint types
      const allConstraints = [];

      if (k8sAllowedReposData) {
        allConstraints.push(...k8sAllowedReposData);
      }

      console.log('Aggregated constraints:', allConstraints);
      setData(allConstraints);
    }, [k8sAllowedReposData]);
  },

  // Get a specific constraint by trying each constraint type
  useApiGet: (setData: (data: any) => void, name: string, constraintType?: string) => {
    const [k8sAllowedReposItem, setK8sAllowedReposItem] = React.useState<any>(null);

    // Try to get from K8sAllowedRepos first
    K8sAllowedReposClass.useApiGet(setK8sAllowedReposItem, name);

    React.useEffect(() => {
      if (k8sAllowedReposItem) {
        console.log('Found constraint:', k8sAllowedReposItem);
        setData(k8sAllowedReposItem);
      } else {
        setData(null);
      }
    }, [k8sAllowedReposItem]);
  },
};

// Export aliases for convenience
export { ConstraintTemplateClass as ConstraintTemplate };
export { ConstraintClass as Constraint };
