import {
  Link as HeadlampLink,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Chip, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import React, { useState } from 'react';
import { RoutingPath } from '../index';
import { ConstraintClass, ConstraintTemplateClass } from '../model';
import { SimpleConstraintClass } from '../simpleModel';
import { Constraint } from '../types';

interface ConstraintListProps {}

function ConstraintList({}: ConstraintListProps) {
  const [constraints, setConstraints] = useState<any[] | null>(null);
  const [templates, setTemplates] = useState<any[] | null>(null);

  console.log('🔍 ConstraintList component mounted');

  // Test ConstraintTemplates API first
  ConstraintTemplateClass.useApiList((templateData: any) => {
    console.log('📋 Templates data received:', templateData);
    setTemplates(templateData);
  });

  // Test both approaches
  SimpleConstraintClass.useApiList((simpleData: any) => {
    console.log('🔧 SimpleConstraintClass received data:', simpleData);
    if (simpleData && simpleData.length > 0) {
      console.log('✅ Simple approach worked, using simple data');
      setConstraints(simpleData);
    }
  });

  ConstraintClass.useApiList((data) => {
    console.log('🎯 ConstraintClass received data:', data);
    if (!constraints) { // Only use dynamic if simple didn't work
      setConstraints(data);
    }
  });

  console.log('📊 Current constraints state:', constraints);
  console.log('📋 Current templates state:', templates);

  if (!constraints) {
    console.log('⏳ Loading constraints...');
    return (
      <div>
        <Typography>Loading constraints...</Typography>
        {templates && (
          <Typography variant="caption" color="textSecondary">
            Found {templates.length} constraint templates
          </Typography>
        )}
      </div>
    );
  }

  console.log('✅ Constraints loaded, count:', constraints.length);

  // Handle both KubeObject instances and raw constraint objects
  const constraintList = constraints.map((item: any) => {
    // If it's a KubeObject with jsonData, extract that
    if (item.jsonData) {
      return item.jsonData as Constraint;
    }
    // Otherwise, treat it as a raw constraint object
    return item as Constraint;
  });

  function makeEnforcementActionChip(item: Constraint) {
    const action = item.spec?.enforcementAction || 'warn';
    const color = {
      deny: 'error',
      dryrun: 'warning',
      warn: 'info',
    }[action] as 'error' | 'warning' | 'info';

    return <Chip label={action} color={color} size="small" />;
  }

  function getViolationCount(item: Constraint) {
    return item.status?.totalViolations?.toString() || '0';
  }

  function getMatchedKinds(item: Constraint) {
    if (!item.spec?.match?.kinds) {
      return '';
    }
    return item.spec.match.kinds
      .map(kind => kind.kinds.join(', '))
      .join('; ');
  }

  return (
    <SectionBox title="Constraints">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Kind</TableCell>
            <TableCell>Enforcement Action</TableCell>
            <TableCell>Matched Kinds</TableCell>
            <TableCell>Violations</TableCell>
            <TableCell>Age</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {constraintList.map((constraint) => (
            <TableRow key={`${constraint.kind}-${constraint.metadata.name}`}>
              <TableCell>
                <HeadlampLink
                  routeName={RoutingPath.Constraint}
                  params={{
                    kind: constraint.kind,
                    name: constraint.metadata.name,
                  }}
                >
                  {constraint.metadata.name}
                </HeadlampLink>
              </TableCell>
              <TableCell>{constraint.kind}</TableCell>
              <TableCell>{makeEnforcementActionChip(constraint)}</TableCell>
              <TableCell>{getMatchedKinds(constraint)}</TableCell>
              <TableCell>{getViolationCount(constraint)}</TableCell>
              <TableCell>{constraint.metadata.creationTimestamp}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionBox>
  );
}

export default ConstraintList;
