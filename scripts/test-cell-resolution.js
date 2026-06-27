const { resolveCellToCoords } = require('../utils/cellResolver');

async function runTests() {
  console.log('--- STARTING CELL RESOLVER TESTS ---');

  // Test Case 1: Mock Cell ID 162566930
  console.log('\n[Test 1] Testing Mock Cell ID 162566930...');
  const res1 = await resolveCellToCoords(404, 10, null, 162566930);
  if (res1 && res1.latitude === 28.5099302 && res1.longitude === 77.3807299) {
    console.log('✅ Test 1 Passed: Correctly resolved mock Cell ID 162566930 locally');
  } else {
    console.error('❌ Test 1 Failed: Got', res1);
  }

  // Test Case 2: Mock Cell ID 162566940
  console.log('\n[Test 2] Testing Mock Cell ID 162566940...');
  const res2 = await resolveCellToCoords(404, 10, null, 162566940);
  if (res2 && res2.latitude === 28.5125 && res2.longitude === 77.3845) {
    console.log('✅ Test 2 Passed: Correctly resolved mock Cell ID 162566940 locally');
  } else {
    console.error('❌ Test 2 Failed: Got', res2);
  }

  // Test Case 2.1: Mock Cell ID 239366970
  console.log('\n[Test 2.1] Testing Mock Cell ID 239366970...');
  const res21 = await resolveCellToCoords(404, 10, null, 239366970);
  if (res21 && res21.latitude === 28.507542 && res21.longitude === 77.377810) {
    console.log('✅ Test 2.1 Passed: Correctly resolved mock Cell ID 239366970 locally');
  } else {
    console.error('❌ Test 2.1 Failed: Got', res21);
  }

  // Test Case 2.2: Mock Cell ID 234709545
  console.log('\n[Test 2.2] Testing Mock Cell ID 234709545...');
  const res22 = await resolveCellToCoords(404, 10, null, 234709545);
  if (res22 && res22.latitude === 28.5160 && res22.longitude === 77.3880) {
    console.log('✅ Test 2.2 Passed: Correctly resolved mock Cell ID 234709545 locally');
  } else {
    console.error('❌ Test 2.2 Failed: Got', res22);
  }

  // Test Case 3: Unknown Cell ID (Should call OpenCellID and return null since it does not exist)
  console.log('\n[Test 3] Testing Unknown Cell ID 999999999...');
  const res3 = await resolveCellToCoords(404, 10, 100, 999999999);
  if (res3 === null) {
    console.log('✅ Test 3 Passed: Unknown Cell ID returned null gracefully');
  } else {
    console.error('❌ Test 3 Failed: Got coordinates for non-existent cell ID:', res3);
  }

  // Test Case 4: Invalid cellId input
  console.log('\n[Test 4] Testing Invalid Cell ID input...');
  const res4 = await resolveCellToCoords(404, 10, 100, 'invalid-id');
  if (res4 === null) {
    console.log('✅ Test 4 Passed: Invalid cell ID returned null gracefully');
  } else {
    console.error('❌ Test 4 Failed: Got', res4);
  }

  console.log('\n--- ALL CELL RESOLVER TESTS COMPLETED ---');
}

runTests().catch(err => {
  console.error('Test run crashed:', err);
  process.exit(1);
});
