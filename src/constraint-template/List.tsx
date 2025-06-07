import {
  Link as HeadlampLink,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import { Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import React, { useState } from 'react';
import { RoutingPath } from '../index';
import { ConstraintTemplateClass } from '../model';
import { ConstraintTemplate } from '../types';

interface ConstraintTemplateListProps {}

function ConstraintTemplateList({}: ConstraintTemplateListProps) {
  const [constraintTemplates, setConstraintTemplates] = useState<KubeObject[] | null>(null);

  ConstraintTemplateClass.useApiList(setConstraintTemplates);

  if (!constraintTemplates) {
    return <Typography>Loading constraint templates...</Typography>;
  }

  const templates = constraintTemplates.map((item: KubeObject) => item.jsonData as ConstraintTemplate);

  function makeStatusLabel(item: ConstraintTemplate) {
    const status = item.status;
    if (!status) {
      return 'Unknown';
    }
    return status.created ? 'Ready' : 'Not Ready';
  }

  function getTargets(item: ConstraintTemplate) {
    return item.spec?.targets?.map(target => target.target).join(', ') || '';
  }

  return (
    <SectionBox title="Constraint Templates">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Kind</TableCell>
            <TableCell>Targets</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Age</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {templates.map((template) => (
            <TableRow key={template.metadata.name}>
              <TableCell>
                <HeadlampLink
                  routeName={RoutingPath.ConstraintTemplate}
                  params={{
                    name: template.metadata.name,
                  }}
                >
                  {template.metadata.name}
                </HeadlampLink>
              </TableCell>
              <TableCell>{template.spec?.crd?.spec?.names?.kind || ''}</TableCell>
              <TableCell>{getTargets(template)}</TableCell>
              <TableCell>{makeStatusLabel(template)}</TableCell>
              <TableCell>{template.metadata.creationTimestamp}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionBox>
  );
}

export default ConstraintTemplateList;
