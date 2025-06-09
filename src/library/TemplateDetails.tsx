import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  TextField,
  Typography,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  SectionBox,
  Loader,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  KubeObjectInterface,
} from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import * as ApiProxy from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import yaml from 'js-yaml';

// Define a type for the structure of a library item (template)
interface LibraryTemplateFromState {
  id: string;
  name: string;
  description: string;
  rawYAML: string;
  sourceUrl: string;
}

interface ConstraintTemplate extends KubeObjectInterface {
  spec: {
    crd: {
      spec: {
        names: {
          kind: string;
          plural: string;
        };
        validation?: {
          openAPIV3Schema?: {
            properties: Record<string, any>;
          };
        };
      };
    };
    targets?: {
      target: string;
      rego: string;
      libs?: string[];
    }[];
  };
}

interface Constraint extends KubeObjectInterface {
  spec: {
    match?: any;
    parameters?: any;
  };
}

function LibraryTemplateDetails() {
  const { id: templateRouteId } = useParams<{ id: string }>();
  const location = useLocation();
  const state = location.state as { template: LibraryTemplateFromState }; // Type assertion for state

  console.log('[TemplateDetails] Component loaded. Route ID:', templateRouteId); // Add log here
  console.log('[TemplateDetails] Location object:', location); // Add log here
  console.log('[TemplateDetails] Received state:', state); // Add log here

  const [libraryTemplateItem, setLibraryTemplateItem] = useState<LibraryTemplateFromState | null>(null);
  const [parsedTemplate, setParsedTemplate] = useState<ConstraintTemplate | null>(null);
  const [constraintName, setConstraintName] = useState<string>('');
  const [constraintParams, setConstraintParams] = useState<string>('{}');
  const [matchCriteria, setMatchCriteria] = useState<string>(
    JSON.stringify(
      {
        kinds: [{ apiGroups: [''], kinds: ['Pod'] }], // Default to matching Pods in core group
      },
      null,
      2
    )
  );
  const [generatedConstraintYAML, setGeneratedConstraintYAML] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [applying, setApplying] = useState<boolean>(false);
  const [snackbarState, setSnackbarState] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  useEffect(() => {
    console.log('[TemplateDetails] useEffect triggered. State:', state, 'Route ID:', templateRouteId); // Add log here
    if (state && state.template && state.template.id === templateRouteId) {
      setLibraryTemplateItem(state.template);
      if (state.template.rawYAML) {
        try {
          const parsedDocs = yaml.loadAll(state.template.rawYAML) as any[];
          if (parsedDocs && parsedDocs.length > 0) {
            const pt = parsedDocs[0] as ConstraintTemplate;
            setParsedTemplate(pt);
            setConstraintName(`my-${pt.metadata.name?.toLowerCase() || state.template.id}-constraint`);

            // Pre-fill example parameters based on schema
            if (pt.spec.crd.spec.validation?.openAPIV3Schema?.properties) {
              const exampleParams: Record<string, any> = {};
              const props = pt.spec.crd.spec.validation.openAPIV3Schema.properties;
              for (const key in props) {
                // Basic type-based example generation
                if (props[key].type === 'string') exampleParams[key] = 'exampleValue';
                else if (props[key].type === 'integer' || props[key].type === 'number') exampleParams[key] = 123;
                else if (props[key].type === 'boolean') exampleParams[key] = true;
                else if (props[key].type === 'array') exampleParams[key] = ['item1', 'item2'];
                else if (props[key].type === 'object') exampleParams[key] = { prop: 'value' };
                else exampleParams[key] = null; // Default for other types
              }
              setConstraintParams(JSON.stringify(exampleParams, null, 2));
            } else {
              setConstraintParams('{}');
            }
          } else {
            setError('Failed to parse ConstraintTemplate YAML: No documents found.');
          }
        } catch (e: any) {
          setError(`Failed to parse ConstraintTemplate YAML: ${e.message}`);
        }
      } else {
        setError('No rawYAML found in template data.');
      }
    } else {
      setError('Template data not found or ID mismatch.');
      console.error('[TemplateDetails] Data mismatch or not found. State:', state, 'Expected ID:', templateRouteId); // Add log here
    }
    setLoading(false);
  }, [state, templateRouteId]);

  const handleGenerateConstraint = () => {
    if (!parsedTemplate) {
      setError('Cannot generate constraint: ConstraintTemplate not parsed.');
      return;
    }
    if (!constraintName.trim()) {
      setError('Constraint Name is required.');
      return;
    }

    let paramsObj;
    try {
      paramsObj = JSON.parse(constraintParams);
    } catch (e: any) {
      setError(`Invalid JSON in parameters: ${e.message}`);
      setGeneratedConstraintYAML(null);
      return;
    }

    let matchObj;
    try {
      matchObj = JSON.parse(matchCriteria);
    } catch (e: any) {
      setError(`Invalid JSON in match criteria: ${e.message}`);
      setGeneratedConstraintYAML(null);
      return;
    }

    const constraintCR: Omit<Constraint, 'status'> = {
      apiVersion: `constraints.gatekeeper.sh/v1beta1`,
      kind: parsedTemplate.spec.crd.spec.names.kind,
      metadata: {
        name: constraintName,
      },
      spec: {
        parameters: paramsObj,
        match: matchObj,
      },
    };

    try {
      const yamlOutput = yaml.dump(constraintCR);
      setGeneratedConstraintYAML(yamlOutput);
      setError(null); // Clear previous errors
    } catch (e: any) {
      setError(`Failed to generate Constraint YAML: ${e.message}`);
      setGeneratedConstraintYAML(null);
    }
  };

  const handleApplyTemplateAndConstraint = async () => {
    if (!libraryTemplateItem?.rawYAML || !generatedConstraintYAML || !parsedTemplate) {
      setSnackbarState({ open: true, message: 'Missing template YAML or generated constraint YAML.', severity: 'error' });
      return;
    }

    setApplying(true);
    setSnackbarState(prev => ({ ...prev, open: false }));

    try {
      let templateObjToApply: any;
      try {
        templateObjToApply = yaml.load(libraryTemplateItem.rawYAML);
      } catch (e: any) {
        throw new Error(`Invalid ConstraintTemplate YAML: ${e.message}`);
      }

      if (!templateObjToApply || !templateObjToApply.kind || !templateObjToApply.apiVersion) {
        throw new Error('Parsed template YAML is not a valid Kubernetes object.');
      }

      await ApiProxy.request(
        `/apis/templates.gatekeeper.sh/v1/constrainttemplates`,
        {
          method: 'POST',
          body: JSON.stringify(templateObjToApply),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      let successMessage = "ConstraintTemplate applied successfully! ";

      let constraintObjToApply: any;
      try {
        constraintObjToApply = yaml.load(generatedConstraintYAML);
      } catch (e: any) {
        throw new Error(`Invalid generated Constraint YAML: ${e.message}`);
      }

      if (!constraintObjToApply || !constraintObjToApply.kind || !constraintObjToApply.apiVersion) {
        throw new Error('Parsed constraint YAML is not a valid Kubernetes object.');
      }

      const constraintPlural = parsedTemplate.spec.crd.spec.names.plural.toLowerCase();
      const constraintApiVersion = constraintObjToApply.apiVersion;

      const constraintPostUrl = `/apis/${constraintApiVersion}/${constraintPlural}`;

      await ApiProxy.request(
        constraintPostUrl,
        {
          method: 'POST',
          body: JSON.stringify(constraintObjToApply),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      successMessage += "Constraint applied successfully!";
      setSnackbarState({ open: true, message: successMessage, severity: 'success' });

    } catch (err: any) {
      let errorMessage = err.message || 'Unknown error';
      if (err.json && err.json.message) {
        errorMessage = err.json.message;
      }
      setSnackbarState({ open: true, message: `Failed to apply: ${errorMessage}`, severity: 'error' });
    } finally {
      setApplying(false);
    }
  };

  const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarState(prev => ({ ...prev, open: false }));
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (!libraryTemplateItem || !libraryTemplateItem.rawYAML || (error && !parsedTemplate)) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h5" gutterBottom>
          Library Template Details
        </Typography>
        <Typography color="error">{error || "Could not load template details."}</Typography>
        {libraryTemplateItem?.sourceUrl && (
          <Typography sx={{mt: 1}}>
            Source: <a href={libraryTemplateItem.sourceUrl} target="_blank" rel="noopener noreferrer">{libraryTemplateItem.sourceUrl}</a>
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
              Library Template: {libraryTemplateItem.name}
      </Typography>
      {libraryTemplateItem.sourceUrl && (
        <Typography sx={{mb: 2}}>
          Source: <a href={libraryTemplateItem.sourceUrl} target="_blank" rel="noopener noreferrer">{libraryTemplateItem.sourceUrl}</a>
        </Typography>
      )}
      {error && !parsedTemplate && <Typography color="error" gutterBottom>Error: {error}</Typography>}

      <SectionBox title="ConstraintTemplate Definition">
        <Paper elevation={2} sx={{ p: 1, overflowX: 'auto' }}>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {libraryTemplateItem.rawYAML}
          </pre>
        </Paper>
      </SectionBox>

      {parsedTemplate && (
        <SectionBox title="Create Constraint from this Template" sx={{ mt: 2 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Constraint Details (Kind: {parsedTemplate.spec.crd.spec.names.kind})
            </Typography>
            <TextField
              label="Constraint Name"
              value={constraintName}
              onChange={(e) => setConstraintName(e.target.value)}
              fullWidth
              margin="normal"
              required
              error={!constraintName.trim()}
              helperText={!constraintName.trim() ? "Constraint name is required." : ""}
            />

            <Typography variant="subtitle1" sx={{ mt: 2, mb: 0.5 }}>Match Criteria (JSON):</Typography>
            <TextField
              label="Match Criteria (JSON format)"
              value={matchCriteria}
              onChange={(e) => setMatchCriteria(e.target.value)}
              multiline
              rows={5}
              fullWidth
              margin="normal"
              variant="outlined"
              InputProps={{
                style: { fontFamily: 'monospace' }
              }}
            />

            <Typography variant="subtitle1" sx={{ mt: 1, mb: 0.5 }}>Parameters (JSON):</Typography>
            {parsedTemplate.spec.crd.spec.validation?.openAPIV3Schema?.properties && (
              <Box mb={1}>
                <TextField
                  label="Parameters (JSON format)"
                  value={constraintParams}
                  onChange={(e) => setConstraintParams(e.target.value)}
                  multiline
                  rows={5}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  InputProps={{
                    style: { fontFamily: 'monospace' }
                  }}
                />
              </Box>
            )}

            <Button
              variant="contained"
              color="primary"
              onClick={handleGenerateConstraint}
              sx={{ mt: 2, mr: 1 }}
              disabled={!constraintName || !constraintParams || !matchCriteria || !parsedTemplate}
            >
              Preview Constraint YAML
            </Button>
          </Paper>
        </SectionBox>
      )}

      {generatedConstraintYAML && (
        <SectionBox title="Generated Constraint YAML" sx={{ mt: 2 }}>
          <Paper elevation={2} sx={{ p: 1, overflowX: 'auto' }}>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {generatedConstraintYAML}
            </pre>
          </Paper>
        </SectionBox>
      )}

      {(libraryTemplateItem.rawYAML || generatedConstraintYAML) && parsedTemplate && (
        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', alignItems: 'start' }}>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleApplyTemplateAndConstraint}
            disabled={applying || !libraryTemplateItem.rawYAML || (parsedTemplate && !generatedConstraintYAML)}
            startIcon={applying ? <CircularProgress size={20} /> : null}
          >
            {applying ? 'Applying...' : 'Apply Template & Constraint to Cluster'}
          </Button>
        </Box>
      )}

      <Snackbar
        open={snackbarState.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarState.severity} sx={{ width: '100%' }}>
          {snackbarState.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default LibraryTemplateDetails;
