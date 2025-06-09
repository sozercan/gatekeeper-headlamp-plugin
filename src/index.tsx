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
import LibraryList from './library/List';
import LibraryTemplateDetails from './library/TemplateDetails';

export namespace RoutingPath {
  export const ConstraintTemplates = '/gatekeeper/constraint-templates';
  export const ConstraintTemplate = '/gatekeeper/constraint-templates/:name';
  export const Constraints = '/gatekeeper/constraints';
  export const Constraint = '/gatekeeper/constraints/:kind/:name';
  export const Violations = '/gatekeeper/violations';
  export const Violation = '/gatekeeper/violations/:kind/:name';
  export const Library = '/gatekeeper/library'; // Added Library path
  export const LibraryTemplate = '/gatekeeper/library/template/:id'; // Added Library Template path
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

// Added SidebarEntry for Policy Library
registerSidebarEntry({
  parent: 'gatekeeper',
  name: 'policylibrary',
  label: 'Policy Library',
  url: RoutingPath.Library,
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
  name: 'Constraint Template Details',
  exact: true,
  sidebar: null,
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
  name: 'Constraint Details',
  exact: true,
  sidebar: 'constraints', // Changed from null
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
  name: 'Violation Details',
  exact: true,
  sidebar: null,
  component: () => <ViolationsDetails />,
});

// Routes for the Gatekeeper Library
registerRoute({
  path: RoutingPath.Library,
  name: 'Policy Library', // Name for the route itself
  sidebar: 'policylibrary', // Matches name in registerSidebarEntry
  exact: true, // Add exact: true here
  component: LibraryList,
});

registerRoute({
  path: RoutingPath.LibraryTemplate,
  name: 'Library Template Details', // Name for the route
  sidebar: 'policylibrary', // Changed from null
  exact: true, // Add exact: true here
  component: LibraryTemplateDetails,
});

// Export plugin info for Headlamp recognition
export default {
  name: 'gatekeeper-headlamp-plugin',
  version: '0.1.0',
  description: 'Headlamp plugin for OPA Gatekeeper policies and violations',
};
