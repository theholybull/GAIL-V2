# Gail Baseline Lock And Temporary Hair Swap - 2026-04-22

## Baseline Lock

The active `work-lite` runtime baseline is now locked to the restored transcript-backed state from:

- `docs/WORKING_COPY_CHAT_RECORD_2026-04-22.md`

That means:

- no new runtime/code experiments were added after the revert
- the live C: runtime was brought back to match the D: baseline for:
  - `playcanvas-app/src/work-lite-rebuild.ts`
  - `playcanvas-app/index.html`
  - `backend/services/client-runtime-settings-service.ts`
  - `backend/dist/backend/services/client-runtime-settings-service.js`
- `GET /client/runtime-settings` is back on `activeAssetRoot: "gail"`

## Temporary Gail Hair Workaround

The operator requested that the restored baseline stay in place and that Gail's current hair be removed from the normal persona path for now.

Implemented workaround:

- kept the Gail hair slot/id contract unchanged: `meili_hair`
- replaced the asset file behind that slot with Cherry hair
- did not change runtime code, wardrobe preset ids, or manifest ids

Active swap paths:

- source hair:
  - `playcanvas-app/assets/gail/girlfriend/hair/cherry_hair.glb`
- temporary Gail hair target:
  - `playcanvas-app/assets/gail/hair/meili_hair/meili_hair.glb`

Applied to both working copies:

- `D:\Gail 2.1\working_copy`
- `C:\Users\bate_\OneDrive\Desktop\Gail 2.1\working_copy`

## Verification

Verified after swap:

- active D: `meili_hair.glb` SHA256:
  - `14D1D355E92174E56FDE85592D6199E12F663D47B98C7D54E5A723E8FB9AA0D2`
- active C: `meili_hair.glb` SHA256:
  - `14D1D355E92174E56FDE85592D6199E12F663D47B98C7D54E5A723E8FB9AA0D2`
- Cherry source `cherry_hair.glb` SHA256:
  - `14D1D355E92174E56FDE85592D6199E12F663D47B98C7D54E5A723E8FB9AA0D2`
- live manifest proof:
  - `GET /client/asset-manifest?assetRoot=gail`
  - `meili_hair` still resolves at `playcanvas-app/assets/gail/hair/meili_hair/meili_hair.glb`
  - `meili_hair.fileSizeBytes = 36483732`

## Follow-Up Correction

The first visible-check failure after the `gail/.../meili_hair.glb` swap was explained by the locked client behavior:

- the normal route still resolves Gail through `gail_lite`
- `work-lite` keeps the transcript-backed `resolveEffectiveAssetRoot(...)` behavior
- live proof:
  - `GET /client/asset-manifest?assetRoot=gail_lite`
  - `selectedAssetRoot = "gail_lite"`
  - `meili_hair.resolvedPath = playcanvas-app/assets/gail_lite/hair/meili_hair/meili_hair.glb`

So the workaround was extended, still as an asset-only change, to:

- `playcanvas-app/assets/gail_lite/hair/meili_hair/meili_hair.glb`

Verified after the `gail_lite` swap:

- active D `gail_lite` hair SHA256:
  - `14D1D355E92174E56FDE85592D6199E12F663D47B98C7D54E5A723E8FB9AA0D2`
- active C `gail_lite` hair SHA256:
  - `14D1D355E92174E56FDE85592D6199E12F663D47B98C7D54E5A723E8FB9AA0D2`
- `GET /client/asset-manifest?assetRoot=gail_lite`
  - `meili_hair.fileSizeBytes = 36483732`

## Backups

Preserved for later repair work:

- exact pre-swap Gail hair:
  - `cleanup-hub/gail-hair-backup-20260422/meili_hair.original.glb`
  - SHA256: `751D45997DAC92E295BF4C7A40D32A26CB21086ADA790E3A86003925224BC6B3`
- exact pre-swap Gail lite hair:
  - `cleanup-hub/gail-lite-hair-backup-20260422/meili_hair.original.gail_lite.glb`
  - SHA256: `51778309AB4371CDFEB7D3B4865968D817CC473C68099B7372977AAE9A5CE854`
- Cherry source hair used for this workaround:
  - `cleanup-hub/gail-hair-backup-20260422/cherry_hair.source.glb`
  - `cleanup-hub/gail-lite-hair-backup-20260422/cherry_hair.source.glb`

## Follow-Up List

Keep on the active fix list:

- repair and revalidate the original Gail hair asset/runtime path
- only replace the temporary Cherry-hair workaround after Gail's own hair is proven stable again
