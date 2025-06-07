import {
  registerRoute,
  registerSidebarEntry,
} from '@kinvolk/headlamp-plugin/lib';
import ConstraintDetails from './constraint/Details';
import ConstraintList from './constraint/List';
import ConstraintTemplateDetails from './constraint-template/Details';
import ConstraintTemplateList from './constraint-template/List';
import ViolationsDetails from './violations/Details';
import ViolationsList from './violations/List';

export namespace RoutingPath {
  export const ConstraintTemplates = '/gatekeeper/constraint-templates';
  export const ConstraintTemplate = '/gatekeeper/constraint-templates/:name';
  export const Constraints = '/gatekeeper/constraints';
  export const Constraint = '/gatekeeper/constraints/:kind/:name';
  export const Violations = '/gatekeeper/violations';
  export const Violation = '/gatekeeper/violations/:kind/:name';
}

// Register sidebar items
registerSidebarEntry({
  parent: null,
  name: 'gatekeeper',
  label: 'Gatekeeper',
  icon: 'mdi:shield-check',
  url: RoutingPath.ConstraintTemplates,
});

registerSidebarEntry({
  parent: 'gatekeeper',
  name: 'constrainttemplates',
  label: 'Constraint Templates',
  url: RoutingPath.ConstraintTemplates,
});

registerSidebarEntry({
  parent: 'gatekeeper',
  name: 'constraints',
  label: 'Constraints',
  url: RoutingPath.Constraints,
});

registerSidebarEntry({
  parent: 'gatekeeper',
  name: 'violations',
  label: 'Violations',
  url: RoutingPath.Violations,
});

// Register routes for ConstraintTemplates
registerRoute({
  path: RoutingPath.ConstraintTemplates,
  sidebar: 'constrainttemplates',
  name: 'Constraint Templates',
  exact: true,
  component: () => <ConstraintTemplateList />,
});

registerRoute({
  path: RoutingPath.ConstraintTemplate,
  sidebar: 'constrainttemplates',
  name: 'Constraint Template Details',
  exact: true,
  component: () => <ConstraintTemplateDetails />,
});

// Register routes for Constraints
registerRoute({
  path: RoutingPath.Constraints,
  sidebar: 'constraints',
  name: 'Constraints',
  exact: true,
  component: () => <ConstraintList />,
});

registerRoute({
  path: RoutingPath.Constraint,
  sidebar: 'constraints',
  name: 'Constraint Details',
  exact: true,
  component: () => <ConstraintDetails />,
});

// Register routes for Violations
registerRoute({
  path: RoutingPath.Violations,
  sidebar: 'violations',
  name: 'Violations',
  exact: true,
  component: () => <ViolationsList />,
});

registerRoute({
  path: RoutingPath.Violation,
  sidebar: 'violations',
  name: 'Violation Details',
  exact: true,
  component: () => <ViolationsDetails />,
});

// Export plugin info for Headlamp recognition
export default {
  name: 'gatekeeper-headlamp-plugin',
  version: '0.1.0',
  description: 'Headlamp plugin for OPA Gatekeeper policies and violations',
};
