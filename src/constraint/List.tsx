import {
  Link as HeadlampLink,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
} from '@mui/material';
import React, { useState, useEffect, useMemo } from 'react';
import { RoutingPath } from '../index';
import { ConstraintClass, ConstraintTemplateClass } from '../model';
import { Constraint } from '../types';

interface ConstraintListProps {}

function ConstraintList({}: ConstraintListProps) {
  const [constraints, setConstraints] = useState<any[] | null>(null);
  const [kindFilter, setKindFilter] = useState<string>('All');
  const [enforcementActionFilter, setEnforcementActionFilter] = useState<string>('All');
  const [uniqueKinds, setUniqueKinds] = useState<string[]>(['All']);
  const [uniqueEnforcementActions, setUniqueEnforcementActions] = useState<string[]>(['All']);

  console.log('🔍 [ConstraintList] component mounted');

  const handleSetConstraints = React.useCallback((data: any[] | null) => {
    console.log('🎯 [ConstraintList] ConstraintClass.useApiList received constraint data:', data);
    setConstraints(data);
  }, []); // Empty dependency array: callback is created once

  ConstraintClass.useApiList(handleSetConstraints);

  useEffect(() => {
    if (constraints) {
      const kinds = new Set<string>(['All']);
      const actions = new Set<string>(['All']);
      constraints.forEach(item => {
        const constraint = item.jsonData || item;
        if (constraint.kind) {
          kinds.add(constraint.kind);
        }
        actions.add(constraint.spec?.enforcementAction || 'warn');
      });
      setUniqueKinds(Array.from(kinds).sort());
      setUniqueEnforcementActions(Array.from(actions).sort());
    }
  }, [constraints]);

  const filteredConstraints = useMemo(() => {
    if (!constraints) return [];
    return constraints
      .map(item => (item.jsonData || item) as Constraint)
      .filter(constraint => {
        const kindMatch = kindFilter === 'All' || constraint.kind === kindFilter;
        const enforcementActionMatch = enforcementActionFilter === 'All' || (constraint.spec?.enforcementAction || 'warn') === enforcementActionFilter;
        return kindMatch && enforcementActionMatch;
      });
  }, [constraints, kindFilter, enforcementActionFilter]);

  if (!constraints) {
    console.log('⏳ [ConstraintList] Loading constraints...');
    return (
      <div>
        <Typography>Loading constraints...</Typography>
      </div>
    );
  }

  console.log('✅ Constraints loaded, count:', constraints.length);
  console.log('Applied filters - Kind:', kindFilter, 'Enforcement:', enforcementActionFilter);
  console.log('Filtered constraints count:', filteredConstraints.length);

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
      <Box sx={{ display: 'flex', gap: 2, p: 2, alignItems: 'center' }}>
        <FormControl sx={{ minWidth: 150 }} size="small">
          <InputLabel id="kind-filter-label">Kind</InputLabel>
          <Select
            labelId="kind-filter-label"
            value={kindFilter}
            label="Kind"
            onChange={(e) => setKindFilter(e.target.value as string)}
          >
            {uniqueKinds.map(kind => (
              <MenuItem key={kind} value={kind}>{kind}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel id="enforcement-action-filter-label">Enforcement Action</InputLabel>
          <Select
            labelId="enforcement-action-filter-label"
            value={enforcementActionFilter}
            label="Enforcement Action"
            onChange={(e) => setEnforcementActionFilter(e.target.value as string)}
          >
            {uniqueEnforcementActions.map(action => (
              <MenuItem key={action} value={action}>{action}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      {filteredConstraints.length === 0 ? (
        <Typography sx={{ padding: 2 }}>
          {constraints.length > 0 ? 'No constraints match the current filters.' : 'No constraints found.'}
        </Typography>
      ) : (
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
              {filteredConstraints.map((constraint) => (
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
      )}
    </SectionBox>
  );
}

export default ConstraintList;
