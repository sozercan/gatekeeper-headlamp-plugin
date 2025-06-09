import {
  Link as HeadlampLink,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from '@mui/material';
import React, { useState, useMemo } from 'react';
import { RoutingPath } from '../index';
import { ConstraintTemplateClass } from '../model';
import { ConstraintTemplate } from '../types';

interface ConstraintTemplateListProps {}

function ConstraintTemplateList({}: ConstraintTemplateListProps) {
  const [constraintTemplates, setConstraintTemplates] = useState<KubeObject[] | null>(null);
  const [selectedTargetFilter, setSelectedTargetFilter] = useState<string>('');

  ConstraintTemplateClass.useApiList(setConstraintTemplates);

  const uniqueTargets = useMemo(() => {
    if (!constraintTemplates) return [];
    const allTargets = new Set<string>();
    constraintTemplates.forEach(ctObj => {
      const template = ctObj.jsonData as ConstraintTemplate;
      template.spec?.targets?.forEach(targetSpec => {
        if (targetSpec.target) {
          allTargets.add(targetSpec.target);
        }
      });
    });
    return ['', ...Array.from(allTargets).sort()]; // Add '' for "All Targets"
  }, [constraintTemplates]);

  const handleTargetFilterChange = (event: SelectChangeEvent<string>) => {
    setSelectedTargetFilter(event.target.value as string);
  };

  if (!constraintTemplates) {
    return <Typography>Loading constraint templates...</Typography>;
  }

  const templates = constraintTemplates
    .map((item: KubeObject) => item.jsonData as ConstraintTemplate)
    .filter(template => {
      if (!selectedTargetFilter) return true; // Show all if no filter selected
      return template.spec?.targets?.some(targetSpec => targetSpec.target === selectedTargetFilter);
    });

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
      <Box sx={{ marginBottom: 2, maxWidth: 300 }}>
        <FormControl fullWidth size="small">
          <InputLabel id="target-filter-label">Filter by Target</InputLabel>
          <Select
            labelId="target-filter-label"
            id="target-filter-select"
            value={selectedTargetFilter}
            label="Filter by Target"
            onChange={handleTargetFilterChange}
          >
            {uniqueTargets.map(target => (
              <MenuItem key={target || 'all'} value={target}>
                {target || 'All Targets'}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      {templates.length === 0 && constraintTemplates.length > 0 ? (
        <Typography sx={{ padding: 2 }}>
          No constraint templates found for the selected target.
        </Typography>
      ) : templates.length === 0 && constraintTemplates.length === 0 ? (
        <Typography sx={{ padding: 2 }}>No constraint templates found.</Typography>
      ) : (
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
      )}
    </SectionBox>
  );
}

export default ConstraintTemplateList;
