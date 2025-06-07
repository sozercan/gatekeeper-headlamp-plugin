import {
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import { Box, Table, TableBody, TableCell, TableHead, TableRow,Typography } from '@mui/material';
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ConstraintTemplateClass } from '../model';
import { ConstraintTemplate } from '../types';

interface ConstraintTemplateDetailsProps {}

function ConstraintTemplateDetails({}: ConstraintTemplateDetailsProps) {
  const { name } = useParams<{ name: string }>();
  const [item, setItem] = useState<KubeObject | null>(null);

  ConstraintTemplateClass.useApiGet(setItem, name);

  if (!item) {
    return <Typography>Loading constraint template details...</Typography>;
  }

  const constraintTemplate = item.jsonData as ConstraintTemplate;

  function getMainInfoRows() {
    return [
      {
        name: 'Name',
        value: constraintTemplate.metadata.name,
      },
      {
        name: 'Created',
        value: constraintTemplate.metadata.creationTimestamp,
      },
      {
        name: 'Kind',
        value: constraintTemplate.spec?.crd?.spec?.names?.kind || '',
      },
      {
        name: 'Plural',
        value: constraintTemplate.spec?.crd?.spec?.names?.plural || '',
      },
      {
        name: 'Status',
        value: constraintTemplate.status?.created ? 'Ready' : 'Not Ready',
      },
    ];
  }

  function getTargetRows() {
    if (!constraintTemplate.spec?.targets) {
      return [];
    }

    return constraintTemplate.spec.targets.map((target) => ({
      Target: target.target,
      'Has Rego': target.rego ? 'Yes' : 'No',
      'Has Libs': target.libs && target.libs.length > 0 ? 'Yes' : 'No',
    }));
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {constraintTemplate.metadata.name}
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        Constraint Template
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

      <SectionBox title="Targets">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Target</TableCell>
              <TableCell>Has Rego</TableCell>
              <TableCell>Has Libs</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {getTargetRows().map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.Target}</TableCell>
                <TableCell>{row['Has Rego']}</TableCell>
                <TableCell>{row['Has Libs']}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionBox>
    </Box>
  );
}

export default ConstraintTemplateDetails;
