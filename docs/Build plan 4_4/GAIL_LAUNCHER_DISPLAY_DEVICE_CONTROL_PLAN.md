# Gail Launcher, Display Modes, and Device Profile Control Plan (Pass/Fail)

Date: 2026-04-04
Scope: One-click desktop start/stop, per-device staging/display profiles, multi-input display modes, and in-screen quick menu with voice command parity.

## Goals
- Launch entire local stack from a desktop icon.
- Provide a clean close/stop option.
- Make display mode device-aware with correct scaling and framing by target screen.
- Let operator pick device-specific mesh quality + scene/avatar transforms.
- Support three display input modes with voice/text toggles.
- Add top-right quick menu for runtime actions (including bug/help).

## 1) Desktop Launcher and Shutdown
### Requirements
- Desktop shortcut: `Start Gail`.
- Desktop shortcut: `Stop Gail` (or tray/menu close action).
- Local-only `Close Program` command path must stop local processes safely.

### Proposed implementation
- Add scripts in `tools/`:
  - `start-gail-local.ps1`
  - `stop-gail-local.ps1`
- Start script runs backend + web shell + work-lite client stack with readiness checks.
- Stop script gracefully terminates known Gail processes/ports and writes close log.
- Create `.lnk` shortcuts on desktop pointing to these scripts.

### Voice/Text commands
- `start gail`
- `stop gail`
- `close program` (local only)

## 2) Device-Specific Display Profiles
### Requirements
- In display mode, use saved viewport/canvas profile for selected device.
- Scale to best effective resolution/aspect for target screen.
- Device selector in staging screen:
  - `phone`
  - `shop_kiosk`
  - `laptop`
  - `watch`
  - extensible list

### Profile data contract
- `data/client/device-display-profiles.json`

Each device profile stores:
- display:
  - resolution (native + render scale)
  - aspect ratio
  - safe frame
- mesh:
  - body quality
  - clothing quality
  - hair quality
  - optional animation LOD
- staging:
  - scene id/background
  - avatar transform (position/rotation/scale)
  - camera transform/target

### Runtime behavior
- Selecting a device in staging applies that profile immediately.
- Switching to display mode uses selected device profile unless overridden.
- Profile lock prevents accidental auto-fit override.

## 3) Display Input Modes (3)
Required modes:
- `wake_word`
- `always_listening`
- `typed`

### Toggle requirements
- Toggleable by:
  - voice commands
  - text commands
  - top-right quick menu

### Voice/Text commands
- `set display mode wake word`
- `set display mode always listening`
- `set display mode typed`

## 4) Top-Right Quick Menu (Display Mode)
Add a compact menu button in top-right with actions:
- `Choose Input Mode` (wake word / always listening / typed)
- `Exit Fullscreen`
- `Close Program` (local only)
- `Report Bug`
- `Help`

### Voice command parity (all required)
- `open menu`
- `exit fullscreen`
- `close program`
- `report bug`
- `help`

## 5) Bug/Help Integration
- `Report Bug` launches/opens the existing planned bug report flow with screenshot support.
- `Help` opens context-specific noob help panel for current workspace.

## 6) Technical Integration Targets
Frontend:
- `playcanvas-app/src/main.ts` (display mode controls + device profile apply + top-right menu)
- `playcanvas-app/src/state/app-state.ts` (per-device profile state)
- `playcanvas-app/src/styles/work-lite.css` (menu placement/responsive behavior)
- `web-control-panel/src/operator-studio-shell.js` (staging device profile editor controls)

Backend:
- `backend/services/voice-service.ts` (mode extension for always-listening where supported)
- command/control routing:
  - `shared/command-definitions/hardwired-commands.ts`
  - `backend/services/command-service.ts`
  - `backend/services/control-intent-service.ts`

Ops/scripts:
- `tools/start-gail-local.ps1`
- `tools/stop-gail-local.ps1`
- desktop shortcut creation helper (optional script)

## Pass/Fail Gates
| ID | Status | Priority | Area | Requirement | Verification | Pass Criteria |
|---|---|---|---|---|---|---|
| LD1 | FAIL | Blocker | Desktop Launch | One-click desktop start launches full local stack | Click `Start Gail` shortcut | Backend + shell + client become ready without manual steps |
| LD2 | FAIL | Blocker | Desktop Stop | One-click stop closes local stack cleanly | Click `Stop Gail` or `close program` local command | Processes end cleanly; no orphan ports |
| LD3 | FAIL | Blocker | Device Profiles | Staging can select device and apply profile | Switch among phone/kiosk/laptop/watch | Correct scene, avatar transform, and camera per device |
| LD4 | FAIL | Blocker | Display Scaling | Display mode uses target device resolution strategy | Enter display mode per device | Framing is correct and scaled for that screen class |
| LD5 | FAIL | Blocker | Input Modes | Wake word / always listening / typed all switchable | Toggle via menu + voice + text | Mode changes immediately and persists as configured |
| LD6 | FAIL | High | Top-Right Menu | Menu provides all required actions | Open menu and test each action | All actions reachable and functional |
| LD7 | FAIL | High | Voice Command Parity | All menu actions are voice commandable | Run command set by voice/text | Commands route correctly with clear feedback |
| LD8 | FAIL | Medium | Help/Bug Hook | Help and report bug open correct flows | Trigger from menu | Context help opens and bug report flow starts with capture option |

## Suggested Build Order
1. Desktop start/stop scripts + shortcuts.
2. Device profile schema + staging editor controls.
3. Display-mode profile apply/scaling logic.
4. Add top-right menu in display mode.
5. Add 3 input modes and command routing.
6. Wire voice/text command parity for menu actions.
7. Validate with LD1-LD8 test checklist.

## Text-Only Animation and Latency Masking Addendum (Added 2026-04-04)

Display/runtime behavior requirements:
- If `typed` mode or text-only node is active, use texting/typing animation state.
- Suppress speaking facial/talk animation when no speech output is active.
- Add context-aware buffering micro-responses to reduce perceived lag while backend inference is running.

UI controls to expose:
- `listen_timeout_ms`
- `auto_resume_after_response`
- `buffering_phrase_profile`
- `text_only_animation_clip`
