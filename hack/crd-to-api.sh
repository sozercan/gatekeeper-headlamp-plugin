#!/bin/bash

# Script to generate TypeScript types from Gatekeeper CRDs
# Based on the Kyverno plugin's approach

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
TYPES_DIR="$PROJECT_DIR/src/types"

echo "Generating TypeScript types for Gatekeeper CRDs..."

# Create types directory if it doesn't exist
mkdir -p "$TYPES_DIR"

# You can extend this script to fetch CRDs from a running cluster
# and generate types using tools like crdtotypes or similar

# For now, we'll use the manually created types
echo "Using manually defined types in $TYPES_DIR/index.ts"
echo "To auto-generate types from CRDs, you can:"
echo "1. Install crdtotypes: npm install -g crdtotypes"
echo "2. Fetch CRDs: kubectl get crd constrainttemplates.templates.gatekeeper.sh -o yaml > constrainttemplate-crd.yaml"
echo "3. Generate types: crdtotypes --input constrainttemplate-crd.yaml --output $TYPES_DIR/constrainttemplate.ts"

echo "Type generation completed!"
