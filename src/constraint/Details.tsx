import {
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import { Box, Chip, Table, TableBody, TableCell, TableHead, TableRow,Typography } from '@mui/material';
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ConstraintClass } from '../model';
import { Constraint } from '../types';

interface ConstraintDetailsProps {}

function ConstraintDetails({}: ConstraintDetailsProps) {
  const { name } = useParams<{ kind: string; name: string }>();
  const [item, setItem] = useState<KubeObject | null>(null);

  ConstraintClass.useApiGet(setItem, name);

  if (!item) {
    return <Typography>Loading constraint details...</Typography>;
  }

  const constraint = item.jsonData as Constraint;

  function getMainInfoRows() {
    const action = constraint.spec?.enforcementAction || 'warn';
    const actionColor = {
      deny: 'error',
      dryrun: 'warning',
      warn: 'info',
    }[action] as 'error' | 'warning' | 'info';

    return [
      {
        name: 'Name',
        value: constraint.metadata.name,
      },
      {
        name: 'Kind',
        value: constraint.kind,
      },
      {
        name: 'Created',
        value: constraint.metadata.creationTimestamp,
      },
      {
        name: 'Enforcement Action',
        value: <Chip label={action} color={actionColor} size="small" />,
      },
      {
        name: 'Total Violations',
        value: constraint.status?.totalViolations?.toString() || '0',
      },
      {
        name: 'Last Audit',
        value: constraint.status?.auditTimestamp || 'Never',
      },
    ];
  }

  function getMatchRules() {
    if (!constraint.spec?.match) {
      return [];
    }

    const match = constraint.spec.match;
    const rules = [];

    if (match.kinds) {
      match.kinds.forEach((kindRule, index) => {
        rules.push({
          Property: 'API Groups',
          Value: kindRule.apiGroups.join(', '),
          Index: `kinds-${index}-apiGroups`,
        });
        rules.push({
          Property: 'Kinds',
          Value: kindRule.kinds.join(', '),
          Index: `kinds-${index}-kinds`,
        });
      });
    }

    if (match.excludedNamespaces) {
      rules.push({
        Property: 'Excluded Namespaces',
        Value: match.excludedNamespaces.join(', '),
        Index: 'excludedNamespaces',
      });
    }

    return rules;
  }

  function getViolationRows() {
    if (!constraint.status?.violations) {
      return [];
    }

    return constraint.status.violations.map((violation, index) => ({
      Resource: `${violation.kind}/${violation.name}`,
      Namespace: violation.namespace || 'cluster-scoped',
      Message: violation.message,
      Index: index,
    }));
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {constraint.metadata.name}
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        {constraint.kind} Constraint
      </Typography>

      <SectionBox title="Overview">
        <Table>
          <TableBody>
            {getMainInfoRows().map((row) => (
              <TableRow key={row.name}>
                <TableCell component="th" scope="row">
                  {row.name}
                </TableCell>
                <TableCell>{row.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionBox>

      <SectionBox title="Match Rules">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Property</TableCell>
              <TableCell>Value</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {getMatchRules().map((row) => (
              <TableRow key={row.Index}>
                <TableCell>{row.Property}</TableCell>
                <TableCell>{row.Value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionBox>

      <SectionBox title={`Violations (${constraint.status?.totalViolations || 0})`}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Resource</TableCell>
              <TableCell>Namespace</TableCell>
              <TableCell>Message</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {getViolationRows().map((row) => (
              <TableRow key={row.Index}>
                <TableCell>{row.Resource}</TableCell>
                <TableCell>{row.Namespace}</TableCell>
                <TableCell>{row.Message}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionBox>
    </Box>
  );
}

export default ConstraintDetails;
