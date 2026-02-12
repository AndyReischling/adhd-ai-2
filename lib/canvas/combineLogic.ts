import { CanvasAsset } from '@/types';

const PROXIMITY_THRESHOLD = 80; // pixels

/**
 * Check if two assets are close enough to combine
 */
export function checkCombineProximity(
  assetA: CanvasAsset,
  assetB: CanvasAsset
): boolean {
  const centerAx = assetA.position.x + assetA.width / 2;
  const centerAy = assetA.position.y + assetA.height / 2;
  const centerBx = assetB.position.x + assetB.width / 2;
  const centerBy = assetB.position.y + assetB.height / 2;

  const dx = Math.abs(centerAx - centerBx);
  const dy = Math.abs(centerAy - centerBy);

  return (
    dx < (assetA.width + assetB.width) / 2 + PROXIMITY_THRESHOLD &&
    dy < (assetA.height + assetB.height) / 2 + PROXIMITY_THRESHOLD
  );
}

/**
 * Find the closest overlapping asset (if any) to a given asset
 */
export function findCombineTarget(
  draggedAsset: CanvasAsset,
  allAssets: CanvasAsset[]
): CanvasAsset | null {
  let closest: CanvasAsset | null = null;
  let closestDist = Infinity;

  for (const other of allAssets) {
    if (other.id === draggedAsset.id) continue;
    if (!checkCombineProximity(draggedAsset, other)) continue;

    const dx = draggedAsset.position.x - other.position.x;
    const dy = draggedAsset.position.y - other.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < closestDist) {
      closestDist = dist;
      closest = other;
    }
  }

  return closest;
}
