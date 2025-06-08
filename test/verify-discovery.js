// Simple verification script for constraint discovery
async function testDiscovery() {
  console.log('🧪 Testing constraint discovery logic...');

  try {
    // Simulate the discoverConstraintTypes function
    const { execSync } = require('child_process');

    console.log('🔍 Getting constraint templates...');
    const templatesOutput = execSync('kubectl get constrainttemplates -o json', { encoding: 'utf8' });
    const templates = JSON.parse(templatesOutput);

    console.log('📋 Found', templates.items?.length || 0, 'constraint templates');

    const constraintTypes = templates.items?.map(template => {
      const kind = template.spec?.crd?.spec?.names?.kind;
      const plural = template.spec?.crd?.spec?.names?.plural;

      console.log(`   - Template: ${template.metadata.name}`);
      console.log(`     Kind: ${kind}`);
      console.log(`     Plural: ${plural}`);

      // Prefer plural name, fallback to kind converted to lowercase
      if (plural) {
        return plural.toLowerCase();
      } else if (kind) {
        return kind.toLowerCase();
      }
      return null;
    }).filter(Boolean) || [];

    console.log('🎯 Discovered constraint types:', constraintTypes);

    // Test fetching constraints for each type
    let totalConstraints = 0;
    let totalViolations = 0;

    for (const type of constraintTypes) {
      try {
        console.log(`📡 Fetching constraints of type: ${type}`);
        const constraintsOutput = execSync(`kubectl get ${type} -o json`, { encoding: 'utf8' });
        const constraints = JSON.parse(constraintsOutput);

        const count = constraints.items?.length || 0;
        totalConstraints += count;

        let typeViolations = 0;
        constraints.items?.forEach(constraint => {
          typeViolations += constraint.status?.totalViolations || 0;
        });
        totalViolations += typeViolations;

        console.log(`📊 Type ${type}: ${count} constraints, ${typeViolations} violations`);

        // Show constraint details
        constraints.items?.forEach(constraint => {
          console.log(`   - ${constraint.metadata.name} (${constraint.spec?.enforcementAction || 'warn'})`);
        });

      } catch (error) {
        console.log(`❌ Failed to fetch constraints for type ${type}:`, error.message);
      }
    }

    console.log('');
    console.log('📈 SUMMARY:');
    console.log(`   - Constraint Types: ${constraintTypes.length}`);
    console.log(`   - Total Constraints: ${totalConstraints}`);
    console.log(`   - Total Violations: ${totalViolations}`);
    console.log('');
    console.log('✅ Discovery test completed successfully!');

  } catch (error) {
    console.error('❌ Discovery test failed:', error.message);
  }
}

testDiscovery();
