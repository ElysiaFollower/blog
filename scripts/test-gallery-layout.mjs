import assert from 'node:assert/strict';
import { arrangeGallery } from '../src/components/gallery/layout.ts';
const items = Array.from({length:300}, (_, i) => ({width:[150,1920,720,800,240,2160][i%6],height:[150,1080,1600,1000,144,1000][i%6]}));
for (const lanes of [2,4,6]) {
  const full = arrangeGallery(items, lanes);
  const partial = arrangeGallery(items.slice(0,24), lanes);
  assert.deepEqual(full.placements.slice(0,24), partial.placements, 'Appending must preserve prior positions');
  full.placements.forEach((p,i) => {
    assert.ok(p.x >= 0 && p.x+p.width <= 1000.001 && p.y >= 0, 'Cards remain within canvas');
    assert.ok(Math.abs(p.width/p.height-items[i].width/items[i].height) < 1e-8, 'No cropping or distortion');
    if (i) assert.ok(p.y >= full.placements[i-1].y, 'Reading order progresses downwards');
    for (const q of full.placements.slice(0,i)) {
      assert.ok(p.x+p.width <= q.x+.001 || q.x+q.width <= p.x+.001 || p.y+p.height <= q.y+.001 || q.y+q.height <= p.y+.001, 'Cards cannot overlap');
    }
  });
  assert.equal(arrangeGallery([],lanes).height,0);
}
assert.throws(()=>arrangeGallery([{width:0,height:10}],2));
console.log('Gallery layout: ratios, bounds, no overlap, stable append and reading order passed at 2/4/6 lanes.');
