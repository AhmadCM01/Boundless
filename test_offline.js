import * as Y from 'yjs';

console.log('🧪 Testing Yjs CRDT Offline Delta Resync semantics...');

// Client A Doc & Client B Doc
const docA = new Y.Doc();
const docB = new Y.Doc();

const mapA = docA.getMap('objects');
const mapB = docB.getMap('objects');

// Simulate initial sync between A and B
mapA.set('shape_1', { id: 'shape_1', type: 'shape', x: 100, y: 100, fill: '#6366f1' });
const initialUpdate = Y.encodeStateAsUpdate(docA);
Y.applyUpdate(docB, initialUpdate);

console.log('✅ Initial sync: Client A & B both have shape_1');

// Simulate Client A going offline and making 3 local edits
console.log('📶 Client A goes offline. Making 3 local edits...');
mapA.set('shape_2', { id: 'shape_2', type: 'shape', x: 200, y: 200, fill: '#ef4444' });
mapA.set('sticky_1', { id: 'sticky_1', type: 'sticky', text: 'Offline note', color: '#fef08a' });
mapA.set('text_1', { id: 'text_1', type: 'text', text: 'Offline text edit' });

// Verify Client B does not have offline edits yet
if (mapB.size === 1) {
  console.log('✅ Client B correctly isolated while Client A is offline (1 object)');
} else {
  console.error('❌ Isolation failure');
  process.exit(1);
}

// Simulate Client A reconnecting and syncing delta update to Client B
console.log('🌐 Client A reconnects! Flushing Yjs CRDT delta to Client B...');
const stateVectorB = Y.encodeStateVector(docB);
const diffUpdateA = Y.encodeStateAsUpdate(docA, stateVectorB);
Y.applyUpdate(docB, diffUpdateA);

// Verify Client B has all 4 objects with no duplicates
console.log(`✅ Client B synced! Total objects in Map B: ${mapB.size} (Expected: 4)`);
if (mapB.size === 4 && mapB.has('shape_2') && mapB.has('sticky_1') && mapB.has('text_1')) {
  console.log('🎉 TIER 2 OFFLINE RESILIENCE TEST PASSED 100% WITH ZERO DUPLICATES OR GHOST OBJECTS!');
  process.exit(0);
} else {
  console.error('❌ Resync mismatch');
  process.exit(1);
}
