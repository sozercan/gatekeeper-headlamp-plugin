// Test creating direct constraint classes like the templates
import React from 'react';
import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';

const apiGatekeeperConstraintsGroupVersionV1beta1 = [{ group: 'constraints.gatekeeper.sh', version: 'v1beta1' }];

// Create classes for known constraint types
export const K8sAllowedReposClass = makeCustomResourceClass({
  apiInfo: apiGatekeeperConstraintsGroupVersionV1beta1,
  isNamespaced: false,
  singularName: 'k8sallowedrepos',
  pluralName: 'k8sallowedrepos',
});

export const K8sContainerLimitsClass = makeCustomResourceClass({
  apiInfo: apiGatekeeperConstraintsGroupVersionV1beta1,
  isNamespaced: false,
  singularName: 'k8scontainerlimits',
  pluralName: 'k8scontainerlimits',
});

// Simple constraint class that uses the known types
export const SimpleConstraintClass = {
  useApiList: (setData: (data: any) => void) => {
    const [allowedRepos, setAllowedRepos] = React.useState<any>(null);
    const [containerLimits, setContainerLimits] = React.useState<any>(null);

    K8sAllowedReposClass.useApiList(setAllowedRepos);
    K8sContainerLimitsClass.useApiList(setContainerLimits);

    React.useEffect(() => {
      const allConstraints = [];
      if (allowedRepos) allConstraints.push(...allowedRepos);
      if (containerLimits) allConstraints.push(...containerLimits);
      
      console.log('📊 SimpleConstraintClass aggregated:', allConstraints.length, 'constraints');
      setData(allConstraints);
    }, [allowedRepos, containerLimits]);
  },

  useApiGet: (setData: (data: any) => void, name: string) => {
    // Try each constraint type
    const [allowedRepoItem, setAllowedRepoItem] = React.useState<any>(null);
    const [containerLimitItem, setContainerLimitItem] = React.useState<any>(null);

    K8sAllowedReposClass.useApiGet(setAllowedRepoItem, name);
    K8sContainerLimitsClass.useApiGet(setContainerLimitItem, name);

    React.useEffect(() => {
      if (allowedRepoItem) {
        setData(allowedRepoItem);
      } else if (containerLimitItem) {
        setData(containerLimitItem);
      } else {
        setData(null);
      }
    }, [allowedRepoItem, containerLimitItem]);
  },
};
