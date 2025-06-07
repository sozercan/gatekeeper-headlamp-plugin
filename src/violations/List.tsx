import {
  Link,
  Loader,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow} from '@mui/material';
import React, { useState } from 'react';
import { ConstraintClass } from '../model';
import { SimpleConstraintClass } from '../simpleModel';
import { Constraint, Violation } from '../types';

interface ViolationsListProps {}

interface ViolationWithConstraint extends Violation {
  constraintName: string;
  constraintKind: string;
  enforcementAction: string;
}

function ViolationsList({}: ViolationsListProps) {
  const [constraintObjects, setConstraintObjects] = useState<any[] | null>(null);

  console.log('🔍 ViolationsList component mounted');
  // Test both approaches  
  SimpleConstraintClass.useApiList((simpleData: any) => {
    console.log('🔧 ViolationsList SimpleConstraintClass received data:', simpleData);
    if (simpleData && simpleData.length > 0) {
      console.log('✅ Violations using simple approach data');
      setConstraintObjects(simpleData);
    }
  });

  ConstraintClass.useApiList((data) => {
    console.log('🎯 ViolationsList received constraint data:', data);
    if (!constraintObjects) { // Only use dynamic if simple didn't work
      setConstraintObjects(data);
    }
  });

  // Flatten violations from all constraints
  const violations: ViolationWithConstraint[] = React.useMemo(() => {
    if (!constraintObjects) return [];

    const allViolations: ViolationWithConstraint[] = [];

    constraintObjects.forEach((constraintObj: any) => {
      // Handle both KubeObject instances and raw constraint objects
      const constraint = constraintObj.jsonData ? (constraintObj.jsonData as Constraint) : (constraintObj as Constraint);

      if (constraint.status?.violations) {
        constraint.status.violations.forEach((violation) => {
          allViolations.push({
            ...violation,
            constraintName: constraint.metadata.name,
            constraintKind: constraint.kind,
            enforcementAction: constraint.spec?.enforcementAction || 'warn',
          });
        });
      }
    });

    console.log('Processed violations:', allViolations);
    return allViolations;
  }, [constraintObjects]);

  function makeEnforcementActionChip(violation: ViolationWithConstraint) {
    const action = violation.enforcementAction;
    const color = {
      deny: 'error',
      dryrun: 'warning',
      warn: 'info',
    }[action] as 'error' | 'warning' | 'info';

    return <Chip label={action} color={color} size="small" />;
  }

  function getResourceName(violation: ViolationWithConstraint) {
    return violation.namespace
      ? `${violation.namespace}/${violation.name}`
      : violation.name;
  }

  return (
    <SectionBox title="Violations">
      {!constraintObjects ? (
        <Loader title="Loading violations" />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Resource</TableCell>
                <TableCell>Kind</TableCell>
                <TableCell>Constraint</TableCell>
                <TableCell>Constraint Kind</TableCell>
                <TableCell>Enforcement</TableCell>
                <TableCell>Message</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {violations.map((violation, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Link
                      routeName="gatekeeper/violations/:kind/:name"
                      params={{
                        kind: violation.constraintKind,
                        name: violation.constraintName,
                      }}
                    >
                      {getResourceName(violation)}
                    </Link>
                  </TableCell>
                  <TableCell>{violation.kind}</TableCell>
                  <TableCell>
                    <Link
                      routeName="gatekeeper/constraints/:kind/:name"
                      params={{
                        kind: violation.constraintKind,
                        name: violation.constraintName,
                      }}
                    >
                      {violation.constraintName}
                    </Link>
                  </TableCell>
                  <TableCell>{violation.constraintKind}</TableCell>
                  <TableCell>{makeEnforcementActionChip(violation)}</TableCell>
                  <TableCell>{violation.message}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </SectionBox>
  );
}

export default ViolationsList;
