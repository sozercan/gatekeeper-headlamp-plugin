import {
  Link as HeadlampLink,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import { Chip, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import React, { useState } from 'react';
import { RoutingPath } from '../index';
import { ConstraintClass } from '../model';
import { Constraint } from '../types';

interface ConstraintListProps {}

function ConstraintList({}: ConstraintListProps) {
  const [constraints, setConstraints] = useState<KubeObject[] | null>(null);

  ConstraintClass.useApiList(setConstraints);

  if (!constraints) {
    return <Typography>Loading constraints...</Typography>;
  }

  const constraintList = constraints.map((item: KubeObject) => item.jsonData as Constraint);

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
