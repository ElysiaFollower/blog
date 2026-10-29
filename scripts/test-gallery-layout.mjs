import assert from 'node:assert/strict';
import { arrangeGallery } from '../src/components/gallery/layout.ts';
const items = Array.from({length:300}, (_, i) => ({width:[150,1920,720,800,240,2160][i%6],height:[150,1080,1600,1000,144,1000][i%6]}));
for (const lanes of [2,4,6]) {
  const full = arrangeGallery(items, lanes);
  const partial = arrangeGallery(items.slice(0,24), lanes);
  const gap = lanes === 2 ? 28 : 14;
  const backtrackLimit = 1.5 * (1000-gap*(lanes-1))/lanes;
  let highestTop = 0;
  assert.deepEqual(full.placements.slice(0,24), partial.placements, 'Appending must preserve prior positions');
  full.placements.forEach((p,i) => {
    assert.ok(p.x >= 0 && p.x+p.width <= 1000.001 && p.y >= 0, 'Cards remain within canvas');
    assert.ok(Math.abs(p.width/p.height-items[i].width/items[i].height) < 1e-8, 'No cropping or distortion');
    assert.ok(p.y >= highestTop-backtrackLimit-.001, 'Backfill stays near the current reading position');
    highestTop = Math.max(highestTop,p.y);
    for (const q of full.placements.slice(0,i)) {
      assert.ok(p.x+p.width <= q.x+.001 || q.x+q.width <= p.x+.001 || p.y+p.height <= q.y+.001 || q.y+q.height <= p.y+.001, 'Cards cannot overlap');
    }
  });
  assert.equal(arrangeGallery([],lanes).height,0);
}
const valley = arrangeGallery([
  {width:100,height:100}, {width:100,height:200},
  {width:1920,height:1080}, {width:1920,height:1080},
  {width:100,height:100},
],4).placements;
assert.ok(valley[4].y < valley[3].y, 'A later narrow work can fill a nearby valley');
const squareSizes = arrangeGallery([{width:150,height:150},{width:1080,height:1080}],6).placements;
assert.ok(squareSizes[0].width < squareSizes[1].width, 'A tiny square source is not promoted to a large focal work');
assert.throws(()=>arrangeGallery([{width:0,height:10}],2));
console.log('Gallery layout: ratios, bounds, no overlap, stable append and bounded backfill passed at 2/4/6 lanes.');
