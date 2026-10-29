export interface Dimensions {
    width: number;
    height: number;
}
export interface Placement {
    x: number;
    y: number;
    width: number;
    height: number;
}
export const laneCounts = [2, 4, 6] as const;
/** Layout uses a 1000-unit canvas. CSS container units make it responsive without
 * reading image sizes or recomputing geometry during scrolling. Appending items
 * never changes earlier positions; the same calculation runs at build and runtime. */
export function arrangeGallery(items: readonly Dimensions[], lanes: number) {
    const gap = lanes === 2 ? 28 : 14;
    const unit = (1000 - gap * (lanes - 1)) / lanes;
    const skyline = Array<number>(lanes).fill(0);
    let floor = 0;
    const placements: Placement[] = items.map(({ width, height }) => {
        if (!(width > 0 && height > 0 && Number.isFinite(width + height))) {
            throw new Error("Gallery layout requires finite, positive dimensions");
        }
        const canSpan = lanes > 2 || Math.max(...skyline) - Math.min(...skyline) <= 250;
        const span = width / height >= 1.15 && canSpan ? 2 : 1;
        let column = 0;
        let y = Infinity;
        for (let i = 0; i <= lanes - span; i++) {
            const candidate = Math.max(floor, ...skyline.slice(i, i + span));
            if (candidate < y) {
                column = i;
                y = candidate;
            }
        }
        const w = unit * span + gap * (span - 1);
        const h = w * height / width;
        for (let i = column; i < column + span; i++)
            skyline[i] = y + h + gap;
        floor = y;
        return { x: column * (unit + gap), y, width: w, height: h };
    });
    return { placements, height: Math.max(0, ...skyline) - (items.length ? gap : 0) };
}
export function galleryGeometry(items: readonly Dimensions[]) {
    const layouts = laneCounts.map(lanes => ({ lanes, ...arrangeGallery(items, lanes) }));
    return {
        canvas: layouts.map(l => `--height-${l.lanes}:${l.height / 10}cqw`).join(";"),
        cards: items.map((_, index) => layouts.map(l => {
            const p = l.placements[index];
            return `--x-${l.lanes}:${p.x / 10}%;--y-${l.lanes}:${p.y / 10}cqw;--w-${l.lanes}:${p.width / 10}%;--h-${l.lanes}:${p.height / 10}cqw`;
        }).join(";")),
    };
}
