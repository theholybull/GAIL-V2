const STORAGE_KEYS = {
  density: "gail.operator.shell.density",
  lastPage: "gail.operator.shell.lastPage",
  gestureProfile: "gail.operator.shell.gestureProfile",
  auditTrail: "gail.operator.shell.auditTrail",
  guidedMode: "gail.operator.shell.guidedMode",
  guidedProgress: "gail.operator.shell.guidedProgress",
  pageNotes: "gail.operator.shell.pageNotes",
};

const MASTER_ANIMATION_PLAN_PATHS = [
  "docs/MASTER_ANIMATION_PLAN_IDLE_FOUNDATION.md",
  "docs/MASTER_ANIMATION_PLAN_PROP_AND_TRANSITION_MATH.md",
];

const MASTER_ANIMATION_PLAN_CHECKLIST = [
  {
    title: "[Plan 1] Lock idle foundation as universal transition anchor",
    details: "Build starts from a single neutral idle base. No loop or transition work should bypass this anchor state.",
  },
  {
    title: "[Plan 1] Define idle pose timing baseline",
    details: "Set baseline idle timing and hold frames before creating transition variants.",
  },
  {
    title: "[Plan 1] Add text-only typing animation",
    details: "Map text-only mode to typing/texting animation and suppress speaking animation/mouth movement.",
  },
  {
    title: "[Plan 1] Build transition loops from idle only",
    details: "Every transition should be generated from idle -> target -> idle path before advanced blends.",
  },
  {
    title: "[Plan 2] Author office chair prop + pose set",
    details: "Create reusable office-chair prop alignment and seated pose anchors for clip generation.",
  },
  {
    title: "[Plan 2] Author couch prop + pose set",
    details: "Create reusable couch prop alignment and seated/lounge pose anchors for clip generation.",
  },
  {
    title: "[Plan 2] Enforce transition frame math",
    details: "Use frame count from movement distance and speed target. Formula: frames = ceil((distance_m / speed_mps) * fps). No guessed transition lengths.",
  },
  {
    title: "[Plan 2] Enforce rotation blend math",
    details: "Use angular distance and angular speed target. Formula: frames = ceil((angle_deg / deg_per_sec) * fps).",
  },
  {
    title: "[Plan 2] Bake Blender->PlayCanvas scale standard",
    details: "Standardize import/export scale so all props and avatar parts stay consistent between Blender and PlayCanvas.",
  },
  {
    title: "[Plan 2] Validate smoothness before approval",
    details: "Run visual and metric checks for popping/sliding/jitter before marking animation step approved.",
  },
];

const CHANGE_QUEUE_KEY = "gail.operator.change.queue";
const API_BASE = "";
const REQUEST_TIMEOUT_MS = 20000;
const GET_RETRY_ATTEMPTS = 2;
const GET_RETRY_BASE_MS = 240;
const SENSITIVE_ACTIONS = new Map([
  ["pairing_create", "Create a new pairing session? This publishes a temporary pairing code."],
  ["device_register", "Register a new trusted device profile?"],
  ["device_unlock", "Unlock sensitive device actions for the configured window?"],
  ["avatar_apply_system", "Apply runtime avatar system change now?"],
  ["wardrobe_apply_system", "Apply runtime avatar system change now?"],
  ["wardrobe_delete_preset", "Delete the selected wardrobe preset? This cannot be undone."],
  ["animation_apply_system", "Apply runtime avatar system change now?"],
  ["runtime_apply_system", "Apply runtime avatar system change now?"],
  ["animation_run_export", "Run the modular avatar export now using the selected runtime profile?"],
  ["animation_run_pipeline", "Run the full PlayCanvas export pipeline now using the selected runtime profile?"],
  ["runtime_run_pipeline", "Run the full PlayCanvas export pipeline now using the selected runtime profile?"],
  ["build_run_script", "Run the selected build script now? This executes a local PowerShell script."],
  ["build_approve_step", "Approve the first pending build step now?"],
  ["manager_dispatch", "Dispatch a new directive to the manager agent? Gail will review before it reaches you."],
  ["manager_cancel_first", "Cancel the first active manager directive?"],
  ["manager_gail_approve", "Gail: Approve the first directive awaiting your sign-off?"],
  ["manager_gail_reject", "Gail: Reject the first directive awaiting your sign-off?"],
]);

const NOTE_STATUS_OPTIONS = ["open", "deferred", "done", "rolled-into-build"];

const PROVIDERS_VOICE_RUNTIME_SETTINGS = [
  { key: "voice.wake_word", label: "Wake Word", type: "text", value: "hey gail", help: "Primary wake phrase stored in /voice/settings." },
  { key: "voice.auto_resume", label: "Auto Resume", type: "select", options: ["true", "false"], value: "true", help: "Resume listening after Gail responds." },
  { key: "voice.speech_cooldown_ms", label: "Self-Hearing Cooldown", type: "number", value: "1200", help: "Milliseconds to ignore mic after Gail stops speaking." },
  { key: "voice.thinking_filler_delay_ms", label: "Buffer Delay", type: "number", value: "650", help: "Delay before Gail says a short thinking/buffer phrase." },
  { key: "voice.follow_up_timeout_ms", label: "Follow-up Window", type: "number", value: "9000", help: "General follow-up listening window in milliseconds." },
  { key: "voice.wake_follow_up_timeout_ms", label: "Wake Follow-up Window", type: "number", value: "7000", help: "Follow-up window after a wake-word-only acknowledgement." },
  { key: "voice.default_submit_timeout_ms", label: "Default Submit Delay", type: "number", value: "1400", help: "Pause before always-listening submits finalized speech." },
  { key: "voice.follow_up_submit_timeout_ms", label: "Follow-up Submit Delay", type: "number", value: "850", help: "Pause before follow-up speech submits." },
  { key: "voice.wake_submit_timeout_ms", label: "Wake Submit Delay", type: "number", value: "850", help: "Pause before wake-word speech submits." },
  { key: "voice.ambient_confidence", label: "Ambient Confidence Floor", type: "number", value: "0.48", help: "Low-confidence short always-listening snippets below this are ignored." },
  { key: "voice.ambient_repeat_ms", label: "Ambient Repeat Window", type: "number", value: "10000", help: "Identical always-listening transcripts inside this window are ignored." },
  { key: "voice.wake_aliases", label: "Wake Aliases", type: "textarea", value: "gail\ngale\ngael\ngal", help: "One alias per line. Used for fuzzy wake matching." },
  { key: "voice.wake_prefixes", label: "Wake Prefixes", type: "textarea", value: "hey\nhi\nhello\nokay\nok\nyo", help: "One prefix per line. Combined with wake aliases." },
  { key: "voice.wake_acks", label: "Wake Acknowledgements", type: "textarea", value: "What's up?\nI'm here.\nRight here.\nYep?\nGo ahead.\nI'm listening.\nTalk to me.", help: "Varied short replies when only the wake word is heard." },
  { key: "voice.filler_question", label: "Question Buffers", type: "textarea", value: "Let me think that through.\nGood question. One second.\nI'm checking that.", help: "One phrase per line for question-shaped voice requests." },
  { key: "voice.filler_command", label: "Command Buffers", type: "textarea", value: "On it.\nI'll take care of that.\nWorking on it.", help: "One phrase per line for command-shaped voice requests." },
  { key: "voice.filler_statement", label: "Statement Buffers", type: "textarea", value: "I hear you.\nI'm with you.\nGot it. Let me think.", help: "One phrase per line for statement-shaped voice requests." },
  { key: "voice.context_follow_up", label: "Follow-up Buffers", type: "textarea", value: "Right, continuing from that.\nI'm tracking.\nYep, still with you.", help: "Context-specific buffer phrases for follow-ups." },
  { key: "voice.context_vision", label: "Vision Buffers", type: "textarea", value: "I'll take a look.\nLet me check what I can see.\nLooking now.", help: "Context-specific buffer phrases for camera/vision requests." },
  { key: "voice.context_persona", label: "Persona Buffers", type: "textarea", value: "Okay, switching gears.\nI'll adjust that.", help: "Context-specific buffer phrases for persona requests." },
  { key: "voice.context_dance", label: "Dance Buffers", type: "textarea", value: "Okay, cueing that up.\nI'll get that moving.", help: "Context-specific buffer phrases for dance requests." },
  { key: "voice.context_system", label: "System Buffers", type: "textarea", value: "Okay, adjusting that.\nI'll update that.", help: "Context-specific buffer phrases for voice/settings/system requests." },
  { key: "voice.closers", label: "Conversation Closers", type: "textarea", value: "Alright, I'll be here if you need me.\nOkay, just say hey gail if you need anything.", help: "Phrases Gail can use when a follow-up window closes." },
  { key: "voice.boot_greetings", label: "Boot Greetings", type: "textarea", value: "Hey boss, I'm online and ready to go.\nGood to go. Just say hey gail when you need me.", help: "Startup greetings." },
  { key: "voice.ambient_allowlist", label: "Ambient Single-Word Allowlist", type: "textarea", value: "yes\nyeah\nyep\nno\nnope\nstop\ncancel\nquiet", help: "Single-word always-listening transcripts allowed through." },
];

const PROVIDERS_VOICE_SETTING_SECTIONS = [
  {
    id: "providers",
    title: "Provider & Model",
    description: "Core provider paths and model runtime settings.",
  },
  {
    id: "personas",
    title: "Persona Routing",
    description: "Which persona is active and which one private mode falls back to.",
  },
  {
    id: "prompts",
    title: "Prompts & Canon",
    description: "Live persona prompts and continuity canon.",
  },
  {
    id: "voiceBasics",
    title: "Voice Basics",
    description: "Primary interaction mode and core listening behavior.",
  },
  {
    id: "wakeTiming",
    title: "Wake & Timing",
    description: "Wake behavior, follow-up timing, and self-hearing windows.",
  },
  {
    id: "ambient",
    title: "Ambient Guard",
    description: "Filters that keep TV/music/background chatter from triggering Gail.",
  },
  {
    id: "phrases",
    title: "Phrase Banks",
    description: "Wake acknowledgements, thinking buffers, greetings, and closers.",
  },
];

const PAGES = [
  { id: "workflow-studio", group: "AI Workflows", title: "Workflow Studio", route: "/panel/module/workflow-studio", state: "live", summary: "AI workflow orchestration.", entities: ["Workflow", "WorkflowStep", "WorkflowArtifact"], routes: ["/workflows", "/workflows/:id/plan", "/workflows/:id/steps/:stepId/run"], settings: [{ key: "workflow.template", label: "Template", type: "select", options: ["intake", "analysis", "delivery"], value: "intake", help: "Step template." }, { key: "workflow.provider", label: "Provider", type: "select", options: ["openai", "local-llm"], value: "openai", help: "Provider preference." }], displays: ["Step graph", "Step inspector", "Artifact viewer"], actions: [{ id: "workflow_refresh", label: "Refresh Workflows" }, { id: "workflow_create", label: "Create Workflow" }, { id: "workflow_plan", label: "Plan Selected" }, { id: "workflow_run_ready", label: "Run Ready Step" }, { id: "workflow_open_review_queue", label: "Open Review Queue" }], canvas: "Workflow canvas mock" },
  { id: "build-control-tower", group: "AI Workflows", title: "Build Control Tower", route: "/panel/module/build-control-tower", state: "live", summary: "Master checker oversight, approvals, screenshot QA, and script registry.", entities: ["BuildOverview", "BuildAgentLane", "BuildScriptRegistry"], routes: ["/build/overview", "/build/agents", "/build/steps/:id/submit", "/build/steps/:id/approve", "/build/screenshots/capture", "/build/screenshots/analyze", "/build/scripts", "/build/scripts/run", "/build/scripts/:id/results"], settings: [{ key: "build.feature", label: "Feature Tag", type: "text", value: "operator-shell", help: "Feature tag for screenshot evidence folders." }, { key: "build.script_id", label: "Script Id", type: "select", options: ["avatar-assets", "playcanvas-pipeline", "animoxtend-check"], value: "avatar-assets", help: "Registry script id to run from this screen." }, { key: "build.screenshot_path", label: "Source Screenshot Path", type: "text", value: "", help: "Optional repo-relative screenshot path to ingest." }, { key: "build.require_screenshot", label: "Require Screenshot Evidence", type: "select", options: ["true", "false"], value: "true", help: "If true, approve step enforces screenshot analysis evidence." }], displays: ["Master checker status", "Approval queue", "Agent lanes", "Script runs"], actions: [{ id: "build_refresh", label: "Refresh Build Tower" }, { id: "build_submit_step", label: "Submit First Ready Step" }, { id: "build_approve_step", label: "Approve First Pending Step" }, { id: "build_request_changes", label: "Request Changes First Pending" }, { id: "build_capture_screenshot", label: "Capture Build Screenshot" }, { id: "build_analyze_screenshot", label: "Analyze Current Screen" }, { id: "build_run_script", label: "Run Script" }, { id: "build_show_latest_results", label: "Show Latest Results" }], canvas: "Build control tower board" },
  { id: "avatar-library", group: "Avatar", title: "Avatar Library", route: "/panel/module/avatar-library", state: "live", summary: "Single source for avatar profiles and runtime system selection.", entities: ["AvatarProfile"], routes: ["/client/runtime-settings", "/client/asset-manifest"], settings: [{ key: "runtime.active_system", label: "Avatar System", type: "select", options: ["gail_primary", "handoff_20260330", "legacy_fallback"], value: "gail_primary", help: "Active runtime avatar system from data/client/avatar-runtime.json." }, { key: "avatar.default_profile", label: "Default Profile", type: "text", value: "GAIL_BASE_V2", help: "Profile id." }, { key: "avatar.lod", label: "LOD", type: "select", options: ["low", "medium", "high"], value: "medium", help: "Preview LOD." }, { key: "avatar.material_profile", label: "Material", type: "select", options: ["studio", "balanced", "performance"], value: "balanced", help: "Material profile." }, { key: "avatar.active_persona", label: "Active Persona", type: "select", options: ["normal", "private_counselor", "private_girlfriend"], value: "normal", help: "Quick-switch the active persona mode. Edit full prompts on Providers and Voice." }], displays: ["Avatar catalog", "Asset health"], actions: [{ id: "avatar_refresh", label: "Refresh Avatar Runtime" }, { id: "avatar_apply_system", label: "Apply Avatar System" }, { id: "avatar_set_persona", label: "Apply Persona" }, { id: "avatar_edit_personas", label: "Edit Personas" }, { id: "avatar_edit_commands", label: "Edit Commands" }], canvas: "Avatar runtime and bundle validation console" },
  { id: "wardrobe-manager", group: "Avatar", title: "Wardrobe", route: "/panel/module/wardrobe-manager", state: "live", summary: "Clothing slots, outfit presets, and bundle compatibility from the shared avatar runtime config.", entities: ["OutfitPreset"], routes: ["/client/runtime-settings", "/client/asset-manifest", "/client/wardrobe-presets"], settings: [{ key: "runtime.active_system", label: "Avatar System", type: "select", options: ["gail_primary", "handoff_20260330", "legacy_fallback"], value: "gail_primary", help: "Runtime system from data/client/avatar-runtime.json." }, { key: "wardrobe.new_preset_id", label: "New Preset ID", type: "text", value: "", help: "Unique id for a new outfit preset (snake_case)." }, { key: "wardrobe.new_preset_name", label: "New Preset Name", type: "text", value: "", help: "Display name for the new preset." }, { key: "wardrobe.new_preset_persona", label: "New Preset Persona", type: "select", options: ["normal", "private_counselor", "private_girlfriend"], value: "normal", help: "Which persona this preset belongs to." }], displays: ["Preset list", "Slot occupancy", "Active preset detail", "Preset voice profile"], actions: [{ id: "wardrobe_refresh", label: "Refresh Wardrobe Data" }, { id: "wardrobe_apply_system", label: "Apply Avatar System" }, { id: "wardrobe_select_preset", label: "Activate Selected Preset" }, { id: "wardrobe_create_preset", label: "Create New Preset" }, { id: "wardrobe_voice_save", label: "Save Preset Voice" }, { id: "wardrobe_delete_preset", label: "Delete Selected Preset" }], canvas: "Wardrobe preset and slot management board" },
  { id: "animation-library", group: "Avatar", title: "Animations", route: "/panel/module/animation-library", state: "live", summary: "Clip library and runtime animation readiness.", entities: ["AnimationClip"], routes: ["/client/runtime-settings", "/client/asset-manifest", "/exports/status", "/exports/run", "/animations/catalog"], settings: [{ key: "runtime.active_system", label: "Avatar System", type: "select", options: ["handoff_20260330", "legacy_fallback"], value: "handoff_20260330", help: "Runtime system for animation bundle." }, { key: "anim.retarget_profile", label: "Retarget Profile", type: "text", value: "GAIL_RETARGET_01", help: "Retarget map." }, { key: "anim.runtime_profile", label: "Runtime Profile", type: "select", options: ["high", "medium", "low"], value: "high", help: "Export profile for host and connected clients." }, { key: "anim.export_runner_path", label: "Export Runner", type: "text", value: "tools/export-avatar-assets.ps1", help: "Direct modular avatar export entrypoint." }, { key: "anim.pipeline_runner_path", label: "Pipeline Runner", type: "text", value: "tools/export-playcanvas-pipeline.ps1", help: "Full PlayCanvas pipeline entrypoint." }, { key: "anim.pipeline_doc", label: "Pipeline Doc", type: "text", value: "docs/PLAYCANVAS_AVATAR_PIPELINE.md", help: "Authoritative animation/export doc path." }, { key: "anim.viewer_url", label: "Viewer URL", type: "text", value: "http://127.0.0.1:4180/client/anim-test/", help: "External animation viewer endpoint." }], displays: ["Clip catalog", "Validation", "Latest export report"], actions: [{ id: "animation_refresh", label: "Refresh Animations" }, { id: "animation_seed_master_plan", label: "Seed Master Animation Checklist" }, { id: "animation_apply_system", label: "Apply Avatar System" }, { id: "animation_run_export", label: "Run Avatar Export" }, { id: "animation_run_pipeline", label: "Run Full Pipeline" }, { id: "animation_refresh_report", label: "Refresh Export Report" }, { id: "open_animation_viewer", label: "Open Animation Viewer" }], canvas: "Animation runtime readiness board" },
  { id: "action-graph", group: "AI & Personas", title: "Commands", route: "/panel/module/action-graph", state: "live", summary: "Trigger/action orchestration.", entities: ["ActionNode"], routes: ["/commands", "/commands/execute", "/commands/mappings"], settings: [{ key: "action.priority_mode", label: "Priority Mode", type: "select", options: ["strict", "weighted"], value: "strict", help: "Resolution mode." }, { key: "action.sample_phrase", label: "Sample Phrase", type: "text", value: "show tasks", help: "Command phrase used for execute test." }, { key: "action.command_key", label: "Command Key", type: "text", value: "show_tasks", help: "Existing command key to extend with a new phrase." }, { key: "action.new_phrase", label: "New Phrase", type: "text", value: "show my tasks", help: "Additional phrase mapping for the selected command key." }], displays: ["Action graph", "Trigger map"], actions: [{ id: "action_refresh", label: "Refresh Commands" }, { id: "action_execute_sample", label: "Execute Sample Command" }, { id: "action_save_mapping", label: "Save Phrase Mapping" }], canvas: "Action graph live command console" },
  { id: "state-machine", group: "Avatar", title: "State Machine", route: "/panel/module/animation-state-machine", state: "live", summary: "Animation transitions and runtime-driven clip map.", entities: ["AnimState"], routes: ["/client/runtime-settings", "/client/asset-manifest"], settings: [{ key: "sm.default_state", label: "Default State", type: "text", value: "idle", help: "Startup state." }], displays: ["State graph", "Transition table"], actions: [{ id: "state_refresh", label: "Refresh State Data" }], canvas: "State machine overview from runtime manifest" },
  { id: "gesture-expression", group: "AI & Personas", title: "Gestures", route: "/panel/module/gesture-expression", state: "live", summary: "Gesture blending plus live body morph runtime control.", entities: ["GesturePreset", "BodyMorphControl"], routes: ["/voice/settings", "/client/runtime-settings"], settings: [{ key: "gesture.profile", label: "Expression Profile", type: "select", options: ["calm", "neutral", "high-energy"], value: "calm", help: "Profile." }, { key: "morphs.motion_only", label: "Body Morph Mode", type: "select", options: ["true", "false"], value: "true", help: "true = apply only while animation is in motion, false = always apply." }], displays: ["Gesture palette", "Blend monitor", "Body morph runtime"], actions: [{ id: "gesture_refresh", label: "Refresh Voice Context" }, { id: "gesture_apply_profile", label: "Apply Expression Profile" }, { id: "gesture_scan_body_morphs", label: "Scan Body Morphs From Client" }, { id: "gesture_apply_body_morphs", label: "Apply Body Morphs" }, { id: "gesture_clear_body_morphs", label: "Clear Body Morphs" }], canvas: "Gesture, expression, and body morph live control surface" },
  { id: "asset-binding", group: "Avatar", title: "Asset Validation", route: "/panel/module/asset-binding", state: "live", summary: "Asset binding rules and runtime validation.", entities: ["AssetBinding"], routes: ["/client/asset-manifest"], settings: [{ key: "binding.strict_mode", label: "Validation Mode", type: "select", options: ["strict", "permissive"], value: "strict", help: "Validation policy." }], displays: ["Bound/unbound", "Validation summary"], actions: [{ id: "asset_refresh", label: "Refresh Asset Validation" }], canvas: "Asset binding and validation results" },
  { id: "live-preview", group: "Avatar", title: "Preview", route: "/panel/module/live-preview-stage", state: "live", summary: "Preview stage diagnostics with runtime camera inputs.", entities: ["PreviewScene"], routes: ["/camera/matrix", "/client/runtime-settings", "/client/asset-manifest"], settings: [{ key: "preview.camera", label: "Camera Rig", type: "select", options: ["orbit", "studio-front", "three-quarter"], value: "orbit", help: "Rig preset." }], displays: ["Viewport", "Diagnostics"], actions: [{ id: "preview_refresh", label: "Refresh Preview Inputs" }], canvas: "Preview stage diagnostics feed" },
  { id: "runtime-mapping", group: "Avatar", title: "Runtime Mapping", route: "/panel/module/runtime-mapping", state: "live", summary: "Runtime export mapping and active system controls.", entities: ["RuntimeMapping"], routes: ["/client/runtime-settings", "/client/asset-manifest", "/exports/status", "/exports/run"], settings: [{ key: "runtime.active_system", label: "Avatar System", type: "select", options: ["handoff_20260330", "legacy_fallback"], value: "handoff_20260330", help: "System exported to runtime clients." }, { key: "runtime.profile", label: "Export Profile", type: "select", options: ["high", "medium", "low"], value: "high", help: "Export strategy by target device class." }, { key: "runtime.pipeline_runner_path", label: "Pipeline Runner", type: "text", value: "tools/export-playcanvas-pipeline.ps1", help: "Full PlayCanvas pipeline entrypoint." }, { key: "runtime.pipeline_doc", label: "Pipeline Doc", type: "text", value: "docs/PLAYCANVAS_AVATAR_PIPELINE.md", help: "Authoritative export/runtime mapping doc path." }], displays: ["Export manifest", "Mapping diff", "Latest export report"], actions: [{ id: "runtime_refresh", label: "Refresh Runtime Mapping" }, { id: "runtime_apply_system", label: "Apply Avatar System" }, { id: "runtime_run_pipeline", label: "Run Full Pipeline" }, { id: "runtime_refresh_report", label: "Refresh Export Report" }], canvas: "Client runtime mapping board" },
  { id: "devices-auth", group: "System", title: "Devices", route: "/panel/module/devices-auth", state: "live", summary: "Pairing, trust, and device-aware display controls.", entities: ["DeviceProfile", "AuthStatus"], routes: ["/auth/status", "/auth/pairing-sessions", "/devices", "/client/device-display-profiles", "/client/runtime-settings"], settings: [{ key: "auth.unlock_minutes", label: "Unlock Minutes", type: "number", value: "15", help: "Unlock window." }, { key: "display.selected_device_id", label: "Display Device Target", type: "select", options: ["laptop", "phone", "shop_kiosk", "watch"], value: "laptop", help: "Device profile target for staging/display." }, { key: "display.input_mode", label: "Display Input Mode", type: "select", options: ["wake_word", "always_listening", "typed"], value: "wake_word", help: "Display interaction mode." }], displays: ["Auth status", "Device table", "Display profile"], actions: [{ id: "auth_refresh", label: "Refresh" }, { id: "pairing_create", label: "Create Pairing Session" }, { id: "device_register", label: "Register Quick Device" }, { id: "device_unlock", label: "Unlock First Device" }, { id: "display_refresh", label: "Refresh Display Profiles" }, { id: "display_apply", label: "Apply Display Mode + Target" }], canvas: "Devices/auth live data with display controls" },
  { id: "providers-voice", group: "AI & Personas", title: "Providers & Voice", route: "/panel/module/providers-voice", state: "live", summary: "Provider, local model, private persona, and voice controls.", entities: ["ProviderStatus", "LocalLlmConfig", "VoiceSettings"], routes: ["/providers/status", "/providers/openai-config", "/providers/local-llm-config", "/persona/backstory", "/voice/settings"], settings: [{ key: "openai.api_key", label: "OpenAI API Key", type: "password", value: "", help: "Stored locally in provider config when set." }, { key: "localllm.base_url", label: "Local LLM Base URL", type: "text", value: "http://127.0.0.1:11434", help: "Ollama API base URL." }, { key: "localllm.model", label: "Local LLM Model", type: "text", value: "dolphin-mistral:7b", help: "Installed Ollama model tag." }, { key: "localllm.timeout_ms", label: "Local LLM Timeout", type: "number", value: "120000", help: "Request timeout in milliseconds." }, { key: "localllm.keep_alive", label: "Local LLM Keep Alive", type: "text", value: "10m", help: "Ollama keep_alive value." }, { key: "localllm.default_private_persona", label: "Default Private Persona", type: "select", options: ["private_counselor", "private_girlfriend", "private_hangout"], value: "private_counselor", help: "Persona selected when private mode starts clean." }, { key: "localllm.active_private_persona", label: "Active Private Persona", type: "select", options: ["private_counselor", "private_girlfriend", "private_hangout"], value: "private_counselor", help: "Persona the backend uses right now for private mode." }, { key: "localllm.normal_prompt", label: "Normal Mode Prompt", type: "textarea", value: "", help: "System prompt used for normal (non-private) conversations. This is Gail's default personality." }, { key: "localllm.counselor_prompt", label: "Vera Agent Prompt", type: "textarea", value: "", help: "System prompt for Vera (private counselor). Stateless, honest, dry wit, one question at a time." }, { key: "localllm.girlfriend_prompt", label: "Cherry Agent Prompt", type: "textarea", value: "", help: "System prompt for Cherry (private girlfriend). Warm, affectionate, emotionally present." }, { key: "backstory.normal_canon", label: "Normal Backstory Canon", type: "textarea", value: "", help: "Internal continuity canon for normal mode. Keep realistic and consistent." }, { key: "backstory.counselor_canon", label: "Vera Backstory Canon", type: "textarea", value: "", help: "Internal continuity canon for Vera." }, { key: "backstory.girlfriend_canon", label: "Cherry Backstory Canon", type: "textarea", value: "", help: "Internal continuity canon for Cherry." }, { key: "voice.mode", label: "Voice Mode", type: "select", options: ["wake_word", "always_listening", "typed"], value: "wake_word", help: "Voice mode." }, { key: "voice.timeout_ms", label: "Silence Timeout", type: "number", value: "6000", help: "Timeout." }], displays: ["Provider telemetry", "Local LLM status", "Private persona status", "Backstory status", "Voice status"], actions: [{ id: "provider_refresh", label: "Refresh" }, { id: "provider_set_key", label: "Set OpenAI Key" }, { id: "provider_clear_key", label: "Clear OpenAI Key" }, { id: "local_llm_save", label: "Save Personas + Backstories" }, { id: "voice_save", label: "Save Voice" }, { id: "voice_warmup", label: "Warmup" }, { id: "voice_test", label: "Speak Test" }], canvas: "Providers/voice live data" },
  { id: "change-governance", group: "System", title: "Governance", route: "/panel/module/change-governance", state: "live", summary: "Snapshots, approvals, rollback, and immutable history.", entities: ["ChangeRecord", "ApprovalRecord", "LedgerEvent"], routes: ["/governance/changes", "/governance/history", "/governance/rollback/last-approved"], settings: [{ key: "governance.reviewer", label: "Reviewer", type: "text", value: "operator", help: "Reviewer label used for approve/reject actions." }, { key: "governance.reason", label: "Decision Note", type: "text", value: "Reviewed in control tower.", help: "Reason attached to decisions." }], displays: ["Pending changes", "Last approved", "Ledger health"], actions: [{ id: "governance_refresh", label: "Refresh Governance" }, { id: "governance_approve_first", label: "Approve First Pending" }, { id: "governance_reject_first", label: "Reject First Pending" }, { id: "governance_rollback_last", label: "Rollback To Last Approved" }, { id: "governance_history", label: "Show Ledger History" }], canvas: "Governance ledger board" },
  { id: "feature-inbox", group: "System", title: "Feature Inbox", route: "/panel/module/feature-inbox", state: "live", summary: "Capture upgrade ideas and promote into task/workflow/change requests.", entities: ["FeatureBacklogEntry"], routes: ["/backlog/features", "/backlog/features/:id/promote"], settings: [{ key: "feature.title", label: "Feature Title", type: "text", value: "Add feature request button to display menu", help: "Short title for the request." }, { key: "feature.details", label: "Feature Details", type: "text", value: "Capture typed and voice suggestions into a promotable backlog.", help: "What should be built." }, { key: "feature.source", label: "Capture Source", type: "select", options: ["typed", "voice"], value: "typed", help: "How this request was captured." }, { key: "feature.stage", label: "Stage Target", type: "select", options: ["current_build", "next_round", "future_upgrade"], value: "next_round", help: "When to target this request." }, { key: "feature.priority", label: "Priority", type: "select", options: ["low", "normal", "high", "critical"], value: "normal", help: "Priority level." }, { key: "feature.status", label: "Status Filter", type: "select", options: ["all", "pending", "planned", "in_progress", "done", "deferred"], value: "all", help: "Filter displayed items by status." }, { key: "feature.promote_target", label: "Promote Target", type: "select", options: ["task", "workflow", "change_request"], value: "task", help: "How to promote first visible item." }], displays: ["Feature queue", "Stage rollup", "Promotion links"], actions: [{ id: "feature_refresh", label: "Refresh Feature Inbox" }, { id: "feature_add", label: "Add Feature Request" }, { id: "feature_promote_first", label: "Promote First Visible" }], canvas: "Feature backlog and promotion board" },
  { id: "report-bugs", group: "System", title: "Report Bugs", route: "/panel/module/report-bugs", state: "live", summary: "Capture screenshot-backed issues and track bug status.", entities: ["BugReportRecord"], routes: ["/reports/bugs", "/reports/bugs/:id", "/reports/bugs/:id/screenshot"], settings: [{ key: "bug.title", label: "Summary", type: "text", value: "UI issue summary", help: "Required one-line issue summary." }, { key: "bug.details", label: "Reproduction Steps", type: "text", value: "1) Open page 2) Click action 3) Observe unexpected behavior", help: "Steps to reproduce." }, { key: "bug.status", label: "Status", type: "select", options: ["open", "in_progress", "blocked", "done"], value: "open", help: "Initial or update status." }, { key: "bug.filter_status", label: "Filter Status", type: "select", options: ["all", "open", "in_progress", "blocked", "done"], value: "all", help: "Issue log filter." }, { key: "bug.capture_source_path", label: "Optional Screenshot Path", type: "text", value: "", help: "Optional local image path to attach if available." }], displays: ["Quick capture", "Issue log", "Attachments"], actions: [{ id: "bug_refresh", label: "Refresh Bug Log" }, { id: "bug_capture", label: "Capture Screenshot" }, { id: "bug_create", label: "Create Report" }, { id: "bug_capture_create", label: "Capture + Report" }, { id: "bug_update_first", label: "Update First Visible" }], canvas: "Bug reporting capture and issue log board" },
  { id: "pass-review", group: "System", title: "Pass Review", route: "/panel/module/pass-review", state: "live", summary: "Cross-page review of saved next-pass notes.", entities: ["PageNote"], routes: ["local:page-notes"], settings: [{ key: "review.status_filter", label: "Status Filter", type: "select", options: ["all", "open", "deferred", "done", "rolled-into-build"], value: "all", help: "Filter notes by current status." }], displays: ["Page backlog", "Status counts", "Ready for next pass"], actions: [{ id: "review_refresh", label: "Refresh Review" }, { id: "review_clear_done", label: "Clear Done Notes" }], canvas: "Next-pass review board" },
  { id: "organizer-control", group: "System", title: "Organizer", route: "/panel/module/organizer-control", state: "live", summary: "Projects/tasks/reminders/approvals.", entities: ["Project", "Task", "Reminder", "ApprovalRequest"], routes: ["/dashboard/overview", "/projects", "/tasks", "/reminders", "/approvals"], settings: [{ key: "org.default_priority", label: "Default Task Priority", type: "select", options: ["low", "normal", "high", "urgent"], value: "normal", help: "Task priority." }], displays: ["Dashboard counts", "Entity rollups"], actions: [{ id: "organizer_refresh", label: "Refresh" }, { id: "task_create_quick", label: "Create Quick Task" }, { id: "approval_refresh", label: "Refresh Approvals" }], canvas: "Organizer live data" },
  { id: "system-status", group: "System", title: "System Status", route: "/panel/module/system-status", state: "live", summary: "Full system health, providers, voice, build progress, file browser, and error log.", entities: ["SystemStatus", "SystemHealthEntry", "SystemErrorEntry", "FileSystemEntry"], routes: ["/system/status", "/system/errors", "/system/files", "/system/files/read"], settings: [{ key: "system.browse_path", label: "Browse Path", type: "text", value: ".", help: "Relative path inside D:\\Gail to browse." }, { key: "system.read_file", label: "Read File Path", type: "text", value: "", help: "Relative file path to read content from." }], displays: ["Health checks", "Provider status", "Voice status", "Build progress", "Recent errors", "File browser"], actions: [{ id: "system_refresh", label: "Refresh System Status" }, { id: "system_browse", label: "Browse Directory" }, { id: "system_read_file", label: "Read File" }, { id: "system_errors", label: "Show Error Log" }], canvas: "System status and file browser" },
  { id: "manager-agent", group: "AI Workflows", title: "Manager Agent", route: "/panel/module/manager-agent", state: "live", summary: "Manager agent oversight: dispatch directives, monitor builders, and track lifecycle. Gail is the final approval gate — nothing reaches the operator without her sign-off.", entities: ["ManagerDirective", "ManagerAgentStatus", "ManagerReport"], routes: ["/manager/report", "/manager/status", "/manager/builders", "/manager/directives", "/manager/directives/:id", "/manager/avatar-request", "/manager/awaiting-approval", "/manager/gail-context"], settings: [{ key: "manager.instruction", label: "Directive Instruction", type: "text", value: "", help: "What should the manager agent build or execute?" }, { key: "manager.priority", label: "Priority", type: "select", options: ["low", "normal", "high", "critical"], value: "normal", help: "Priority level for the directive." }, { key: "manager.assignee", label: "Assign To", type: "select", options: ["auto", "ai", "codex", "human"], value: "auto", help: "Force assignment or let the manager pick." }, { key: "manager.filter_status", label: "Filter Status", type: "select", options: ["all", "pending", "dispatched", "running", "completed", "failed", "cancelled", "awaiting_gail_approval"], value: "all", help: "Filter directives by status." }], displays: ["Manager status", "Builder A status", "Builder B status", "Directive counts", "Gail approval queue", "Recent directives"], actions: [{ id: "manager_refresh", label: "Refresh Manager Report" }, { id: "manager_dispatch", label: "Dispatch Directive" }, { id: "manager_avatar_request", label: "Avatar Request (Gail)" }, { id: "manager_gail_approve", label: "Gail: Approve First Awaiting" }, { id: "manager_gail_reject", label: "Gail: Reject First Awaiting" }, { id: "manager_cancel_first", label: "Cancel First Active" }], canvas: "Gail's manager agent command center — Gail approves all completed work" },
];

const LEGACY_PAGE_ROUTE_ALIASES = new Map([
  ["/build/control-tower", "build-control-tower"],
  ["/governance/control", "change-governance"],
  ["/backlog/features", "feature-inbox"],
  ["/reports/bugs", "report-bugs"],
]);

function isElementNode(value) {
  return Boolean(value) && typeof value === "object" && value.nodeType === 1;
}

function isButtonElement(value) {
  return isElementNode(value) && String(value.tagName || "").toUpperCase() === "BUTTON";
}

function isValueElement(value) {
  return isElementNode(value) && typeof value.value === "string";
}

function cssEscapeSelector(value) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

function clampMorphValue(raw) {
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
}

function normalizeBodyMorphOverrides(overrides) {
  if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) {
    return {};
  }
  const normalized = {};
  for (const [key, value] of Object.entries(overrides)) {
    if (!String(key).trim()) {
      continue;
    }
    normalized[key] = clampMorphValue(value);
  }
  return normalized;
}

function getGestureClientIframe() {
  const frame = document.getElementById("gesture-client-iframe");
  if (isElementNode(frame) && String(frame.tagName || "").toUpperCase() === "IFRAME") {
    return frame;
  }
  return null;
}

function postGestureClientMessage(message) {
  const iframe = getGestureClientIframe();
  const targetWindow = iframe?.contentWindow;
  if (!targetWindow) {
    throw new Error("Live client iframe is not ready. Open Gestures page and wait for client load.");
  }
  targetWindow.postMessage(message, "*");
}

function onShellMorphMessage(event) {
  const payload = event?.data;
  if (!payload || typeof payload !== "object") {
    return;
  }
  if (payload.type !== "gail:morph:body-catalog") {
    return;
  }
  runtime.bodyMorphCatalog = Array.isArray(payload.keys)
    ? payload.keys.map((key) => String(key)).filter(Boolean)
    : [];
  runtime.bodyMorphBreastKeys = Array.isArray(payload.breastKeys)
    ? payload.breastKeys.map((key) => String(key)).filter(Boolean)
    : [];
  console.log(
    `[morph-catalog] ${runtime.bodyMorphCatalog.length} total body keys received.`,
    `\nAll keys:`, runtime.bodyMorphCatalog,
    `\nBreast keys (${runtime.bodyMorphBreastKeys.length}):`, runtime.bodyMorphBreastKeys
  );
  if (typeof payload.enabledDuringMotion === "boolean") {
    runtime.bodyMorphMotionOnly = payload.enabledDuringMotion;
    setSettingValue("morphs.motion_only", payload.enabledDuringMotion ? "true" : "false");
  }
  runtime.bodyMorphOverrides = normalizeBodyMorphOverrides(payload.overrides);
  if (activePage.id === "gesture-expression") {
    void renderPage();
  }
}

function findPageById(pageId) {
  return PAGES.find((page) => page.id === pageId) ?? null;
}

function resolvePageIdFromLocation() {
  const currentUrl = new URL(window.location.href);
  const pageIdFromQuery = currentUrl.searchParams.get("page");
  if (pageIdFromQuery && findPageById(pageIdFromQuery)) {
    return pageIdFromQuery;
  }
  const pageByRoute = PAGES.find((page) => page.route === currentUrl.pathname);
  if (pageByRoute) {
    return pageByRoute.id;
  }
  return LEGACY_PAGE_ROUTE_ALIASES.get(currentUrl.pathname) ?? null;
}

function resolveInitialPage() {
  const pageIdFromLocation = resolvePageIdFromLocation();
  if (pageIdFromLocation) {
    window.localStorage.setItem(STORAGE_KEYS.lastPage, pageIdFromLocation);
    return findPageById(pageIdFromLocation) ?? PAGES[0];
  }
  const lastPageId = window.localStorage.getItem(STORAGE_KEYS.lastPage);
  return findPageById(lastPageId) ?? findPageById("avatar-library") ?? PAGES[0];
}

function syncLocationToActivePage(mode = "replace") {
  const currentUrl = new URL(window.location.href);
  if (currentUrl.pathname === activePage.route && !currentUrl.search && !currentUrl.hash) {
    return;
  }
  currentUrl.pathname = activePage.route;
  currentUrl.search = "";
  currentUrl.hash = "";
  const state = { pageId: activePage.id };
  if (mode === "push") {
    window.history.pushState(state, "", currentUrl);
    return;
  }
  window.history.replaceState(state, "", currentUrl);
}

async function syncPageFromLocation() {
  const pageId = resolvePageIdFromLocation();
  const page = pageId ? findPageById(pageId) : null;
  if (!page || page.id === activePage.id) {
    return;
  }
  activePage = page;
  window.localStorage.setItem(STORAGE_KEYS.lastPage, activePage.id);
  renderNav();
  renderWorkspaceTabs();
  await renderPage();
  closeDrawers();
}

const PAGE_HELP = {
  "workflow-studio": {
    goal: "Use this page to build a workflow, let the backend plan the steps, and then run the next ready step.",
    before: [
      "The backend must be online or this page cannot load workflows.",
      "Pick the provider you actually want before you create the workflow. OpenAI uses cloud calls. local-llm expects your local model path to be working.",
      "If you do not see any workflows yet, that is normal. Make one here first.",
    ],
    steps: [
      "Click Refresh Workflows first so you are not looking at stale data.",
      "Choose Template and Provider in Settings Surface.",
      "Click Create Workflow if you do not already have one.",
      "Click Plan Selected to let the backend generate or replace the step list.",
      "Click Run Ready Step to execute the next step the planner marked ready.",
    ],
    success: [
      "The Display Surface shows a selected workflow, a ready step, or the last run result.",
      "The Shell Console logs successful plan or run requests.",
      "Page data health stays online after each action.",
    ],
    troubleshoot: [
      "If Run Ready Step fails, plan the workflow first. There may be no ready step yet.",
      "If provider calls fail, switch provider and try again to isolate whether the issue is cloud or local.",
      "If nothing loads, check API health in the top status row before changing settings.",
    ],
  },
  "build-control-tower": {
    goal: "Use this page as the build control tower: monitor agent lanes, submit and approve steps, enforce screenshot QA, and run tracked scripts.",
    before: [
      "This page depends on workflow data because approvals are tied to workflow steps.",
      "Screenshot capture and analysis are mandatory before final approve when screenshot enforcement is enabled.",
      "Script runs execute real PowerShell files from the script registry.",
    ],
    steps: [
      "Click Refresh Build Tower first.",
      "Submit the first ready step so it enters the approval queue.",
      "Capture and analyze screenshot evidence for the step before approval.",
      "Approve or request changes on the first pending step.",
      "Run a tracked script and open latest results.",
    ],
    success: [
      "Master checker shows queue and blocker counts.",
      "Approval queue drains only after explicit approve decisions.",
      "Screenshot analysis records exist before approve when enforcement is enabled.",
      "Script registry shows run status and latest results path.",
    ],
    troubleshoot: [
      "If approve fails, check whether screenshot evidence was analyzed for that step.",
      "If there is no step to submit, plan workflows first in Workflow Studio.",
      "If script run fails, inspect latest results output path in this page canvas.",
    ],
  },
  "avatar-library": {
    goal: "Use this page to confirm the active avatar system, preview a local avatar profile, and see whether the runtime bundle is actually ready.",
    before: [
      "Runtime settings and the asset manifest must be available from the backend.",
      "Default Profile, LOD, and Material are shell-side preview helpers. They do not publish files by themselves.",
      "Changing Avatar System affects the runtime system the clients load, so do not click Apply unless you mean it.",
    ],
    steps: [
      "Click Refresh Avatar Runtime first.",
      "Read the Display Surface. Pay attention to Avatar ready, missing assets, and active asset root.",
      "Adjust Default Profile, LOD, and Material if you want a local operator preview snapshot.",
      "If you need to switch the runtime avatar system, choose the value and then click Apply Avatar System.",
    ],
    success: [
      "Avatar ready reads true and missing assets stays at zero or a known small number.",
      "The mini preview updates as you change profile, LOD, and material.",
      "The active avatar system in Display Surface matches the value you selected.",
    ],
    troubleshoot: [
      "If Avatar ready is false, go fix the asset manifest or export pipeline before blaming this page.",
      "If Apply Avatar System appears to do nothing, refresh again and confirm the backend accepted the PATCH.",
      "If preview values reset, the backend may be returning a different active runtime system than the local shell default.",
    ],
  },
  "wardrobe-manager": {
    goal: "Use this page to manage outfit presets (clothing/hair/accessory sets), switch between them, create new presets, and verify compatibility with the current avatar runtime system.",
    before: [
      "This page depends on the same runtime settings and asset manifest used by Avatar Library.",
      "Outfit presets are stored with avatar runtime data in data/client/avatar-runtime.json.",
      "Each preset maps slots (base, hair, upper, lower, footwear, accessories) to asset ids from the manifest.",
    ],
    steps: [
      "Click Refresh Wardrobe Data to load presets and manifest.",
      "Read the Display Surface for current presets, active preset, and slot detail.",
      "Click Activate Selected Preset to cycle to the next outfit preset.",
      "To create a new preset, fill in the ID, Name, and Persona fields, then click Create New Preset.",
      "To delete a preset, activate it first, then click Delete Selected Preset.",
      "Only click Apply Avatar System if wardrobe data must be aligned to a different runtime system.",
    ],
    success: [
      "Presets appear in the display with slot assignments and correct persona.",
      "Activating a preset updates the active marker (●).",
      "Missing required stays at zero or a known exception list.",
    ],
    troubleshoot: [
      "If no presets appear, check data/client/wardrobe-presets.json exists.",
      "If a slot shows —, no asset is assigned to that slot in the active preset.",
      "If slots are missing from the manifest, re-run the export pipeline.",
    ],
  },
  "animation-library": {
    goal: "Use this page to inspect animation availability, run exports, run the full PlayCanvas pipeline, and verify the latest export report.",
    before: [
      "The backend must be online and able to reach the PowerShell export scripts under tools/.",
      "Runtime Profile changes export weight. high is for this RTX 4050 host, medium is for lighter clients, and low is for tiny watch-class targets.",
      "Export Runner and Pipeline Runner are path references. If these are wrong, the buttons will fail.",
    ],
    steps: [
      "Click Refresh Animations first so runtime settings, manifest, and export status are all current.",
      "Read clip counts and missing required clips in the Display Surface.",
      "Pick the Runtime Profile you want.",
      "Click Run Avatar Export for the modular asset export only, or Run Full Pipeline if you want the wider pipeline path.",
      "Click Refresh Export Report if you want to re-read the latest report files without running another export.",
      "Use Open Animation Viewer only after runtime assets are present and the viewer URL is valid.",
    ],
    success: [
      "Working Canvas shows an updated module export report, regular avatar build report, and last run summary.",
      "Clip counts look reasonable and Missing required clips is zero or explained.",
      "Shell Console shows the export route returning success instead of an error.",
    ],
    troubleshoot: [
      "If export fails immediately, verify the PowerShell script paths and confirm the backend process has access to them.",
      "If clip counts are zero, the asset manifest is probably stale or the animation export did not complete.",
      "If the viewer opens but looks wrong, refresh the export report first and confirm the runtime profile you used.",
    ],
  },
  "action-graph": {
    goal: "Use this page to test command routing and see which backend action a sample phrase maps to.",
    before: [
      "The commands endpoints must be live.",
      "Sample Phrase should be a real operator phrase, not random text, if you want a useful routing result.",
    ],
    steps: [
      "Click Refresh Commands.",
      "Choose Priority Mode if the backend supports different resolution behavior.",
      "Enter a Sample Phrase like show tasks or backup now.",
      "Click Execute Sample Command.",
    ],
    success: [
      "Display Surface shows the last execute result with action type and confidence.",
      "The Shell Console logs a successful /commands/execute request.",
    ],
    troubleshoot: [
      "If no command matched, try one of the known phrases listed by the error helper.",
      "If confidence is low, rewrite the phrase to match an existing command more closely.",
      "If command refresh fails, the command service or route is offline.",
    ],
  },
  "state-machine": {
    goal: "Use this page to see whether the runtime manifest covers the animation states the client expects.",
    before: [
      "This page reads client runtime settings and the asset manifest. It does not build state machines by itself.",
      "Default State is your intended startup state. The client still needs matching clip coverage in the manifest.",
    ],
    steps: [
      "Click Refresh State Data.",
      "Set Default State to the startup state you expect, usually idle.",
      "Check required state coverage gaps in the Display Surface.",
      "Use Animation Library if clips are missing and need to be exported again.",
    ],
    success: [
      "Required state coverage gaps reads none or only lists states you intentionally do not use.",
      "Detected animation slots looks consistent with the animation export you last ran.",
    ],
    troubleshoot: [
      "If idle, listen, or ack are missing, the runtime export is not covering expected client states.",
      "If manifest source is unknown, refresh runtime data and check backend health.",
    ],
  },
  "gesture-expression": {
    goal: "Use this page to choose talking style and control body morphs applied by the live client runtime.",
    before: [
      "Expression Profile still updates voice settings and does not directly drive skeleton clips.",
      "Body morph controls on this page are direct runtime controls that are discovered from the live work-lite client iframe.",
    ],
    steps: [
      "Click Refresh Voice Context.",
      "Pick calm, neutral, or high-energy.",
      "Click Apply Expression Profile.",
      "Click Scan Body Morphs From Client to pull all current body morph keys.",
      "Adjust morph sliders and click Apply Body Morphs.",
      "Re-read the Display Surface to confirm mode context and timeout values still look right.",
    ],
    success: [
      "The chosen expression profile stays selected after apply.",
      "Body morph slider changes are visible in the live client while animation states run.",
      "Voice status reloads without an error.",
    ],
    troubleshoot: [
      "If apply fails, the voice settings route is likely unavailable.",
      "If scan returns no keys, confirm the embedded work-lite client is loaded and fully scene-ready.",
      "If the page refreshes but behavior downstream does not change, inspect the voice consumer, not just this page.",
    ],
  },
  "asset-binding": {
    goal: "Use this page to see whether required runtime assets exist and whether validation should be strict or permissive.",
    before: [
      "This page is a read/check page. It does not repair assets by itself.",
      "Strict mode is better when you want to catch missing files early.",
    ],
    steps: [
      "Click Refresh Asset Validation.",
      "Read total asset entries and missing required assets.",
      "Use Validation Mode to decide how aggressive you want operator review to be.",
      "If assets are missing, jump to Animation Library or the export pipeline instead of ignoring it here.",
    ],
    success: [
      "All required assets present appears in the Display Surface.",
      "Missing required assets stays at zero.",
    ],
    troubleshoot: [
      "If required assets are missing, inspect the first missing names shown here and trace them back to the manifest or export stage.",
      "If this page is empty, the asset manifest call likely failed.",
    ],
  },
  "live-preview": {
    goal: "Use this page to confirm preview inputs are arriving before you spend time debugging the full client render.",
    before: [
      "This page needs camera matrix data plus runtime settings and asset manifest data.",
      "Camera Rig is a local control for how you want to think about the preview setup. It does not guarantee a client camera changed.",
    ],
    steps: [
      "Click Refresh Preview Inputs.",
      "Check whether Camera matrix loaded says yes.",
      "Confirm Avatar runtime ready is true.",
      "Use the clip count to verify the preview scene has animation material to work with.",
    ],
    success: [
      "Camera matrix loaded is yes.",
      "Avatar runtime ready is true.",
      "Animation clips available is greater than zero when the preview depends on motion.",
    ],
    troubleshoot: [
      "If the camera matrix is missing, fix the camera feed or route first.",
      "If preview is blank but inputs are healthy, the problem is probably in the viewer or scene layer, not the data fetch.",
    ],
  },
  "runtime-mapping": {
    goal: "Use this page to verify which runtime system and export profile the clients should receive, then run the full export pipeline when needed.",
    before: [
      "This page is the client-facing checkpoint. Use it after Avatar Library and Animation Library when you want to confirm what remote devices will consume.",
      "Export Profile here should match the class of client you are targeting.",
    ],
    steps: [
      "Click Refresh Runtime Mapping first.",
      "Check Active system, Asset root, and Ready for client export.",
      "Choose the Export Profile for the target device class.",
      "Use Apply Avatar System if clients need a different active system.",
      "Use Run Full Pipeline to regenerate the runtime delivery set.",
      "Use Refresh Export Report to re-read report files without rerunning the pipeline.",
    ],
    success: [
      "Ready for client export is true.",
      "Working Canvas shows fresh export report data for the current runtime profile.",
      "The active system shown here matches Avatar Library.",
    ],
    troubleshoot: [
      "If client export is not ready, do not keep toggling settings. Fix the pipeline output first.",
      "If the wrong system keeps appearing, refresh both this page and Avatar Library to rule out stale data.",
    ],
  },
  "devices-auth": {
    goal: "Use this page to check trust state, create a pairing session, register a test device, or open a temporary unlock window for sensitive actions.",
    before: [
      "These actions affect who can control the system. Treat them as operational changes, not harmless clicks.",
      "Unlock Minutes only matters when you intentionally want a temporary permission window.",
    ],
    steps: [
      "Click Refresh first.",
      "Check Auth mode and whether pairing is required.",
      "Click Create Pairing Session if you need to onboard a device and share the temporary code.",
      "Click Register Quick Device only for a controlled test device profile.",
      "Click Unlock First Device only when you intentionally want to grant a temporary access window.",
    ],
    success: [
      "Devices loaded is greater than zero when you already have registered devices.",
      "Latest pairing shows an id and code after creation.",
    ],
    troubleshoot: [
      "If pairing creation fails, check auth service health before retrying.",
      "If no devices are loaded, there may be nothing to unlock yet.",
      "If the auth mode looks wrong, refresh again before making trust changes.",
    ],
  },
  "providers-voice": {
    goal: "Use this page to confirm provider health, edit OpenAI and local-model config, keep persona prompts and backstories aligned, and validate voice output.",
    before: [
      "OpenAI configured must be true if you expect cloud voice features to work.",
      "Local LLM Base URL and Model must match the Ollama host and pulled model you actually want to use.",
      "Default Private Persona is the one private mode should start with. Active Private Persona is the one the backend will use on the next private reply right now.",
      "The persona prompts and persona backstory canon fields work together. Keep both realistic and consistent.",
      "Silence Timeout is in milliseconds. Bigger numbers wait longer before the system stops listening.",
    ],
    steps: [
      "Click Refresh.",
      "Check provider, local-model, and voice status first.",
      "Confirm the active private persona in the Display Surface before you test a private reply.",
      "Adjust local model settings, persona prompts, and persona backstory canon text if needed.",
      "If you want private mode to start in a different persona later, change Default Private Persona too.",
      "Click Save Personas + Backstories to persist prompts plus persona canon.",
      "Use the command phrases `vera mode`, `cherry mode`, or `doc im lonley` when you want to switch personas through normal control routing instead of editing the form again.",
      "Set Voice Mode and Silence Timeout.",
      "Click Save Voice to push the settings to the backend.",
      "Use Warmup to prime the voice path and Speak Test to verify output.",
    ],
    success: [
      "Local LLM settings reload with the model, timeout, and active private persona you just saved.",
      "Backstory canon reloads and is immediately available to both normal and private conversations.",
      "The Display Surface shows the persona-switch phrases so you do not have to remember them from memory.",
      "Voice settings reload and keep the values you just saved.",
      "Warmup and Speak Test return without errors.",
    ],
    troubleshoot: [
      "If OpenAI configured is false, cloud voice features will not work until credentials are fixed.",
      "If a persona-switch phrase resolves as a workflow instead of a command, refresh the backend first so the latest hardwired commands are loaded.",
      "If local replies are wrong in private mode, re-check which private persona is active and inspect that persona's prompt.",
      "If Speak Test fails but save worked, the issue is probably in the voice provider path, not the form.",
    ],
  },
  "change-governance": {
    goal: "Use this page to manage pending changes, approve or reject with reason, inspect immutable ledger history, and rollback to the last approved snapshot.",
    before: [
      "Build step submissions automatically create governance changes and snapshots.",
      "Approve and reject actions write to approvals and ledger history.",
      "Rollback restores files captured in the most recent approved snapshot.",
    ],
    steps: [
      "Click Refresh Governance.",
      "Approve or reject the first pending change as needed.",
      "Use Show Ledger History to verify immutable event trail.",
      "Use Rollback To Last Approved if you need to restore approved files.",
    ],
    success: [
      "Pending and approved counts match expected build actions.",
      "Ledger history includes create, submit, approve/reject, and revert events.",
      "Rollback returns restored file list.",
    ],
    troubleshoot: [
      "If no pending changes appear, submit a step from Build Control Tower first.",
      "If rollback fails, confirm at least one approved snapshot exists and includes files.",
      "If decisions fail, verify reviewer name is not empty.",
    ],
  },
  "organizer-control": {
    goal: "Use this page to review high-level counts, create a quick task, and confirm reminders or approvals are loading.",
    before: [
      "This page is an operations dashboard, not a full project editor.",
      "Default Task Priority applies to the quick task button on this page.",
    ],
    steps: [
      "Click Refresh.",
      "Read the dashboard counts and entity totals.",
      "Choose the default priority if you plan to create a quick task.",
      "Click Create Quick Task to drop in a fast placeholder task.",
      "Click Refresh Approvals when you only need approval data updated.",
    ],
    success: [
      "Projects, Tasks, Reminders, and Approvals all show non-error counts.",
      "A new quick task increases the task list after refresh.",
    ],
    troubleshoot: [
      "If dashboard counts are missing, the organizer endpoints are not returning data.",
      "If quick task creation fails, inspect the backend validation error in the Shell Console.",
    ],
  },
  "system-status": {
    goal: "Use this page to see full system health at a glance: backend uptime, provider readiness, voice status, build progress, recent errors, and browse the D: drive file system.",
    before: [
      "This page reads from the /system/ endpoints. The backend must be running.",
      "File browsing is sandboxed to D:\\Gail. You cannot navigate outside the project root.",
      "Only text files can be read (ts, js, json, md, etc). Binary files are blocked.",
    ],
    steps: [
      "Click Refresh System Status to load health, providers, voice, and build data.",
      "Set Browse Path to a subdirectory (e.g. 'backend/services') and click Browse Directory.",
      "Set Read File Path to a specific file (e.g. 'README.md') and click Read File.",
      "Click Show Error Log to see recent system errors.",
    ],
    success: [
      "Health checks show green for backend, providers, voice, and build-control.",
      "File browser lists directory contents with sizes and modification dates.",
      "File reader shows text content up to 512 KB.",
    ],
    troubleshoot: [
      "If health shows degraded, check which component is down in the health detail.",
      "If file read returns 415, the file type is not in the allowed text extensions list.",
      "If file read returns 413, the file exceeds the 512 KB limit.",
    ],
    setup: [
      "Start the backend: cd D:\\Gail; powershell -ExecutionPolicy Bypass -File .\\tools\\start-gail-stack.ps1",
      "If the backend does not start, check for stale Node processes: Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" and kill any holding port 4180.",
      "Verify the backend is reachable: curl http://127.0.0.1:4180/health should return HTTP 200.",
      "Build the backend after any TypeScript changes: cd D:\\Gail\\backend; npm run build (do NOT use npx tsc from root).",
    ],
    testing: [
      "Run the integration test suite: cd D:\\Gail; node tools/test-manager-agent-integration.js — expects 212/212 pass.",
      "Run the end-to-end workflow test: cd D:\\Gail; node tools/test-manager-build-workflow.js — expects 37/37 pass.",
      "The integration suite covers system status, file system browsing, error recording, and cross-system checks.",
      "Progress logs are saved to D:\\Gail\\data\\runtime\\manager-build-test-log.json after each e2e run.",
      "To verify a single endpoint manually: curl http://127.0.0.1:4180/system/status -H 'x-gail-device-id: test' -H 'x-gail-device-type: web_admin'",
    ],
  },
  "manager-agent": {
    goal: "Use this page to dispatch build/task directives to the manager agent, monitor both builders, and track directive lifecycle from pending through completion.",
    before: [
      "The manager agent (manager-alpha) coordinates two builders (builder-a and builder-b).",
      "Directives create workflows automatically. The manager dispatches and tracks them.",
      "The Avatar Request button sends the instruction through the avatar conversation bridge and returns a spoken reply.",
    ],
    steps: [
      "Click Refresh Manager Report to load current agent states and directive history.",
      "Type an instruction in Directive Instruction (e.g. 'Build the wardrobe panel').",
      "Set Priority and optionally force an Assignee.",
      "Click Dispatch Directive to create and send it to the manager.",
      "Click Avatar Request to route it through the avatar conversation bridge instead.",
      "Monitor the Display Surface to watch directive status updates.",
      "Click Cancel First Active to abort a running directive if needed.",
    ],
    success: [
      "Directive appears in the list with status dispatched or completed.",
      "Manager status shows busy when a directive is active.",
      "Builder status shows which agent is handling the work.",
      "Avatar request returns a spoken reply confirming the dispatch.",
    ],
    troubleshoot: [
      "If dispatch fails, check whether the backend can create workflows (workflow service must be healthy).",
      "If all builders show idle but directives are pending, the dispatch may have failed silently. Check system errors.",
      "If avatar request returns no reply, the manager handleAvatarRequest method may have thrown. Check the error log.",
    ],
    setup: [
      "Start the backend: cd D:\\Gail; powershell -ExecutionPolicy Bypass -File .\\tools\\start-gail-stack.ps1",
      "Verify the manager is online: curl http://127.0.0.1:4180/manager/status — should return agentId manager-alpha.",
      "Verify both builders: curl http://127.0.0.1:4180/manager/builders — should return builder-a and builder-b with status idle.",
      "Build after source changes: cd D:\\Gail\\backend; npm run build — then restart the stack.",
      "Kill stale Node processes before restart if port 4180 is occupied: Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Stop-Process -Force",
      "The manager keyword regex in control-intent-service.ts uses dispatch/assign task instead of build/make it to avoid collisions with build-control features.",
    ],
    testing: [
      "Run the integration test suite: cd D:\\Gail; node tools/test-manager-agent-integration.js — expects 212/212 pass.",
      "Run the end-to-end workflow test: cd D:\\Gail; node tools/test-manager-build-workflow.js — expects 37/37 pass.",
      "The e2e test creates a real directive, plans a 6-step workflow, executes all steps, writes a calculator program to D:\\Gail\\temp\\manager-test-output/, and verifies it runs (15/15 tests).",
      "Variation coverage: priority levels (low/normal/high/critical), explicit builder assignment (ai→builder-a, codex→builder-b), mid-flight cancellation, concurrent directives, control-intent keyword routing, and non-manager text bypass.",
      "To test a single directive manually: curl -X POST http://127.0.0.1:4180/manager/directives -H 'Content-Type: application/json' -H 'x-gail-device-id: test' -H 'x-gail-device-type: web_admin' -d '{\"instruction\":\"test task\",\"priority\":\"normal\"}'",
      "To test the avatar bridge: curl -X POST http://127.0.0.1:4180/manager/avatar-request -H 'Content-Type: application/json' -H 'x-gail-device-id: test' -H 'x-gail-device-type: web_admin' -d '{\"instruction\":\"deploy the test module\"}'",
      "Build logs are persisted at D:\\Gail\\data\\runtime\\manager-build-test-log.json with timestamped entries for every action.",
    ],
  },
};

const HELP_GLOSSARY = {
  common: [
    { term: "API health", meaning: "A quick status light showing whether the shell can still talk to the backend." },
    { term: "Display Surface", meaning: "Read-only output. This is where you look before you click anything risky." },
    { term: "Settings Surface", meaning: "The form area where you choose values before running an action." },
    { term: "Action Surface", meaning: "The button area. These buttons tell the backend to do real work." },
    { term: "Route", meaning: "The backend URL path this page depends on. If the route is down, the page may look broken." },
  ],
  runtime: [
    { term: "Avatar system", meaning: "The named runtime package or configuration the client should load." },
    { term: "Asset manifest", meaning: "The backend list of files and asset entries the runtime expects to use." },
    { term: "Export profile", meaning: "A quality level. High keeps more detail, medium cuts weight, and low cuts harder for tiny devices." },
    { term: "Pipeline", meaning: "The longer export path that rebuilds more than one asset step, not just a single file." },
  ],
  workflow: [
    { term: "Template", meaning: "A starter shape for a workflow. It changes the kind of step plan the backend will build." },
    { term: "Provider", meaning: "The engine doing the AI work, such as OpenAI or a local model." },
    { term: "Ready step", meaning: "The next workflow step the backend says can run now." },
  ],
  auth: [
    { term: "Pairing session", meaning: "A temporary setup window used to connect a device safely." },
    { term: "Unlock window", meaning: "A short time where a device is allowed to do sensitive actions." },
  ],
  voice: [
    { term: "Voice mode", meaning: "How the system listens, such as push-to-talk or wake word." },
    { term: "Silence timeout", meaning: "How long the system waits before it decides you stopped talking." },
    { term: "Default private persona", meaning: "The persona private mode should start with when no newer override is in play." },
    { term: "Active private persona", meaning: "The persona the backend will use on the next private local reply." },
    { term: "Persona prompt", meaning: "The local system instruction that shapes Vera or Cherry behavior in private mode." },
    { term: "Persona backstory canon", meaning: "Internal continuity context for each persona that keeps behavior realistic and consistent over time." },
    { term: "Local LLM", meaning: "The Ollama-backed local model path used for fallback and all private-mode replies." },
  ],
};

const GUIDED_FLOWS = {
  "workflow-studio": ["workflow_refresh", "workflow_create", "workflow_plan", "workflow_run_ready", "workflow_open_review_queue"],
  "build-control-tower": ["build_refresh", "build_submit_step", "build_capture_screenshot", "build_analyze_screenshot", "build_approve_step", "build_run_script", "build_show_latest_results"],
  "avatar-library": ["avatar_refresh", "avatar_apply_system"],
  "wardrobe-manager": ["wardrobe_refresh", "wardrobe_select_preset", "wardrobe_create_preset", "wardrobe_voice_save", "wardrobe_delete_preset", "wardrobe_apply_system"],
  "animation-library": ["animation_refresh", "animation_seed_master_plan", "animation_run_export", "animation_run_pipeline", "open_animation_viewer"],
  "action-graph": ["action_refresh", "action_save_mapping", "action_execute_sample"],
  "state-machine": ["state_refresh"],
  "gesture-expression": ["gesture_refresh", "gesture_apply_profile", "gesture_scan_body_morphs", "gesture_apply_body_morphs", "gesture_clear_body_morphs"],
  "asset-binding": ["asset_refresh"],
  "live-preview": ["preview_refresh"],
  "runtime-mapping": ["runtime_refresh", "runtime_apply_system", "runtime_run_pipeline", "runtime_refresh_report"],
  "devices-auth": ["auth_refresh", "pairing_create", "device_register", "device_unlock", "display_refresh", "display_apply"],
  "providers-voice": ["provider_refresh", "provider_set_key", "provider_clear_key", "local_llm_save", "voice_save", "voice_warmup", "voice_test"],
  "change-governance": ["governance_refresh", "governance_approve_first", "governance_history", "governance_rollback_last"],
  "feature-inbox": ["feature_refresh", "feature_add", "feature_promote_first"],
  "report-bugs": ["bug_refresh", "bug_capture_create", "bug_update_first"],
  "pass-review": ["review_refresh"],
  "organizer-control": ["organizer_refresh", "task_create_quick", "approval_refresh"],
  "manager-agent": ["manager_refresh", "manager_dispatch", "manager_avatar_request", "manager_gail_approve", "manager_gail_reject", "manager_cancel_first"],
};

const COMMAND_PALETTE_QUICK_ACTIONS = [
  { id: "quick_build_refresh", label: "Run Build: Refresh Tower", pageId: "build-control-tower", actionId: "build_refresh", summary: "Refresh build overview, queue, lanes, and scripts." },
  { id: "quick_build_approve", label: "Run Build: Approve First Pending", pageId: "build-control-tower", actionId: "build_approve_step", summary: "Approve the first pending build step." },
  { id: "quick_action_save_mapping", label: "Run Action Graph: Save Phrase Mapping", pageId: "action-graph", actionId: "action_save_mapping", summary: "Persist a custom command phrase mapping." },
  { id: "quick_action_execute_sample", label: "Run Action Graph: Execute Sample Phrase", pageId: "action-graph", actionId: "action_execute_sample", summary: "Execute the sample phrase through command routing." },
  { id: "quick_governance_refresh", label: "Run Governance: Refresh", pageId: "change-governance", actionId: "governance_refresh", summary: "Refresh pending, approved, and ledger history." },
  { id: "quick_governance_approve", label: "Run Governance: Approve First Pending", pageId: "change-governance", actionId: "governance_approve_first", summary: "Approve the first pending governance change." },
  { id: "quick_feature_add", label: "Run Feature Inbox: Add Feature Request", pageId: "feature-inbox", actionId: "feature_add", summary: "Capture a typed feature request into backlog." },
  { id: "quick_bug_capture_create", label: "Run Report Bugs: Capture + Report", pageId: "report-bugs", actionId: "bug_capture_create", summary: "Capture screenshot evidence and write a bug report." },
  { id: "quick_workflow_review_queue", label: "Open Workflow Review Queue", pageId: "workflow-studio", actionId: "workflow_open_review_queue", summary: "Jump directly to Build Control Tower review queue." },
  { id: "quick_gail_approve", label: "Gail: Approve First Awaiting Directive", pageId: "manager-agent", actionId: "manager_gail_approve", summary: "Gail approves the first directive awaiting her sign-off." },
  { id: "quick_gail_reject", label: "Gail: Reject First Awaiting Directive", pageId: "manager-agent", actionId: "manager_gail_reject", summary: "Gail rejects the first directive awaiting her sign-off." },
  { id: "quick_manager_dispatch", label: "Dispatch Directive to Manager", pageId: "manager-agent", actionId: "manager_dispatch", summary: "Create and dispatch a new directive. Gail reviews the result." },
];

const SHELL_COMMAND_ACTIONS = {
  open_tasks: { pageId: "organizer-control" },
  open_build_control_tower: { pageId: "build-control-tower" },
  show_build_approval_queue: { pageId: "build-control-tower" },
  run_build_script: { pageId: "build-control-tower", actionId: "build_run_script", actionLabel: "Run Script" },
  show_build_results: { pageId: "build-control-tower", actionId: "build_show_latest_results", actionLabel: "Show Latest Results" },
  capture_build_screenshot: { pageId: "build-control-tower", actionId: "build_capture_screenshot", actionLabel: "Capture Build Screenshot" },
  analyze_build_screenshot: { pageId: "build-control-tower", actionId: "build_analyze_screenshot", actionLabel: "Analyze Current Screen" },
  request_build_changes: { pageId: "build-control-tower", actionId: "build_request_changes", actionLabel: "Request Changes First Pending" },
  approve_build_step: { pageId: "build-control-tower", actionId: "build_approve_step", actionLabel: "Approve First Pending Step" },
  show_pending_changes: { pageId: "change-governance" },
  show_last_approved_change: { pageId: "change-governance" },
  explain_change_reason: { pageId: "change-governance" },
  approve_change: { pageId: "change-governance", actionId: "governance_approve_first", actionLabel: "Approve First Pending" },
  reject_change: { pageId: "change-governance", actionId: "governance_reject_first", actionLabel: "Reject First Pending" },
  rollback_last_approved: { pageId: "change-governance", actionId: "governance_rollback_last", actionLabel: "Rollback To Last Approved" },
  show_change_history: { pageId: "change-governance", actionId: "governance_history", actionLabel: "Show Ledger History" },
  set_display_mode_wake_word: { pageId: "devices-auth", actionId: "display_apply", actionLabel: "Apply Display Mode + Target", beforeRun: () => setSettingValue("display.input_mode", "wake_word") },
  set_display_mode_always_listening: { pageId: "devices-auth", actionId: "display_apply", actionLabel: "Apply Display Mode + Target", beforeRun: () => setSettingValue("display.input_mode", "always_listening") },
  set_display_mode_typed: { pageId: "devices-auth", actionId: "display_apply", actionLabel: "Apply Display Mode + Target", beforeRun: () => setSettingValue("display.input_mode", "typed") },
  switch_private_persona_counselor: { pageId: "providers-voice" },
  switch_private_persona_girlfriend: { pageId: "providers-voice" },
  report_bug: { pageId: "report-bugs" },
  add_feature_request: { pageId: "feature-inbox" },
};

const runtime = { workflows: [], selectedWorkflowId: null, workflowExecution: null, buildOverview: null, buildAgents: [], buildScripts: [], buildScriptRun: null, buildScriptResults: null, buildCapture: null, buildAnalysis: null, governanceChanges: [], governancePending: [], governanceApproved: [], governanceHistory: [], governanceRollback: null, featureBacklog: [], bugReports: [], authStatus: null, devices: [], pairingSession: null, providers: [], openAiConfig: null, localLlmConfig: null, backstoryProfile: null, voiceSettings: null, voiceStatus: null, dashboard: null, projects: [], tasks: [], reminders: [], approvals: [], clientRuntimeSettings: null, clientAssetManifest: null, animationCatalog: null, deviceDisplayProfiles: null, exportStatus: null, exportRunResult: null, viewerHealth: null, cameraMatrix: null, commands: [], commandMappings: [], commandExecution: null, gestureProfile: "calm", bodyMorphCatalog: [], bodyMorphBreastKeys: [], bodyMorphOverrides: {}, bodyMorphMotionOnly: true, systemStatus: null, systemErrors: [], systemFiles: [], systemFileContent: null, managerReport: null, managerDirectives: [], managerAvatarReply: null };
const ui = { pendingActions: new Set(), pageHealth: {}, pageLoadState: {}, auditTrail: [], guidedMode: false, guidedProgress: {}, pageNotes: {} };

const el = {
  navGroups: document.getElementById("nav-groups"),
  navFilter: document.getElementById("nav-filter"),
  workspaceTabs: document.getElementById("workspace-tabs"),
  pageTitle: document.getElementById("page-title"),
  pageSubtitle: document.getElementById("page-subtitle"),
  pageRoute: document.getElementById("page-route"),
  pageState: document.getElementById("page-state"),
  pageDataHealth: document.getElementById("page-data-health"),
  apiHealthPill: document.getElementById("api-health-pill"),
  guidedModePill: document.getElementById("guided-mode-pill"),
  clientSurfacePill: document.getElementById("client-surface-pill"),
  settingsForm: document.getElementById("settings-form"),
  displayList: document.getElementById("display-list"),
  actionList: document.getElementById("action-list"),
  pageQuickstart: document.getElementById("page-quickstart"),
  workingCanvas: document.getElementById("working-canvas"),
  pageNotesTitle: document.getElementById("page-notes-title"),
  pageNotesForm: document.getElementById("page-notes-form"),
  pageNoteTitle: document.getElementById("page-note-title"),
  pageNoteDetails: document.getElementById("page-note-details"),
  pageNoteStatus: document.getElementById("page-note-status"),
  savePageNote: document.getElementById("save-page-note"),
  promotePageNote: document.getElementById("promote-page-note"),
  clearPageNotes: document.getElementById("clear-page-notes"),
  pageNotesList: document.getElementById("page-notes-list"),
  avatarMiniWrap: document.getElementById("avatar-mini-wrap"),
  avatarMiniName: document.getElementById("avatar-mini-name"),
  avatarMiniMeta: document.getElementById("avatar-mini-meta"),
  inspectorSummary: document.getElementById("inspector-summary"),
  entityList: document.getElementById("entity-list"),
  routeList: document.getElementById("route-list"),
  pageHelpContent: document.getElementById("page-help-content"),
  auditList: document.getElementById("audit-list"),
  auditClear: document.getElementById("audit-clear"),
  shellConsole: document.getElementById("shell-console"),
  toggleConsole: document.getElementById("toggle-console"),
  consoleWrap: document.querySelector(".console-wrap"),
  densityMode: document.getElementById("density-mode"),
  openHelp: document.getElementById("open-help"),
  toggleGuided: document.getElementById("toggle-guided"),
  openCommand: document.getElementById("open-command"),
  openChange: document.getElementById("open-change"),
  commandDialog: document.getElementById("command-dialog"),
  changeDialog: document.getElementById("change-dialog"),
  changePage: document.getElementById("change-page"),
  changeTitle: document.getElementById("change-title"),
  changeDetails: document.getElementById("change-details"),
  submitChange: document.getElementById("submit-change"),
  commandFilter: document.getElementById("command-filter"),
  commandResults: document.getElementById("command-results"),
  toggleNav: document.getElementById("toggle-nav"),
  toggleInspector: document.getElementById("toggle-inspector"),
  backdrop: document.getElementById("drawer-backdrop"),
  toastStack: document.getElementById("toast-stack"),
  bottomDock: document.getElementById("bottom-dock"),
  dockHandle: document.getElementById("dock-handle"),
  dockCollapse: document.getElementById("dock-collapse"),
  dockProperties: document.getElementById("dock-properties"),
  dockDebug: document.getElementById("dock-debug"),
  dockWorkflows: document.getElementById("dock-workflows"),
  wfCanvas: document.getElementById("wf-canvas"),
  wfRefresh: document.getElementById("wf-refresh"),
  wfCreate: document.getElementById("wf-create"),
  viewportIframe: document.getElementById("viewport-iframe"),
};

let activePage = resolveInitialPage();

void initialize();

async function initialize() {
  hydrateDensity();
  runtime.gestureProfile = window.localStorage.getItem(STORAGE_KEYS.gestureProfile) || "calm";
  ui.auditTrail = loadAuditTrail();
  const guidedPref = window.localStorage.getItem(STORAGE_KEYS.guidedMode);
  ui.guidedMode = guidedPref === null ? false : guidedPref === "true";
  ui.guidedProgress = loadGuidedProgress();
  ui.pageNotes = loadPageNotes();
  bindEvents();
  renderGuidedModeState();
  renderNav();
  renderWorkspaceTabs();
  await renderPage();
  syncLocationToActivePage("replace");
  await consumeLocationCommandIntent();
  renderAuditTrail();
  renderCommandResults();
  await refreshApiHealth();
  logLine(`[shell] ready page=${activePage.id}`, "info");
}

function hydrateDensity() {
  const density = window.localStorage.getItem(STORAGE_KEYS.density);
  if (density && ["studio", "compact", "ultra"].includes(density)) {
    document.body.dataset.density = density;
    el.densityMode.value = density;
  }
}

function bindEvents() {
  el.navFilter.addEventListener("input", renderNav);
  el.settingsForm.addEventListener("input", onSettingsInput);
  if (el.toggleConsole) el.toggleConsole.addEventListener("click", toggleConsole);
  el.densityMode.addEventListener("change", onDensityChange);
  bindDockEvents();
  el.openHelp.addEventListener("click", openPageHelp);
  el.toggleGuided.addEventListener("click", toggleGuidedMode);
  el.openCommand.addEventListener("click", openCommandPalette);
  el.openChange.addEventListener("click", openChangeDialog);
  el.submitChange.addEventListener("click", () => void submitChangeRequest());
  el.savePageNote.addEventListener("click", () => savePageNote());
  el.promotePageNote.addEventListener("click", promoteDraftPageNoteToChangeDialog);
  el.clearPageNotes.addEventListener("click", clearActivePageNotes);
  el.auditClear.addEventListener("click", clearAuditTrail);
  el.workingCanvas.addEventListener("click", (event) => {
    const target = event.target;
    if (!isElementNode(target) || typeof target.closest !== "function") {
      return;
    }
    const actionNode = target.closest("[data-canvas-action-id]");
    if (!isElementNode(actionNode)) {
      return;
    }
    const actionId = actionNode.dataset.canvasActionId;
    if (!actionId) {
      return;
    }
    const presetId = actionNode.dataset.presetId;
    if (presetId) {
      runtime._selectedWardrobePresetId = presetId;
    }
    const label = actionNode.dataset.actionLabel || actionNode.textContent?.trim() || actionId;
    void runAction(actionId, label);
  });
  el.workingCanvas.addEventListener("input", (event) => {
    const target = event.target;
    if (!isElementNode(target) || target.getAttribute("data-body-morph-key") === null || !isValueElement(target)) {
      return;
    }
    const key = target.getAttribute("data-body-morph-key") || "";
    if (!key) {
      return;
    }
    const value = Number.parseFloat(target.value || "0");
    const clamped = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
    runtime.bodyMorphOverrides[key] = clamped;
    const valueNode = document.querySelector(`[data-body-morph-value="${cssEscapeSelector(key)}"]`);
    if (isElementNode(valueNode)) {
      valueNode.textContent = clamped.toFixed(2);
    }
  });
  el.commandFilter.addEventListener("input", renderCommandResults);
  el.commandDialog.addEventListener("click", (event) => {
    if (event.target === el.commandDialog) {
      el.commandDialog.close();
    }
  });
  window.addEventListener("keydown", onKeyDown);
  if (el.workspaceTabs) {
    el.workspaceTabs.addEventListener("click", (event) => {
      const target = event.target;
      if (!isElementNode(target) || typeof target.closest !== "function") {
        return;
      }
      const button = target.closest("[data-page-id]");
      if (!isElementNode(button)) {
        return;
      }
      const pageId = button.dataset.pageId;
      if (!pageId) {
        return;
      }
      void openPageById(pageId);
    });
  }
  el.toggleNav.addEventListener("click", () => toggleDrawer("nav-open", "inspector-open"));
  el.toggleInspector.addEventListener("click", () => toggleDrawer("inspector-open", "nav-open"));
  el.backdrop.addEventListener("click", closeDrawers);
  window.addEventListener("popstate", () => {
    void syncPageFromLocation();
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 1100) {
      closeDrawers();
    }
  });
  window.addEventListener("message", onShellMorphMessage);
}

function renderWorkspaceTabs() {
  if (!el.workspaceTabs) {
    return;
  }
  const tabButtons = el.workspaceTabs.querySelectorAll(".workspace-tab");
  tabButtons.forEach((node) => {
    const button = node;
    if (!isButtonElement(button)) {
      return;
    }
    const pageId = button.dataset.pageId;
    const active = pageId === activePage.id;
    button.classList.toggle("is-active", active);
  });
}

function toggleConsole() {
  if (el.consoleWrap) {
    el.consoleWrap.classList.toggle("collapsed");
    if (el.toggleConsole) el.toggleConsole.textContent = el.consoleWrap.classList.contains("collapsed") ? "Expand" : "Collapse";
  }
}

/* ─── BOTTOM DOCK ─── */
function bindDockEvents() {
  if (!el.bottomDock) return;

  // Tab switching
  el.dockHandle.addEventListener("click", (event) => {
    const tab = event.target.closest(".dock-tab");
    if (!tab) return;
    const dockId = tab.dataset.dock;
    if (!dockId) return;
    switchDockTab(dockId);
  });

  // Collapse/expand
  if (el.dockCollapse) {
    el.dockCollapse.addEventListener("click", () => {
      const collapsed = el.bottomDock.classList.toggle("is-collapsed");
      el.dockCollapse.textContent = collapsed ? "▲" : "▼";
    });
  }

  // Drag resize
  let resizing = false;
  let startY = 0;
  let startH = 0;
  el.dockHandle.addEventListener("mousedown", (event) => {
    if (event.target.closest("button")) return;
    resizing = true;
    startY = event.clientY;
    startH = el.bottomDock.offsetHeight;
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";
    event.preventDefault();
  });
  document.addEventListener("mousemove", (event) => {
    if (!resizing) return;
    const delta = startY - event.clientY;
    const newH = Math.max(80, Math.min(window.innerHeight * 0.65, startH + delta));
    document.documentElement.style.setProperty("--dock-h", newH + "px");
    el.bottomDock.classList.remove("is-collapsed");
    el.dockCollapse.textContent = "▼";
  });
  document.addEventListener("mouseup", () => {
    if (!resizing) return;
    resizing = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  });

  // Workflow buttons
  if (el.wfRefresh) el.wfRefresh.addEventListener("click", () => void renderWorkflowGraph());
  if (el.wfCreate) el.wfCreate.addEventListener("click", () => void createWorkflowFromDock());
}

function switchDockTab(dockId) {
  const tabs = el.dockHandle.querySelectorAll(".dock-tab");
  tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.dock === dockId));
  [el.dockProperties, el.dockDebug, el.dockWorkflows].forEach((panel) => {
    if (panel) panel.classList.toggle("is-hidden", panel.dataset.dock !== dockId);
  });
  el.bottomDock.classList.remove("is-collapsed");
  el.dockCollapse.textContent = "▼";
  if (dockId === "workflows") void renderWorkflowGraph();
}

function onDensityChange() {
  const next = el.densityMode.value;
  document.body.dataset.density = next;
  window.localStorage.setItem(STORAGE_KEYS.density, next);
  logLine(`[shell] density=${next}`, "info");
}

function loadGuidedProgress() {
  const parsed = safeParseJson(window.localStorage.getItem(STORAGE_KEYS.guidedProgress) || "{}");
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
}

function loadPageNotes() {
  const parsed = safeParseJson(window.localStorage.getItem(STORAGE_KEYS.pageNotes) || "{}");
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
}

function persistPageNotes() {
  window.localStorage.setItem(STORAGE_KEYS.pageNotes, JSON.stringify(ui.pageNotes));
}

function persistGuidedProgress() {
  window.localStorage.setItem(STORAGE_KEYS.guidedProgress, JSON.stringify(ui.guidedProgress));
}

function toggleGuidedMode() {
  ui.guidedMode = !ui.guidedMode;
  window.localStorage.setItem(STORAGE_KEYS.guidedMode, String(ui.guidedMode));
  renderGuidedModeState();
  void renderPage();
  notifyInfo(ui.guidedMode ? "Guided mode enabled." : "Guided mode disabled.");
}

function renderGuidedModeState() {
  if (el.toggleGuided) {
    el.toggleGuided.textContent = `Guided: ${ui.guidedMode ? "On" : "Off"}`;
    el.toggleGuided.classList.toggle("is-active", ui.guidedMode);
  }
  if (el.guidedModePill) {
    el.guidedModePill.textContent = `Guided: ${ui.guidedMode ? "on" : "off"}`;
    el.guidedModePill.classList.toggle("is-online", ui.guidedMode);
    if (!ui.guidedMode) {
      el.guidedModePill.classList.remove("is-online");
    }
  }
}

function onKeyDown(event) {
  if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === "l") {
    event.preventDefault();
    el.navFilter.focus();
    return;
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    openCommandPalette();
    return;
  }
  if (event.altKey && !event.ctrlKey && !event.metaKey && event.key.toLowerCase() === "g") {
    event.preventDefault();
    toggleGuidedMode();
    return;
  }
  if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey) {
    if (event.key === "1") {
      event.preventDefault();
      void openPageById("workflow-studio");
      return;
    }
    if (event.key === "2") {
      event.preventDefault();
      void openPageById("build-control-tower");
      return;
    }
    if (event.key === "3") {
      event.preventDefault();
      void openPageById("action-graph");
      return;
    }
    if (event.key === "4") {
      event.preventDefault();
      void openPageById("change-governance");
      return;
    }
  }
  if (event.key === "F1" || event.key === "?") {
    event.preventDefault();
    openPageHelp();
    return;
  }
  if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "r") {
    event.preventDefault();
    void renderPage();
    notifyInfo("Current page refreshed.");
    return;
  }
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    runPrimaryAction();
  }
}

async function openPageById(pageId) {
  const page = findPageById(pageId);
  if (!page) {
    notifyError(`Unknown page id: ${pageId}`);
    return;
  }
  await setActivePage(page);
}

function runPrimaryAction() {
  const firstAction = activePage.actions[0];
  if (!firstAction) {
    notifyInfo("No primary action available for this page.");
    return;
  }
  void runAction(firstAction.id, firstAction.label);
}

function toggleDrawer(target, closeTarget) {
  const opened = document.body.classList.toggle(target);
  if (opened) {
    document.body.classList.remove(closeTarget);
  }
}

function closeDrawers() {
  document.body.classList.remove("nav-open");
  document.body.classList.remove("inspector-open");
}

function openPageHelp() {
  document.body.classList.add("inspector-open");
  document.body.classList.remove("nav-open");
  if (el.pageHelpContent) {
    el.pageHelpContent.scrollIntoView({ block: "start", behavior: "smooth" });
  }
  notifyInfo(`Help opened for ${activePage.title}.`);
}

function renderNav() {
  const query = el.navFilter.value.trim().toLowerCase();
  const visiblePages = PAGES.filter((page) => {
    if (!query) {
      return true;
    }
    return `${page.title} ${page.summary} ${page.group}`.toLowerCase().includes(query);
  });

  const groups = new Map();
  for (const page of visiblePages) {
    if (!groups.has(page.group)) {
      groups.set(page.group, []);
    }
    groups.get(page.group).push(page);
  }

  el.navGroups.innerHTML = "";
  if (visiblePages.length === 0) {
    const empty = document.createElement("section");
    empty.className = "nav-group";
    empty.innerHTML = "<h3>No Results</h3><p class=\"nav-empty\">No pages match your filter.</p>";
    el.navGroups.appendChild(empty);
    return;
  }

  for (const [groupName, pages] of groups) {
    const section = document.createElement("section");
    section.className = "nav-group";
    const header = document.createElement("h3");
    header.textContent = groupName;
    section.appendChild(header);
    const nav = document.createElement("nav");

    for (const page of pages) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = page.title;
      if (page.id === activePage.id) {
        button.classList.add("active");
      }
      button.addEventListener("click", () => void setActivePage(page));
      nav.appendChild(button);
    }

    section.appendChild(nav);
    el.navGroups.appendChild(section);
  }
}

async function setActivePage(page) {
  if (page.id === activePage.id) {
    closeDrawers();
    return;
  }
  activePage = page;
  window.localStorage.setItem(STORAGE_KEYS.lastPage, activePage.id);
  syncLocationToActivePage("push");
  renderNav();
  renderWorkspaceTabs();
  await renderPage();
  appendAudit("navigate", `Page opened: ${activePage.title}`, "info");
  closeDrawers();
  logLine(`[shell] page=${activePage.id}`, "info");
}

async function renderPage() {
  el.pageTitle.textContent = activePage.title;
  el.pageSubtitle.textContent = activePage.summary;
  el.pageRoute.textContent = `Route: ${activePage.route}`;
  if (el.pageState) el.pageState.textContent = `State: ${activePage.state}`;
  renderClientSurfacePill();
  if (el.inspectorSummary) el.inspectorSummary.textContent = `Group: ${activePage.group}.`;
  renderLoadingSkeleton();
  markPageHealth(activePage.id, {
    status: "unknown",
    message: "Data: loading",
    lastError: undefined,
  });

  try {
    await loadPageData(activePage.id);
    ui.pageLoadState[activePage.id] = { status: "ready" };
    markPageHealth(activePage.id, {
      status: "online",
      message: "Data: synced",
      lastSyncAt: new Date().toISOString(),
      lastError: undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    ui.pageLoadState[activePage.id] = { status: "error", message };
    markPageHealth(activePage.id, {
      status: "degraded",
      message: "Data: partial/failure",
      lastError: message,
    });
    notifyError(`Page load failed: ${message}`);
    logLine(`[page] load failed id=${activePage.id} message=${message}`, "error");
  }

  renderWorkingCanvas();
  renderPageHealth();

  const settings = hydrateSettings(activePage);
  renderSettingsForm(activePage, settings);

  const dynamicDisplays = buildDynamicDisplays(activePage.id);
  const displayItems = dynamicDisplays.length > 0 ? dynamicDisplays : activePage.displays;
  el.displayList.innerHTML = "";
  for (const text of displayItems) {
    const block = document.createElement("div");
    block.className = "stack-item";
    block.textContent = text;
    el.displayList.appendChild(block);
  }

  el.actionList.innerHTML = "";
  for (const action of activePage.actions) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "action-btn";
    button.dataset.actionId = action.id;
    button.textContent = action.label;
    const lockReason = getGuidedActionLockReason(activePage.id, action.id);
    if (lockReason) {
      button.disabled = true;
      button.classList.add("is-guided-locked");
      button.title = lockReason;
    }
    button.addEventListener("click", () => void runAction(action.id, action.label));
    el.actionList.appendChild(button);
  }

  el.entityList.innerHTML = "";
  for (const entity of activePage.entities) {
    const item = document.createElement("li");
    item.textContent = entity;
    el.entityList.appendChild(item);
  }
  el.routeList.innerHTML = "";
  for (const route of activePage.routes) {
    const item = document.createElement("li");
    item.textContent = route;
    el.routeList.appendChild(item);
  }

  renderPageHelp();
  renderPageQuickstart();
  if (activePage.id === "animation-library") {
    seedAnimationChecklistFromPlans();
  }
  renderPageNotesPanel();

  renderAvatarMiniPreview();
}

function renderClientSurfacePill() {
  if (!el.clientSurfacePill) {
    return;
  }
  const hasClientRoute = Array.isArray(activePage.routes) && activePage.routes.some((route) => String(route).startsWith("/client/"));
  const label = hasClientRoute ? "Client surface: connected" : "Client surface: shell module";
  el.clientSurfacePill.textContent = label;
  el.clientSurfacePill.classList.remove("is-online", "is-offline");
  el.clientSurfacePill.classList.add("is-online");
}

function getActivePageNotes() {
  const pageNotes = ui.pageNotes[activePage.id];
  return Array.isArray(pageNotes) ? pageNotes : [];
}

function normalizeNoteStatus(status) {
  return NOTE_STATUS_OPTIONS.includes(status) ? status : "open";
}

function getGroupedPageNotes(statusFilter = "all") {
  const grouped = {};
  for (const [pageId, notes] of Object.entries(ui.pageNotes)) {
    if (!Array.isArray(notes) || notes.length === 0) {
      continue;
    }
    const filtered = notes.filter((note) => statusFilter === "all" || normalizeNoteStatus(note.status) === statusFilter);
    if (filtered.length > 0) {
      grouped[pageId] = filtered;
    }
  }
  return grouped;
}

function renderPageNotesPanel() {
  if (!el.pageNotesList || !el.pageNotesTitle) {
    return;
  }
  if (el.pageNotesTitle) el.pageNotesTitle.textContent = `${activePage.title} Next Pass Notes`;
  const notes = getActivePageNotes();
  el.pageNotesList.innerHTML = "";
  if (notes.length === 0) {
    el.pageNotesList.innerHTML = '<p class="page-note-empty">No next-pass notes saved for this page yet.</p>';
    return;
  }
  for (const note of notes) {
    const card = document.createElement("article");
    card.className = "page-note-card";
    const savedAt = note.at ? new Date(note.at).toLocaleString() : "unknown time";
    const status = normalizeNoteStatus(note.status);
    card.innerHTML = `
      <strong>${escapeHtml(note.title || "Untitled note")}</strong>
      <div class="page-note-meta"><span class="page-note-status is-${escapeHtml(status)}">${escapeHtml(status)}</span><small>Saved ${escapeHtml(savedAt)} | ${escapeHtml(activePage.title)}</small></div>
      <p>${escapeHtml(note.details || "")}</p>
    `;
    const actions = document.createElement("div");
    actions.className = "action-list";
    const statusSelect = document.createElement("select");
    statusSelect.className = "ghost";
    for (const value of NOTE_STATUS_OPTIONS) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      option.selected = value === status;
      statusSelect.appendChild(option);
    }
    statusSelect.addEventListener("change", () => updatePageNoteStatus(note.id, statusSelect.value));
    const promote = document.createElement("button");
    promote.type = "button";
    promote.className = "ghost";
    promote.textContent = "Open In Change Request";
    promote.addEventListener("click", () => openChangeDialogFromNote(note));
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "ghost";
    remove.textContent = "Delete";
    remove.addEventListener("click", () => deletePageNote(note.id));
    actions.appendChild(statusSelect);
    actions.appendChild(promote);
    actions.appendChild(remove);
    card.appendChild(actions);
    el.pageNotesList.appendChild(card);
  }
}

function savePageNote() {
  const title = (el.pageNoteTitle.value || "").trim();
  const details = (el.pageNoteDetails.value || "").trim();
  if (!title || !details) {
    notifyError("Page note requires both a title and details.");
    return;
  }
  const existing = getActivePageNotes();
  const note = {
    id: `${activePage.id}-${Date.now()}`,
    at: new Date().toISOString(),
    title,
    details,
    status: normalizeNoteStatus(el.pageNoteStatus.value),
    pageId: activePage.id,
    pageTitle: activePage.title,
    route: activePage.route,
  };
  ui.pageNotes[activePage.id] = [note, ...existing].slice(0, 50);
  persistPageNotes();
  renderPageNotesPanel();
  el.pageNoteTitle.value = "";
  el.pageNoteDetails.value = "";
  el.pageNoteStatus.value = "open";
  appendAudit("page_note_saved", `Saved next-pass note: ${title}`, "info");
  notifySuccess("Page note saved for the next pass.");
}

function updatePageNoteStatus(noteId, nextStatus) {
  const status = normalizeNoteStatus(nextStatus);
  const notes = getActivePageNotes().map((note) => note.id === noteId ? { ...note, status } : note);
  ui.pageNotes[activePage.id] = notes;
  persistPageNotes();
  renderPageNotesPanel();
  if (activePage.id === "pass-review") {
    renderWorkingCanvas();
  }
  notifyInfo(`Page note marked ${status}.`);
}

function deletePageNote(noteId) {
  const existing = getActivePageNotes();
  ui.pageNotes[activePage.id] = existing.filter((note) => note.id !== noteId);
  if (ui.pageNotes[activePage.id].length === 0) {
    delete ui.pageNotes[activePage.id];
  }
  persistPageNotes();
  renderPageNotesPanel();
  notifyInfo("Page note deleted.");
}

function clearActivePageNotes() {
  const existing = getActivePageNotes();
  if (existing.length === 0) {
    notifyInfo("No page notes to clear.");
    return;
  }
  const accepted = window.confirm(`Clear all saved next-pass notes for ${activePage.title}?`);
  if (!accepted) {
    return;
  }
  delete ui.pageNotes[activePage.id];
  persistPageNotes();
  renderPageNotesPanel();
  notifyInfo("Page notes cleared.");
}

function promoteDraftPageNoteToChangeDialog() {
  const title = (el.pageNoteTitle.value || "").trim();
  const details = (el.pageNoteDetails.value || "").trim();
  if (!title && !details) {
    openChangeDialog();
    return;
  }
  openChangeDialogFromNote({ title, details });
}

function openChangeDialogFromNote(note) {
  openChangeDialog();
  el.changeTitle.value = `${activePage.title}: ${note.title || ""}`;
  el.changeDetails.value = note.details || "";
}

function clearCompletedPageNotes() {
  const nextPageNotes = {};
  for (const [pageId, notes] of Object.entries(ui.pageNotes)) {
    if (!Array.isArray(notes)) {
      continue;
    }
    const remaining = notes.filter((note) => !["done", "rolled-into-build"].includes(normalizeNoteStatus(note.status)));
    if (remaining.length > 0) {
      nextPageNotes[pageId] = remaining;
    }
  }
  ui.pageNotes = nextPageNotes;
  persistPageNotes();
}

function renderPageQuickstart() {
  if (!el.pageQuickstart) {
    return;
  }
  const help = PAGE_HELP[activePage.id] ?? buildFallbackHelp(activePage);
  const steps = Array.isArray(help.steps) ? help.steps.slice(0, 3) : [];
  const guidedStatus = getGuidedPageStatus(activePage.id);
  el.pageQuickstart.classList.remove("is-hidden");
  el.pageQuickstart.innerHTML = [
    `<div class="page-quickstart-head"><h3>Start Here</h3><span class="page-quickstart-status">${escapeHtml(guidedStatus.summary)}</span></div>`,
    `<p>${escapeHtml(help.goal)}</p>`,
    steps.length > 0
      ? `<ol>${steps.map((step, index) => `<li class="${escapeHtml(getQuickstartStepClass(guidedStatus, index))}">${escapeHtml(step)}</li>`).join("")}</ol>`
      : '<p class="page-help-tip">No quick steps written yet.</p>',
  ].join("");
}

function getGuidedFlow(pageId) {
  return Array.isArray(GUIDED_FLOWS[pageId]) ? GUIDED_FLOWS[pageId] : [];
}

function getCompletedGuidedActions(pageId) {
  const completed = ui.guidedProgress[pageId];
  return Array.isArray(completed) ? completed : [];
}

function getGuidedPageStatus(pageId) {
  if (!ui.guidedMode) {
    return { summary: "Guided mode off", nextIndex: -1, completedCount: 0, flowLength: 0 };
  }
  const flow = getGuidedFlow(pageId);
  const completed = getCompletedGuidedActions(pageId);
  const nextIndex = flow.findIndex((actionId) => !completed.includes(actionId));
  const completedCount = flow.filter((actionId) => completed.includes(actionId)).length;
  if (flow.length === 0) {
    return { summary: "No guided path", nextIndex: -1, completedCount: 0, flowLength: 0 };
  }
  if (nextIndex === -1) {
    return { summary: `Guide complete ${completedCount}/${flow.length}`, nextIndex, completedCount, flowLength: flow.length };
  }
  return { summary: `Step ${nextIndex + 1} of ${flow.length}`, nextIndex, completedCount, flowLength: flow.length };
}

function getQuickstartStepClass(guidedStatus, index) {
  if (!ui.guidedMode) {
    return "";
  }
  if (index < guidedStatus.completedCount) {
    return "is-done";
  }
  if (index === guidedStatus.nextIndex) {
    return "is-next";
  }
  return "is-locked";
}

function getGuidedActionLockReason(pageId, actionId) {
  if (!ui.guidedMode) {
    return "";
  }
  if (pageId === "devices-auth" && (actionId === "display_refresh" || actionId === "display_apply")) {
    return "";
  }
  const flow = getGuidedFlow(pageId);
  if (!flow.includes(actionId)) {
    return "";
  }
  const completed = getCompletedGuidedActions(pageId);
  const targetIndex = flow.indexOf(actionId);
  const requiredBefore = flow.slice(0, targetIndex);
  const missing = requiredBefore.filter((requiredAction) => !completed.includes(requiredAction));
  if (missing.length === 0) {
    return "";
  }
  const nextAction = activePage.actions.find((action) => action.id === missing[0]);
  return `Guided mode: finish ${nextAction?.label || missing[0]} first.`;
}

function markGuidedActionComplete(pageId, actionId) {
  const flow = getGuidedFlow(pageId);
  if (!flow.includes(actionId)) {
    return;
  }
  const completed = new Set(getCompletedGuidedActions(pageId));
  completed.add(actionId);
  ui.guidedProgress[pageId] = flow.filter((guidedAction) => completed.has(guidedAction));
  persistGuidedProgress();
}

function renderPageHelp() {
  if (!el.pageHelpContent) {
    return;
  }
  const help = PAGE_HELP[activePage.id] ?? buildFallbackHelp(activePage);
  const settingsHtml = renderHelpRows(activePage.settings, (setting) => `${setting.help} Current default: ${setting.value}.`);
  const actionsHtml = renderHelpRows(activePage.actions, (action) => explainAction(action.id, action.label));
  const glossaryHtml = renderHelpRows(getGlossaryEntries(activePage.id), (entry) => entry.meaning, { labelKey: "term" });

  el.pageHelpContent.innerHTML = [
    renderHelpSection("What This Page Is For", `<p class="page-help-lead">${escapeHtml(help.goal)}</p>`),
    renderHelpSection("Quick Start", '<p class="page-help-tip">If you are new: read the Display Surface first, then follow the first three steps below before trying any other buttons.</p>'),
    renderHelpSection("Before You Start", renderHelpList(help.before, false)),
    renderHelpSection("Do This In Order", renderHelpList(help.steps, true)),
    renderHelpSection("What The Settings Mean", settingsHtml),
    renderHelpSection("What The Buttons Do", actionsHtml),
    renderHelpSection("Plain English Glossary", glossaryHtml),
    renderHelpSection("Success Looks Like", renderHelpList(help.success, false)),
    renderHelpSection("If It Looks Broken", renderHelpList(help.troubleshoot, false)),
  ].join("");
}

function getGlossaryEntries(pageId) {
  const entries = [...HELP_GLOSSARY.common];
  if (["avatar-library", "wardrobe-manager", "animation-library", "state-machine", "asset-binding", "live-preview", "runtime-mapping"].includes(pageId)) {
    entries.push(...HELP_GLOSSARY.runtime);
  }
  if (["workflow-studio", "build-control-tower"].includes(pageId)) {
    entries.push(...HELP_GLOSSARY.workflow);
  }
  if (pageId === "devices-auth") {
    entries.push(...HELP_GLOSSARY.auth);
  }
  if (pageId === "providers-voice" || pageId === "gesture-expression") {
    entries.push(...HELP_GLOSSARY.voice);
  }
  return entries;
}

function buildFallbackHelp(page) {
  return {
    goal: `Use ${page.title} to manage ${page.summary.toLowerCase()}`,
    before: [
      "Make sure the API is online before trusting anything on this page.",
      "Read the route list in the inspector so you know which backend endpoints this page depends on.",
    ],
    steps: [
      `Click the first action button on ${page.title} to load fresh data.`,
      "Review the Display Surface before you change settings.",
      "Only use action buttons after the data health pill shows synced or you know why it is degraded.",
    ],
    success: [
      "The display data updates and the Shell Console logs a successful request.",
    ],
    troubleshoot: [
      "If the page stays empty, check API health and the routes listed in the inspector.",
    ],
  };
}

function renderHelpSection(title, bodyHtml) {
  return `<section class="page-help-section"><h4>${escapeHtml(title)}</h4>${bodyHtml}</section>`;
}

function renderHelpList(items, ordered) {
  if (!Array.isArray(items) || items.length === 0) {
    return '<p class="page-help-empty">No help details written yet.</p>';
  }
  const tag = ordered ? "ol" : "ul";
  return `<${tag} class="page-help-list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</${tag}>`;
}

function renderHelpRows(items, descriptionBuilder, options = {}) {
  if (!Array.isArray(items) || items.length === 0) {
    return '<p class="page-help-empty">Nothing configurable on this part of the page.</p>';
  }
  const labelKey = options.labelKey || "label";
  return `<div class="page-help-table">${items.map((item) => `<div class="page-help-row"><strong>${escapeHtml(String(item[labelKey] ?? ""))}</strong><span>${escapeHtml(descriptionBuilder(item))}</span></div>`).join("")}</div>`;
}

function explainAction(actionId, actionLabel) {
  const explanations = {
    avatar_refresh: "Reload runtime settings and asset manifest for avatar data.",
    avatar_set_persona: "Apply the selected persona mode (normal, Vera, or Cherry) to the backend.",
    avatar_edit_personas: "Navigate to Providers and Voice to edit full persona prompts.",
    avatar_edit_commands: "Navigate to Action Graph to edit command phrases and mappings.",
    wardrobe_refresh: "Reload runtime settings and asset manifest for wardrobe data.",
    wardrobe_select_preset: "Activate the next wardrobe preset (cycles through available presets).",
    wardrobe_create_preset: "Create a new empty wardrobe preset using the fields above.",
    wardrobe_voice_save: "Save the selected preset's voice profile so the frontend applies it automatically for that avatar.",
    wardrobe_delete_preset: "Delete the currently active wardrobe preset.",
    animation_refresh: "Reload runtime settings, asset manifest, and export status for animation work.",
    animation_refresh_report: "Reload only the export reports without running another export.",
    asset_refresh: "Reload the current asset manifest and validation data.",
    runtime_refresh: "Reload runtime settings, manifest, and export status for client delivery checks.",
    runtime_refresh_report: "Reload only the export reports for runtime mapping.",
    state_refresh: "Reload runtime state coverage data from the manifest.",
    preview_refresh: "Reload preview inputs, including camera matrix and runtime data.",
    action_refresh: "Reload available command definitions.",
    action_save_mapping: "Save a new phrase mapping for a command key so future matching includes it.",
    action_execute_sample: "Send the sample phrase to the backend and show which command it matched.",
    gesture_refresh: "Reload voice settings and current voice mode context.",
    gesture_apply_profile: "Save the selected expression style into backend voice instructions.",
    avatar_apply_system: "Push the selected avatar runtime system to the backend.",
    wardrobe_apply_system: "Push the selected avatar runtime system to the backend.",
    animation_apply_system: "Push the selected avatar runtime system to the backend.",
    runtime_apply_system: "Push the selected avatar runtime system to the backend.",
    animation_run_export: "Run the direct avatar asset export with the selected runtime profile.",
    animation_seed_master_plan: "Seed the Animation Library checklist from the two master animation plans so tasks can be checked off one-by-one.",
    animation_run_pipeline: "Run the full PlayCanvas export pipeline with the selected runtime profile.",
    runtime_run_pipeline: "Run the full PlayCanvas export pipeline for the client runtime profile on this page.",
    workflow_refresh: "Reload workflow records from the backend.",
    workflow_create: "Create a new workflow using the current template and provider settings.",
    workflow_plan: "Ask the backend to generate or replace the selected workflow plan.",
    workflow_run_ready: "Run the next step currently marked ready.",
    workflow_open_review_queue: "Open Build Control Tower so pending workflow review checkpoints are visible.",
    build_refresh: "Reload build control overview, agent lanes, and script registry.",
    build_submit_step: "Submit the first ready workflow step into the build approval queue.",
    build_approve_step: "Approve the first pending review step (enforcing screenshot evidence by default).",
    build_request_changes: "Request changes on the first pending review step with reviewer notes.",
    build_capture_screenshot: "Capture build screenshot evidence for the first pending review step.",
    build_analyze_screenshot: "Analyze latest captured screenshot and store a QA report.",
    build_run_script: "Run the selected script id from the build script registry.",
    build_show_latest_results: "Load latest result history for the selected build script.",
    open_animation_viewer: "Open the external viewer URL in a new browser tab.",
    auth_refresh: "Reload auth status and registered devices.",
    pairing_create: "Create a new pairing session and temporary pairing code.",
    device_register: "Register a quick trusted device profile for testing.",
    device_unlock: "Grant a temporary sensitive-action window to the first loaded device.",
    display_refresh: "Reload device display profiles and current input mode settings.",
    display_apply: "Apply selected display target and input mode for runtime clients.",
    provider_refresh: "Reload provider, local-model, persona, and voice status.",
    provider_set_key: "Store a new OpenAI API key in local provider config.",
    provider_clear_key: "Clear the stored OpenAI API key from local provider config.",
    local_llm_save: "Save the Ollama connection, active private persona, local prompts, and persona backstory canon.",
    voice_save: "Save the current voice mode and timeout values.",
    voice_warmup: "Warm the voice pipeline without speaking a long line.",
    voice_test: "Send a short test line to the voice output path.",
    governance_refresh: "Reload pending/approved governance changes and ledger history.",
    governance_approve_first: "Approve the first pending change using the configured reviewer and reason.",
    governance_reject_first: "Reject the first pending change using the configured reviewer and reason.",
    governance_rollback_last: "Rollback to the last approved snapshot and restore captured files.",
    governance_history: "Reload recent immutable change ledger events.",
    feature_refresh: "Reload feature backlog entries with stage and status filters.",
    feature_add: "Add a new feature request into backlog capture storage.",
    feature_promote_first: "Promote the first visible feature item into task/workflow/change request.",
    bug_refresh: "Reload bug issues from the local report log.",
    bug_capture: "Attach a deterministic screenshot record to the first visible issue.",
    bug_create: "Create a bug report from the current summary and reproduction fields.",
    bug_capture_create: "Create a report and attach a screenshot record in one action.",
    bug_update_first: "Update the first visible bug with status and note details.",
    organizer_refresh: "Reload dashboard, project, task, reminder, and approval data.",
    task_create_quick: "Create a quick task using the selected default priority.",
    approval_refresh: "Reload approval requests only.",
  };
  return explanations[actionId] || `${actionLabel} runs the named backend action for this page.`;
}

function renderLoadingSkeleton() {
  ui.pageLoadState[activePage.id] = { status: "loading" };
  el.settingsForm.innerHTML = "<div class=\"skeleton skeleton-line\"></div><div class=\"skeleton skeleton-line\"></div><div class=\"skeleton skeleton-line short\"></div>";
  el.displayList.innerHTML = "<div class=\"skeleton skeleton-line\"></div><div class=\"skeleton skeleton-line\"></div><div class=\"skeleton skeleton-line\"></div>";
  el.actionList.innerHTML = "<div class=\"skeleton skeleton-button\"></div><div class=\"skeleton skeleton-button\"></div><div class=\"skeleton skeleton-button\"></div>";
  el.workingCanvas.textContent = "Loading page data...";
}

function renderWorkingCanvas() {
  el.workingCanvas.classList.remove("canvas-rich");
  const loadState = ui.pageLoadState[activePage.id];
  if (loadState?.status === "error") {
    el.workingCanvas.textContent = `${activePage.canvas}\n\nUnable to load page data.\n${loadState.message || "Unknown error."}\n\nCheck API health and retry the page action.`;
    return;
  }
  if (activePage.id === "pass-review") {
    renderPassReviewCanvas();
    return;
  }
  if (activePage.id === "animation-library") {
    renderAnimationLibraryCanvas();
    return;
  }
  if (activePage.id === "wardrobe-manager") {
    renderWardrobeManagerCanvas();
    return;
  }
  if (activePage.id === "gesture-expression") {
    renderGestureExpressionCanvas();
    return;
  }
  if (activePage.id === "live-preview" || activePage.id === "runtime-mapping") {
    renderClientStageCanvas(activePage.id);
    return;
  }
  if (activePage.id === "build-control-tower") {
    const overview = runtime.buildOverview;
    const lanes = Array.isArray(runtime.buildAgents) ? runtime.buildAgents : [];
    const scripts = Array.isArray(runtime.buildScripts) ? runtime.buildScripts : [];
    const queueLines = Array.isArray(overview?.approvalQueue) && overview.approvalQueue.length > 0
      ? overview.approvalQueue.slice(0, 8).map((entry) => `- ${entry.stepTitle} (${entry.stepId}) in ${entry.workflowTitle} assignee=${entry.assignee} screenshotEvidence=${entry.hasScreenshotEvidence ? "ready" : "missing"}`)
      : ["- none"];
    const laneLines = lanes.length > 0
      ? lanes.map((lane) => `- ${lane.assignee}: ${lane.currentStepTitle || "no active step"} status=${lane.currentStepStatus || "none"} pendingReview=${lane.pendingApprovalCount}${lane.blockerReason ? ` blocker=${lane.blockerReason}` : ""}`)
      : ["- none"];
    const scriptLines = scripts.length > 0
      ? scripts.slice(0, 8).map((script) => `- ${script.id}: ${script.lastStatus || "never_run"} ${script.lastRunAt ? `at ${new Date(script.lastRunAt).toLocaleString()}` : ""}`)
      : ["- none"];
    const latestResult = runtime.buildScriptResults?.latest
      ? `Latest script result: ${runtime.buildScriptResults.latest.scriptId} ${runtime.buildScriptResults.latest.status} ${runtime.buildScriptResults.latest.outputPath}`
      : "Latest script result: none loaded";
    const captureLine = runtime.buildCapture?.screenshotPath
      ? `Last capture: ${runtime.buildCapture.screenshotPath}`
      : "Last capture: none";
    const analysisLine = runtime.buildAnalysis?.screenshotPath
      ? `Last analysis: ${runtime.buildAnalysis.screenshotPath} issues=${Array.isArray(runtime.buildAnalysis.issues) ? runtime.buildAnalysis.issues.length : 0}`
      : "Last analysis: none";

    el.workingCanvas.textContent = [
      activePage.canvas,
      "",
      `Master checker: ${overview?.masterChecker?.status ?? "unknown"} | pending=${overview?.masterChecker?.pendingApprovals ?? 0} | blocked=${overview?.masterChecker?.blockedSteps ?? 0}`,
      `Progress: ${overview?.progress?.percentComplete ?? 0}% (${overview?.progress?.completedSteps ?? 0}/${overview?.progress?.stepCount ?? 0})`,
      "",
      "Approval queue:",
      ...queueLines,
      "",
      "Agent lanes:",
      ...laneLines,
      "",
      "Scripts:",
      ...scriptLines,
      "",
      latestResult,
      captureLine,
      analysisLine,
    ].join("\n");
    return;
  }
  if (activePage.id === "change-governance") {
    const pendingLines = Array.isArray(runtime.governancePending) && runtime.governancePending.length > 0
      ? runtime.governancePending.slice(0, 8).map((entry) => `- ${entry.changeId} state=${entry.approvalState} source=${entry.sourceType}:${entry.sourceId} reason=${entry.reason}`)
      : ["- none"];
    const approved = runtime.governanceApproved?.[0];
    const approvedLine = approved
      ? `Last approved: ${approved.changeId} snapshot=${approved.lastApprovedSnapshotId || approved.latestSnapshotId} at ${approved.updatedAt}`
      : "Last approved: none";
    const historyLines = Array.isArray(runtime.governanceHistory) && runtime.governanceHistory.length > 0
      ? runtime.governanceHistory.slice(0, 10).map((event) => `- ${event.timestamp} ${event.action} ${event.changeId} state=${event.approvalState}`)
      : ["- none"];
    const rollbackLine = runtime.governanceRollback
      ? `Last rollback: change=${runtime.governanceRollback.changeId} snapshot=${runtime.governanceRollback.snapshotId} files=${runtime.governanceRollback.restoredFiles?.length ?? 0}`
      : "Last rollback: none";
    el.workingCanvas.textContent = [
      activePage.canvas,
      "",
      "Pending changes:",
      ...pendingLines,
      "",
      approvedLine,
      rollbackLine,
      "",
      "Ledger history:",
      ...historyLines,
    ].join("\n");
    return;
  }
  if (activePage.id === "feature-inbox") {
    const entries = getFilteredFeatureBacklog();
    const lines = entries.length > 0
      ? entries.slice(0, 12).map((entry) => `- ${entry.id} [${entry.status}] ${entry.stageTarget} ${entry.priority} source=${entry.source} links task=${entry.linkedTaskId || "-"} workflow=${entry.linkedWorkflowId || "-"} change=${entry.linkedChangeId || "-"}`)
      : ["- none"];
    el.workingCanvas.textContent = [
      activePage.canvas,
      "",
      "Feature queue:",
      ...lines,
    ].join("\n");
    return;
  }
  if (activePage.id === "report-bugs") {
    const issues = getFilteredBugReports();
    const lines = issues.length > 0
      ? issues.slice(0, 12).map((entry) => `- ${entry.id} [${entry.status}] ${entry.title} page=${entry.pageId} shots=${Array.isArray(entry.screenshotPaths) ? entry.screenshotPaths.length : 0}`)
      : ["- none"];
    el.workingCanvas.textContent = [
      activePage.canvas,
      "",
      "Issue log:",
      ...lines,
    ].join("\n");
    return;
  }
  if (activePage.id === "action-graph") {
    const commandLines = Array.isArray(runtime.commands) && runtime.commands.length > 0
      ? runtime.commands.slice(0, 12).map((command) => `- ${command.key}: ${Array.isArray(command.phrases) ? command.phrases.join(" | ") : "no phrases"}`)
      : ["- none"];
    const mappingLines = Array.isArray(runtime.commandMappings) && runtime.commandMappings.length > 0
      ? runtime.commandMappings.slice(0, 12).map((mapping) => `- ${mapping.commandKey}: ${mapping.phrase}`)
      : ["- none"];
    const executeLine = runtime.commandExecution
      ? `Last execute: matched=${runtime.commandExecution.command?.key ?? "unknown"} status=${runtime.commandExecution.status ?? "unknown"}`
      : "Last execute: none";
    el.workingCanvas.textContent = [
      activePage.canvas,
      "",
      "Commands:",
      ...commandLines,
      "",
      "Custom mappings:",
      ...mappingLines,
      "",
      executeLine,
    ].join("\n");
    return;
  }
  if (!["animation-library", "runtime-mapping"].includes(activePage.id)) {
    const emptyStateMessage = getPageEmptyStateMessage(activePage.id);
    if (emptyStateMessage) {
      el.workingCanvas.textContent = `${activePage.canvas}\n\n${emptyStateMessage}`;
      return;
    }
    el.workingCanvas.textContent = activePage.canvas;
    return;
  }

  const status = runtime.exportStatus;
  const moduleReport = status?.reports?.moduleExport;
  const regularReport = status?.reports?.regularAvatarBuild;
  const lastRun = runtime.exportRunResult;

  if (!status) {
    el.workingCanvas.textContent = `${activePage.canvas}\n\nExport status not loaded yet.`;
    return;
  }

  const moduleLines = moduleReport?.exists
    ? [
        `Module export: ${moduleReport.profileLabel || moduleReport.profile || "unknown profile"}`,
        `Updated: ${moduleReport.updatedAt ? new Date(moduleReport.updatedAt).toLocaleString() : "unknown"}`,
        `Exports: ${moduleReport.exportCount ?? 0}`,
        `Types: ${formatExportsByType(moduleReport.exportsByType)}`,
        `Samples: ${Array.isArray(moduleReport.samplePaths) && moduleReport.samplePaths.length ? moduleReport.samplePaths.join(", ") : "none"}`,
      ]
    : ["Module export report not found."];

  const regularLines = regularReport?.exists
    ? [
        `Regular avatar build updated: ${regularReport.updatedAt ? new Date(regularReport.updatedAt).toLocaleString() : "unknown"}`,
        `Removed shape keys: ${regularReport.removedCount ?? 0}`,
        `Master source: ${regularReport.sourceMasterFile || "unknown"}`,
        `Regular output: ${regularReport.outputRegularFile || "unknown"}`,
      ]
    : ["Regular avatar build report not found."];

  const lastRunLines = lastRun
    ? [
        `Last run: ${lastRun.runner} profile=${lastRun.runtimeProfile} duration=${lastRun.durationMs}ms`,
        `Command: ${lastRun.command}`,
        lastRun.stderr ? `stderr: ${lastRun.stderr}` : `stdout: ${(lastRun.stdout || "completed").slice(0, 400)}`,
      ]
    : ["Last run: none in this session."];

  const checklistSummary = getAnimationChecklistSummary();
  const checklistLines = activePage.id === "animation-library"
    ? [
        "Master animation plans:",
        ...MASTER_ANIMATION_PLAN_PATHS.map((path, index) => `  ${index + 1}. ${path}`),
        "",
        `Checklist progress: ${checklistSummary.done}/${checklistSummary.total} done`,
      ]
    : [];

  el.workingCanvas.textContent = [
    activePage.canvas,
    "",
    ...moduleLines,
    "",
    ...regularLines,
    "",
    ...checklistLines,
    ...(checklistLines.length > 0 ? [""] : []),
    ...lastRunLines,
  ].join("\n");
}

function getPageEmptyStateMessage(pageId) {
  if (pageId === "workflow-studio" && runtime.workflows.length === 0) {
    return "No workflows are available yet. Create one in this page, then plan it.";
  }
  if (pageId === "build-control-tower" && !runtime.buildOverview) {
    return "Build overview is not loaded yet. Refresh Build Tower to populate queue and lanes.";
  }
  if (pageId === "change-governance" && (!Array.isArray(runtime.governanceHistory) || runtime.governanceHistory.length === 0)) {
    return "No governance history is loaded yet. Refresh Governance to hydrate change and ledger data.";
  }
  if (pageId === "feature-inbox" && (!Array.isArray(runtime.featureBacklog) || runtime.featureBacklog.length === 0)) {
    return "No feature requests yet. Add one with Add Feature Request.";
  }
  if (pageId === "report-bugs" && (!Array.isArray(runtime.bugReports) || runtime.bugReports.length === 0)) {
    return "No bug reports yet. Use Capture + Report to create first entry.";
  }
  if (pageId === "devices-auth" && !runtime.authStatus && runtime.devices.length === 0) {
    return "Auth and device data are empty. Refresh this page to load device trust and pairing state.";
  }
  if (pageId === "providers-voice" && (!Array.isArray(runtime.providers) || runtime.providers.length === 0) && !runtime.voiceSettings && !runtime.localLlmConfig) {
    return "Provider and voice data are empty. Refresh to load telemetry, local-model config, and current voice settings.";
  }
  if (pageId === "organizer-control" && !runtime.dashboard && runtime.projects.length === 0 && runtime.tasks.length === 0) {
    return "Organizer surfaces are empty. Refresh to load projects, tasks, reminders, and approvals.";
  }
  if (["avatar-library", "wardrobe-manager", "state-machine", "asset-binding", "runtime-mapping"].includes(pageId) && !runtime.clientAssetManifest) {
    return "Asset manifest is empty. Refresh runtime data to load asset health and mapping details.";
  }
  if (pageId === "action-graph" && (!Array.isArray(runtime.commands) || runtime.commands.length === 0) && (!Array.isArray(runtime.commandMappings) || runtime.commandMappings.length === 0) && !runtime.commandExecution) {
    return "No commands are loaded yet. Refresh commands, then run Execute Sample Command.";
  }
  if (pageId === "live-preview" && !runtime.cameraMatrix && !runtime.clientRuntimeSettings) {
    return "Preview inputs are empty. Refresh Preview Inputs to load camera and runtime state.";
  }
  return null;
}

function renderPassReviewCanvas() {
  const grouped = getGroupedPageNotes(getSettingValue("review.status_filter") || "all");
  const groupEntries = Object.entries(grouped);
  if (groupEntries.length === 0) {
    el.workingCanvas.textContent = `${activePage.canvas}\n\nNo saved page notes match the current filter.`;
    return;
  }
  const sections = groupEntries.map(([pageId, notes]) => {
    const page = PAGES.find((candidate) => candidate.id === pageId);
    const title = page?.title || pageId;
    const lines = notes.map((note) => {
      const savedAt = note.at ? new Date(note.at).toLocaleString() : "unknown time";
      return `- [${note.status || "open"}] ${note.title} (${savedAt})\n  ${note.details}`;
    });
    return [`${title} (${notes.length})`, ...lines].join("\n");
  });
  el.workingCanvas.textContent = [activePage.canvas, "", ...sections].join("\n\n");
}

function renderUnavailableWorkflowCard(title, reasonLines, backlogIds, fileName) {
  return `
    <section class="canvas-card canvas-card-wide">
      <div class="canvas-card-head">
        <h3>${escapeHtml(title)}</h3>
        <span class="pill is-offline">Unavailable in current build</span>
      </div>
      <div class="canvas-empty">
        <p>${escapeHtml(reasonLines[0] || "This workflow is unavailable in the current build.")}</p>
        ${reasonLines.slice(1).map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
        <p><strong>Tracked backlog:</strong> ${escapeHtml(backlogIds.join(", "))} in ${escapeHtml(fileName)}.</p>
      </div>
    </section>
  `;
}

function renderAnimationLibraryCanvas() {
  const manifestAssets = Array.isArray(runtime.clientAssetManifest?.assets) ? runtime.clientAssetManifest.assets : [];
  const animationAssets = manifestAssets.filter((asset) => asset.kind === "animation");
  const catalogExists = Boolean(runtime.animationCatalog?.exists);
  const catalogTotal = Number(runtime.animationCatalog?.totalFiles || 0);
  const catalogTopCategories = Array.isArray(runtime.animationCatalog?.categories)
    ? runtime.animationCatalog.categories.slice(0, 8)
    : [];
  const catalogSamples = Array.isArray(runtime.animationCatalog?.samplePaths)
    ? runtime.animationCatalog.samplePaths.slice(0, 10)
    : [];
  const viewerUrl = getSettingValue("anim.viewer_url") || "http://127.0.0.1:4180/client/anim-test/";
  const viewerReachable = Boolean(runtime.viewerHealth?.reachable);
  const viewerStatus = viewerReachable
    ? `<span class="pill is-online">Viewer online (${escapeHtml(String(runtime.viewerHealth?.status ?? 200))})</span>`
    : `<span class="pill is-offline">Viewer offline</span>`;
  const status = runtime.exportStatus;
  const moduleReport = status?.reports?.moduleExport;
  const regularReport = status?.reports?.regularAvatarBuild;
  const exportSummary = [
    `Module exports: ${moduleReport?.exportCount ?? 0}`,
    `Regular build removed keys: ${regularReport?.removedCount ?? 0}`,
    `Last export update: ${moduleReport?.updatedAt ? new Date(moduleReport.updatedAt).toLocaleString() : "unknown"}`,
    `Animation catalog root: ${runtime.animationCatalog?.root || "not loaded"}`,
    `Animation catalog files: ${catalogExists ? catalogTotal : 0}`,
  ];
  const clipRows = animationAssets.length > 0
    ? animationAssets.map((asset) => {
        const name = escapeHtml(asset.name || asset.id || "unnamed");
        const slot = escapeHtml(asset.slot || "unassigned");
        const present = asset.present ? "present" : "missing";
        return `<tr><td>${name}</td><td>${slot}</td><td>${present}</td></tr>`;
      }).join("")
    : "<tr><td colspan=\"3\">No animation assets detected in manifest yet.</td></tr>";

  const viewerFrame = viewerReachable
    ? `<iframe class="canvas-iframe" src="${escapeHtml(viewerUrl)}" title="Animation Viewer"></iframe>`
    : `<div class="canvas-empty">Viewer is offline. Start viewer service with <code>tools/start-animation-viewer.ps1</code>.</div>`;

  const catalogRows = catalogTopCategories.length > 0
    ? catalogTopCategories
      .map((entry) => `<tr><td>${escapeHtml(entry.name)}</td><td>${escapeHtml(String(entry.count))}</td></tr>`)
      .join("")
    : "<tr><td colspan=\"2\">No catalog categories found.</td></tr>";

  const catalogSampleList = catalogSamples.length > 0
    ? `<ul class="canvas-list">${catalogSamples.map((path) => `<li>${escapeHtml(path)}</li>`).join("")}</ul>`
    : "<div class=\"canvas-empty\">No catalog samples available.</div>";
  const actionComposerStatusCard = renderUnavailableWorkflowCard(
    "Drag-Drop Action Composer",
    [
      "The drag-drop timeline, Blender gap-fill compose job, and review decision flow are not wired end-to-end in this shell build.",
      "Use this page for runtime animation readiness only. Do not treat export success as proof that composer requirements are implemented.",
      "Preview remains limited to catalog and viewer checks until the dedicated composer workflow is shipped.",
    ],
    ["AC1", "AC2", "AC3", "AC4", "AC5", "AC6"],
    "data/runtime/build-plan-rows.json",
  );

  el.workingCanvas.classList.add("canvas-rich");
  el.workingCanvas.innerHTML = `
    <div class="canvas-rich-grid">
      ${actionComposerStatusCard}
      <section class="canvas-card">
        <div class="canvas-card-head">
          <h3>Animation Clip Catalog</h3>
          <span>${animationAssets.length} clips</span>
        </div>
        <table class="canvas-table">
          <thead>
            <tr><th>Clip</th><th>Slot</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${clipRows}
          </tbody>
        </table>
      </section>
      <section class="canvas-card">
        <div class="canvas-card-head">
          <h3>Embedded Animation Viewer</h3>
          ${viewerStatus}
        </div>
        ${viewerFrame}
      </section>
      <section class="canvas-card canvas-card-wide">
        <div class="canvas-card-head">
          <h3>Export Readiness</h3>
          <span>${escapeHtml(activePage.canvas)}</span>
        </div>
        <ul class="canvas-list">
          ${exportSummary.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}
        </ul>
      </section>
      <section class="canvas-card">
        <div class="canvas-card-head">
          <h3>Central Animation Catalog</h3>
          <span>${catalogExists ? `${catalogTotal} files` : "missing"}</span>
        </div>
        <table class="canvas-table">
          <thead>
            <tr><th>Category</th><th>Count</th></tr>
          </thead>
          <tbody>
            ${catalogRows}
          </tbody>
        </table>
      </section>
      <section class="canvas-card canvas-card-wide">
        <div class="canvas-card-head">
          <h3>Catalog Samples</h3>
          <span>${catalogSamples.length} shown</span>
        </div>
        ${catalogSampleList}
      </section>
    </div>
  `;
}

function getWardrobeVoiceProfile(presetId) {
  const profiles = runtime.voiceSettings?.avatarVoiceProfiles || {};
  const globalVoice = runtime.voiceSettings?.openAiVoice || "nova";
  const globalInstructions = runtime.voiceSettings?.openAiInstructions || "";
  return {
    openAiVoice: profiles[presetId]?.openAiVoice || globalVoice,
    openAiInstructions: profiles[presetId]?.openAiInstructions || globalInstructions,
  };
}

function renderWardrobeManagerCanvas() {
  const wp = runtime.wardrobePresets;
  const presets = Array.isArray(wp?.presets) ? wp.presets : [];
  const activePresetId = wp?.activePresetId || "";
  const selectedPresetId = runtime._selectedWardrobePresetId || activePresetId;
  const activePreset = presets.find((preset) => preset.id === activePresetId) || null;
  const slotLabels = ["base", "hair", "upper", "lower", "footwear", "accessories"];
  const voiceOptions = ["alloy", "ash", "ballad", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer", "verse"];
  const presetCards = presets.length > 0
    ? presets.map((preset) => {
      const slotSummary = slotLabels
        .map((slot) => `${slot}: ${preset.slots?.[slot] || "—"}`)
        .join("<br />");
      const voiceProfile = getWardrobeVoiceProfile(preset.id);
      const selected = preset.id === selectedPresetId;
      const active = preset.id === activePresetId;
      return `
        <section class="canvas-card ${selected ? "canvas-card-wide" : ""}">
          <div class="canvas-card-head">
            <h3>${escapeHtml(preset.name || preset.id)}</h3>
            <span>${active ? "active" : escapeHtml(preset.persona || "unknown persona")}</span>
          </div>
          <div class="panel-desc">${escapeHtml(preset.id)} | persona ${escapeHtml(preset.persona || "unknown")}</div>
          <div class="panel-desc">${slotSummary}</div>
          <label class="panel-field">
            <span>OpenAI Voice</span>
            <select id="wardrobe-voice-${escapeHtml(preset.id)}">
              ${voiceOptions.map((voice) => `<option value="${escapeHtml(voice)}"${voice === voiceProfile.openAiVoice ? " selected" : ""}>${escapeHtml(voice)}</option>`).join("")}
            </select>
          </label>
          <label class="panel-field">
            <span>Voice Instructions</span>
            <textarea id="wardrobe-instructions-${escapeHtml(preset.id)}" rows="5">${escapeHtml(voiceProfile.openAiInstructions || "")}</textarea>
          </label>
          <div class="canvas-actions">
            <button type="button" class="secondary" data-canvas-action-id="wardrobe_select_preset" data-preset-id="${escapeHtml(preset.id)}" data-action-label="Activate Selected Preset">${active ? "Active Preset" : "Activate Preset"}</button>
            <button type="button" data-canvas-action-id="wardrobe_voice_save" data-preset-id="${escapeHtml(preset.id)}" data-action-label="Save Preset Voice">Save Voice</button>
          </div>
        </section>
      `;
    }).join("")
    : `<section class="canvas-card canvas-card-wide"><div class="canvas-empty">No wardrobe presets found. Refresh wardrobe data or create a preset first.</div></section>`;

  el.workingCanvas.classList.add("canvas-rich");
  el.workingCanvas.innerHTML = `
    <div class="canvas-rich-grid">
      <section class="canvas-card canvas-card-wide">
        <div class="canvas-card-head">
          <h3>Wardrobe Voice Profiles</h3>
          <span>${escapeHtml(activePresetId || "no active preset")}</span>
        </div>
        <ul class="canvas-list">
          <li>Preset count: ${escapeHtml(String(presets.length))}</li>
          <li>Active preset: ${escapeHtml(activePreset?.name || activePresetId || "none")}</li>
          <li>Selected preset: ${escapeHtml(selectedPresetId || "none")}</li>
          <li>Global fallback voice: ${escapeHtml(runtime.voiceSettings?.openAiVoice || "nova")}</li>
        </ul>
      </section>
      ${presetCards}
    </div>
  `;
}

function renderGestureExpressionCanvas() {
  const clientUrl = "http://127.0.0.1:4180/client/work-lite/";
  const keys = Array.isArray(runtime.bodyMorphCatalog) ? runtime.bodyMorphCatalog : [];
  const overrides = normalizeBodyMorphOverrides(runtime.bodyMorphOverrides);
  const motionOnly = getSettingValue("morphs.motion_only") || (runtime.bodyMorphMotionOnly ? "true" : "false");
  const morphRows = keys.length > 0
    ? keys.map((key) => {
      const value = clampMorphValue(overrides[key] ?? 0);
      return `
        <label class="panel-field" for="body-morph-${escapeHtml(key)}">
          <span>${escapeHtml(key)}</span>
          <input
            id="body-morph-${escapeHtml(key)}"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value="${value.toFixed(2)}"
            data-body-morph-key="${escapeHtml(key)}"
          />
          <small data-body-morph-value="${escapeHtml(key)}">${value.toFixed(2)}</small>
        </label>
      `;
    }).join("")
    : `<div class="canvas-empty">No body morph keys discovered yet. Click Scan Body Morphs From Client after the client scene is ready.</div>`;

  el.workingCanvas.classList.add("canvas-rich");
  el.workingCanvas.innerHTML = `
    <div class="canvas-rich-grid">
      <section class="canvas-card canvas-card-wide">
        <div class="canvas-card-head">
          <h3>Live Body Morph Runtime</h3>
          <span>${escapeHtml(keys.length.toString())} morphs</span>
        </div>
        <ul class="canvas-list">
          <li>Motion-only mode: ${escapeHtml(motionOnly === "true" ? "enabled" : "disabled")}</li>
          <li>Active overrides: ${escapeHtml(Object.keys(overrides).filter((key) => clampMorphValue(overrides[key]) > 0).length.toString())}</li>
          <li>Client route: <a class="canvas-link" href="${escapeHtml(clientUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(clientUrl)}</a></li>
        </ul>
        <div class="canvas-actions">
          <button type="button" data-canvas-action-id="gesture_scan_body_morphs" data-action-label="Scan Body Morphs From Client">Scan Body Morphs</button>
          <button type="button" data-canvas-action-id="gesture_apply_body_morphs" data-action-label="Apply Body Morphs">Apply Body Morphs</button>
          <button type="button" class="secondary" data-canvas-action-id="gesture_clear_body_morphs" data-action-label="Clear Body Morphs">Clear Body Morphs</button>
        </div>
      </section>
      <section class="canvas-card canvas-card-wide">
        <div class="canvas-card-head">
          <h3>Body Morph Sliders</h3>
          <span>All discovered keys</span>
        </div>
        <div class="settings-section-grid">
          ${morphRows}
        </div>
      </section>
      <section class="canvas-card canvas-card-wide">
        <div class="canvas-card-head">
          <h3>Live Client</h3>
          <span>Work-lite iframe</span>
        </div>
        <iframe id="gesture-client-iframe" class="canvas-iframe canvas-iframe-tall" src="${escapeHtml(clientUrl)}" title="Work Lite Client"></iframe>
      </section>
    </div>
  `;
}

function renderClientStageCanvas(pageId) {
  const clientUrl = "http://127.0.0.1:4180/client/work-lite/";
  const displayUrl = "http://127.0.0.1:4180/display/";
  const mode = runtime.clientRuntimeSettings?.displayInputMode ?? "wake_word";
  const device = runtime.deviceDisplayProfiles?.selectedDeviceId ?? "laptop";
  const title = pageId === "live-preview" ? "Staging Window" : "Display Runtime Setup";
  const stagingStatusCard = pageId === "live-preview"
    ? renderUnavailableWorkflowCard(
      "Manual Staging Calibration",
      [
        "The manual staging calibrator, profile lock workflow, and saved transform tuning are not implemented end-to-end in the current client shell.",
        "This page only exposes runtime preview links and current device/mode context. It does not provide drag-drop staging, transform capture, or locked-profile persistence.",
        "Operators should treat any staging adjustments outside the documented calibrator flow as unsupported until the tracked staging work lands.",
      ],
      ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"],
      "data/runtime/build-plan-rows.json",
    )
    : "";

  el.workingCanvas.classList.add("canvas-rich");
  el.workingCanvas.innerHTML = `
    <div class="canvas-rich-grid">
      ${stagingStatusCard}
      <section class="canvas-card canvas-card-wide">
        <div class="canvas-card-head">
          <h3>${escapeHtml(title)}</h3>
          <span>Device ${escapeHtml(device)} | Mode ${escapeHtml(mode)}</span>
        </div>
        <iframe class="canvas-iframe canvas-iframe-tall" src="${escapeHtml(clientUrl)}" title="Work Lite Client"></iframe>
      </section>
      <section class="canvas-card">
        <div class="canvas-card-head">
          <h3>Quick Launch</h3>
          <span>Live links</span>
        </div>
        <div class="canvas-actions">
          <a class="canvas-link" href="${escapeHtml(clientUrl)}" target="_blank" rel="noopener noreferrer">Open Work Lite</a>
          <a class="canvas-link" href="${escapeHtml(displayUrl)}" target="_blank" rel="noopener noreferrer">Open Display Mode</a>
          <a class="canvas-link" href="http://127.0.0.1:4180/panel/operator-studio-shell.html" target="_blank" rel="noopener noreferrer">Open Operator Shell</a>
        </div>
      </section>
    </div>
  `;
}

function formatExportsByType(exportsByType) {
  if (!exportsByType || typeof exportsByType !== "object") {
    return "none";
  }
  const pairs = Object.entries(exportsByType);
  if (pairs.length === 0) {
    return "none";
  }
  return pairs.map(([key, count]) => `${key}:${count}`).join(", ");
}

function markPageHealth(pageId, update) {
  const current = ui.pageHealth[pageId] ?? { status: "unknown", message: "Data: not synced" };
  ui.pageHealth[pageId] = { ...current, ...update };
}

function renderPageHealth() {
  if (!el.pageDataHealth) {
    return;
  }
  const health = ui.pageHealth[activePage.id] ?? { status: "unknown", message: "Data: not synced" };
  const timeStamp = health.lastSyncAt
    ? ` (${new Date(health.lastSyncAt).toLocaleTimeString([], { hour12: false })})`
    : "";
  el.pageDataHealth.classList.remove("is-online", "is-degraded", "is-offline");
  el.pageDataHealth.removeAttribute("title");
  if (health.status === "online") {
    el.pageDataHealth.classList.add("is-online");
  } else if (health.status === "degraded") {
    el.pageDataHealth.classList.add("is-degraded");
    if (health.lastError) {
      el.pageDataHealth.title = health.lastError;
    }
  } else {
    el.pageDataHealth.classList.add("is-offline");
  }
  el.pageDataHealth.textContent = `${health.message}${timeStamp}`;
}

function loadAuditTrail() {
  const parsed = safeParseJson(window.localStorage.getItem(STORAGE_KEYS.auditTrail) || "[]");
  return Array.isArray(parsed) ? parsed.slice(0, 180) : [];
}

function persistAuditTrail() {
  window.localStorage.setItem(STORAGE_KEYS.auditTrail, JSON.stringify(ui.auditTrail));
}

function appendAudit(kind, message, level = "info") {
  const entry = {
    at: new Date().toISOString(),
    pageId: activePage.id,
    pageTitle: activePage.title,
    kind,
    level,
    message,
  };
  ui.auditTrail.unshift(entry);
  ui.auditTrail = ui.auditTrail.slice(0, 180);
  persistAuditTrail();
  renderAuditTrail();
}

function clearAuditTrail() {
  ui.auditTrail = [];
  persistAuditTrail();
  renderAuditTrail();
  notifyInfo("Audit trail cleared.");
}

function renderAuditTrail() {
  if (!el.auditList) {
    return;
  }
  if (!ui.auditTrail.length) {
    el.auditList.innerHTML = "<p class=\"panel-desc\">No audit entries yet.</p>";
    return;
  }
  el.auditList.innerHTML = ui.auditTrail.slice(0, 40).map((entry) => {
    const time = new Date(entry.at).toLocaleTimeString([], { hour12: false });
    const level = String(entry.level || "info").toUpperCase();
    return `<article class="audit-item"><strong>${escapeHtml(level)} | ${escapeHtml(entry.kind)}</strong><small>${escapeHtml(time)} | ${escapeHtml(entry.pageTitle)}</small><div>${escapeHtml(entry.message)}</div></article>`;
  }).join("");
}

function settingDomId(key) {
  return `setting-${key}`;
}

function createSettingField(item) {
  const field = document.createElement("div");
  field.className = "field";
  field.classList.add(`field--${item.type}`);
  if (item.type === "textarea") {
    field.classList.add("field--wide");
  }
  const label = document.createElement("label");
  label.textContent = item.label;
  label.htmlFor = settingDomId(item.key);
  field.appendChild(label);
  let control;
  if (item.type === "select") {
    control = document.createElement("select");
    control.id = settingDomId(item.key);
    for (const value of item.options) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      option.selected = value === item.value;
      control.appendChild(option);
    }
  } else if (item.type === "textarea") {
    control = document.createElement("textarea");
    control.id = settingDomId(item.key);
    control.value = item.value;
    control.rows = Math.max(4, Math.min(8, Math.ceil(String(item.value || "").length / 96)));
  } else {
    control = document.createElement("input");
    control.id = settingDomId(item.key);
    control.type = item.type === "number" ? "number" : item.type === "password" ? "password" : "text";
    control.value = item.value;
  }
  field.appendChild(control);
  const help = document.createElement("small");
  help.textContent = item.help;
  field.appendChild(help);
  return field;
}

function getProvidersVoiceSectionId(settingKey) {
  if (["openai.api_key", "localllm.base_url", "localllm.model", "localllm.timeout_ms", "localllm.keep_alive"].includes(settingKey)) {
    return "providers";
  }
  if (["localllm.default_private_persona", "localllm.active_private_persona"].includes(settingKey)) {
    return "personas";
  }
  if (settingKey.startsWith("localllm.") || settingKey.startsWith("backstory.")) {
    return "prompts";
  }
  if (["voice.mode", "voice.timeout_ms", "voice.wake_word", "voice.auto_resume"].includes(settingKey)) {
    return "voiceBasics";
  }
  if ([
    "voice.speech_cooldown_ms",
    "voice.thinking_filler_delay_ms",
    "voice.follow_up_timeout_ms",
    "voice.wake_follow_up_timeout_ms",
    "voice.default_submit_timeout_ms",
    "voice.follow_up_submit_timeout_ms",
    "voice.wake_submit_timeout_ms",
    "voice.wake_aliases",
    "voice.wake_prefixes",
  ].includes(settingKey)) {
    return "wakeTiming";
  }
  if (["voice.ambient_confidence", "voice.ambient_repeat_ms", "voice.ambient_allowlist"].includes(settingKey)) {
    return "ambient";
  }
  return "phrases";
}

function renderProvidersVoiceSettings(settings) {
  const groupedSettings = new Map(PROVIDERS_VOICE_SETTING_SECTIONS.map((section) => [section.id, []]));
  for (const item of settings) {
    const sectionId = getProvidersVoiceSectionId(item.key);
    if (!groupedSettings.has(sectionId)) {
      groupedSettings.set(sectionId, []);
    }
    groupedSettings.get(sectionId).push(item);
  }

  for (const section of PROVIDERS_VOICE_SETTING_SECTIONS) {
    const items = groupedSettings.get(section.id) ?? [];
    if (items.length === 0) {
      continue;
    }
    const sectionWrap = document.createElement("section");
    sectionWrap.className = "settings-section";
    sectionWrap.dataset.sectionId = section.id;

    const header = document.createElement("header");
    header.className = "settings-section-head";

    const title = document.createElement("h3");
    title.className = "settings-section-title";
    title.textContent = section.title;
    header.appendChild(title);

    const description = document.createElement("p");
    description.className = "settings-section-description";
    description.textContent = section.description;
    header.appendChild(description);
    sectionWrap.appendChild(header);

    const grid = document.createElement("div");
    grid.className = "settings-section-grid";
    for (const item of items) {
      grid.appendChild(createSettingField(item));
    }
    sectionWrap.appendChild(grid);
    el.settingsForm.appendChild(sectionWrap);
  }
}

function renderSettingsForm(page, settings) {
  el.settingsForm.innerHTML = "";
  const isSectionedPage = page.id === "providers-voice";
  el.settingsForm.classList.toggle("settings-form--sectioned", isSectionedPage);
  if (isSectionedPage) {
    renderProvidersVoiceSettings(settings);
    return;
  }
  for (const item of settings) {
    el.settingsForm.appendChild(createSettingField(item));
  }
}

function getSettingValue(key) {
  const element = document.getElementById(settingDomId(key));
  if (isValueElement(element)) {
    return element.value.trim();
  }
  return "";
}

function setSettingValue(key, value) {
  const element = document.getElementById(settingDomId(key));
  if (isValueElement(element)) {
    element.value = value;
    onSettingsInput();
  }
}

function onSettingsInput() {
  if (activePage.id === "avatar-library") {
    renderAvatarMiniPreview();
  }
}

function renderAvatarMiniPreview() {
  const show = activePage.id === "avatar-library";
  if (!show) {
    el.avatarMiniWrap.classList.add("is-hidden");
    return;
  }
  const manifest = runtime.clientAssetManifest;
  const profile = getSettingValue("avatar.default_profile") || "GAIL_BASE_V2";
  const lod = getSettingValue("avatar.lod") || "medium";
  const material = getSettingValue("avatar.material_profile") || "balanced";
  el.avatarMiniWrap.classList.remove("is-hidden");
  el.avatarMiniName.textContent = `Avatar: ${profile}`;
  const ready = manifest?.avatarReady ? "ready" : "not-ready";
  const missing = Array.isArray(manifest?.missingAssets) ? manifest.missingAssets.length : 0;
  el.avatarMiniMeta.textContent = `LOD=${lod} | Material=${material} | Runtime=${ready} | Missing=${missing}`;
}

function hydrateSettings(page) {
  if (["avatar-library", "wardrobe-manager", "animation-library", "runtime-mapping"].includes(page.id) && runtime.clientRuntimeSettings) {
    const availableSystems = Array.isArray(runtime.clientRuntimeSettings.availableAvatarSystems)
      ? runtime.clientRuntimeSettings.availableAvatarSystems.map((item) => item.key).filter(Boolean)
      : [];
    return page.settings.map((setting) => {
      if (setting.key === "runtime.active_system") {
        const options = availableSystems.length > 0 ? availableSystems : setting.options;
        const value = runtime.clientRuntimeSettings.activeAvatarSystem ?? setting.value;
        return { ...setting, options, value };
      }
      if (setting.key === "avatar.active_persona") {
        const active = runtime.localLlmConfig?.activePrivatePersona;
        const value = active === "private_counselor" || active === "private_girlfriend" ? active : "normal";
        return { ...setting, value };
      }
      return setting;
    });
  }
  if (page.id === "workflow-studio") {
    return page.settings.map((setting) => {
      if (setting.key === "workflow.provider") {
        const workflow = getSelectedWorkflow();
        if (workflow?.providerPreference) {
          return { ...setting, value: workflow.providerPreference };
        }
      }
      return setting;
    });
  }
  if (page.id === "build-control-tower") {
    return page.settings.map((setting) => {
      if (setting.key === "build.script_id") {
        const scriptIds = Array.isArray(runtime.buildScripts) ? runtime.buildScripts.map((entry) => entry.id) : [];
        const options = scriptIds.length > 0 ? scriptIds : setting.options;
        const currentValue = options.includes(setting.value)
          ? setting.value
          : (options[0] || setting.value);
        return { ...setting, options, value: currentValue };
      }
      return setting;
    });
  }
  if (page.id === "providers-voice") {
    return [...page.settings, ...PROVIDERS_VOICE_RUNTIME_SETTINGS].map((setting) => {
      if (setting.key === "localllm.base_url") {
        return { ...setting, value: runtime.localLlmConfig?.baseUrl ?? setting.value };
      }
      if (setting.key === "localllm.model") {
        return { ...setting, value: runtime.localLlmConfig?.model ?? setting.value };
      }
      if (setting.key === "localllm.timeout_ms") {
        return { ...setting, value: String(runtime.localLlmConfig?.timeoutMs ?? setting.value) };
      }
      if (setting.key === "localllm.keep_alive") {
        return { ...setting, value: runtime.localLlmConfig?.keepAlive ?? setting.value };
      }
      if (setting.key === "localllm.default_private_persona") {
        return { ...setting, value: runtime.localLlmConfig?.defaultPrivatePersona ?? setting.value };
      }
      if (setting.key === "localllm.active_private_persona") {
        return { ...setting, value: runtime.localLlmConfig?.activePrivatePersona ?? setting.value };
      }
      if (setting.key === "localllm.normal_prompt") {
        return { ...setting, value: runtime.localLlmConfig?.normalSystemPrompt ?? runtime.localLlmConfig?.personas?.find((item) => item.key === "normal")?.systemPrompt ?? setting.value };
      }
      if (setting.key === "localllm.counselor_prompt") {
        return { ...setting, value: runtime.localLlmConfig?.personas?.find((item) => item.key === "private_counselor")?.systemPrompt ?? setting.value };
      }
      if (setting.key === "localllm.girlfriend_prompt") {
        return { ...setting, value: runtime.localLlmConfig?.personas?.find((item) => item.key === "private_girlfriend")?.systemPrompt ?? setting.value };
      }
      if (setting.key === "backstory.normal_canon") {
        return { ...setting, value: runtime.backstoryProfile?.personas?.normal?.canon ?? setting.value };
      }
      if (setting.key === "backstory.counselor_canon") {
        return { ...setting, value: runtime.backstoryProfile?.personas?.private_counselor?.canon ?? setting.value };
      }
      if (setting.key === "backstory.girlfriend_canon") {
        return { ...setting, value: runtime.backstoryProfile?.personas?.private_girlfriend?.canon ?? setting.value };
      }
      if (setting.key === "voice.mode") {
        return { ...setting, value: runtime.voiceSettings?.mode ?? setting.value };
      }
      if (setting.key === "voice.timeout_ms") {
        return { ...setting, value: String(runtime.voiceSettings?.silenceTimeoutMs ?? setting.value) };
      }
      const voiceRuntimeSetting = hydrateVoiceRuntimeSetting(setting);
      if (voiceRuntimeSetting) {
        return voiceRuntimeSetting;
      }
      return setting;
    });
  }
  if (page.id === "devices-auth" && runtime.authStatus) {
    const selectedDeviceId = runtime.deviceDisplayProfiles?.selectedDeviceId;
    const deviceOptions = Array.isArray(runtime.deviceDisplayProfiles?.profiles)
      ? runtime.deviceDisplayProfiles.profiles.map((entry) => entry.id)
      : [];
    return page.settings.map((setting) => {
      if (setting.key === "display.selected_device_id") {
        const options = deviceOptions.length > 0 ? deviceOptions : setting.options;
        const value = selectedDeviceId && options.includes(selectedDeviceId)
          ? selectedDeviceId
          : (options[0] || setting.value);
        return { ...setting, options, value };
      }
      if (setting.key === "display.input_mode") {
        const value = runtime.clientRuntimeSettings?.displayInputMode ?? setting.value;
        return { ...setting, value };
      }
      return setting;
    });
  }
  if (page.id === "gesture-expression") {
    return page.settings.map((setting) => {
      if (setting.key === "gesture.profile") {
        return { ...setting, value: runtime.gestureProfile || setting.value };
      }
      if (setting.key === "morphs.motion_only") {
        const enabled = runtime.clientRuntimeSettings?.bodyMorphControls?.enabledDuringMotion;
        return { ...setting, value: enabled === false ? "false" : "true" };
      }
      return setting;
    });
  }
  return page.settings;
}

function joinVoiceList(value, fallback = "") {
  return Array.isArray(value) ? value.join("\n") : fallback;
}

function hydrateVoiceRuntimeSetting(setting) {
  const voice = runtime.voiceSettings;
  const voiceRuntime = voice?.runtime;
  const timing = voiceRuntime?.timing || {};
  const phrases = voiceRuntime?.phrases || {};
  const thinking = phrases.thinkingFillers || {};
  const contexts = phrases.contextFillers || {};
  const valueMap = {
    "voice.wake_word": voice?.wakeWord,
    "voice.auto_resume": voice?.autoResumeAfterResponse === false ? "false" : "true",
    "voice.speech_cooldown_ms": timing.speechCooldownMs,
    "voice.thinking_filler_delay_ms": timing.thinkingFillerDelayMs,
    "voice.follow_up_timeout_ms": timing.followUpTimeoutMs,
    "voice.wake_follow_up_timeout_ms": timing.wakeWordFollowUpTimeoutMs,
    "voice.default_submit_timeout_ms": timing.defaultSubmitTimeoutMs,
    "voice.follow_up_submit_timeout_ms": timing.followUpSubmitTimeoutMs,
    "voice.wake_submit_timeout_ms": timing.wakeWordSubmitTimeoutMs,
    "voice.ambient_confidence": timing.ambientLowConfidenceThreshold,
    "voice.ambient_repeat_ms": timing.ambientRepeatWindowMs,
    "voice.wake_aliases": joinVoiceList(phrases.wakeWordAliases, setting.value),
    "voice.wake_prefixes": joinVoiceList(phrases.wakePrefixes, setting.value),
    "voice.wake_acks": joinVoiceList(phrases.wakeAcknowledgements, setting.value),
    "voice.filler_question": joinVoiceList(thinking.question, setting.value),
    "voice.filler_command": joinVoiceList(thinking.command, setting.value),
    "voice.filler_statement": joinVoiceList(thinking.statement, setting.value),
    "voice.context_follow_up": joinVoiceList(contexts.followUp, setting.value),
    "voice.context_vision": joinVoiceList(contexts.vision, setting.value),
    "voice.context_persona": joinVoiceList(contexts.persona, setting.value),
    "voice.context_dance": joinVoiceList(contexts.dance, setting.value),
    "voice.context_system": joinVoiceList(contexts.system, setting.value),
    "voice.closers": joinVoiceList(phrases.conversationClosers, setting.value),
    "voice.boot_greetings": joinVoiceList(phrases.bootGreetings, setting.value),
    "voice.ambient_allowlist": joinVoiceList(phrases.ambientSingleWordAllowlist, setting.value),
  };
  if (!(setting.key in valueMap)) {
    return undefined;
  }
  const value = valueMap[setting.key];
  return { ...setting, value: value === undefined || value === null ? setting.value : String(value) };
}

function buildDynamicDisplays(pageId) {
  const manifest = runtime.clientAssetManifest;
  const runtimeSettings = runtime.clientRuntimeSettings;
  const assets = Array.isArray(manifest?.assets) ? manifest.assets : [];
  const animationAssets = assets.filter((asset) => asset.kind === "animation");
  const missingAssets = Array.isArray(manifest?.missingAssets) ? manifest.missingAssets : [];
  const missingRequired = assets.filter((asset) => asset.required !== false && !asset.present);
  const previewClips = animationAssets.slice(0, 6).map((asset) => asset.slot || asset.name).join(", ");
  switch (pageId) {
    case "build-control-tower":
      return [
        `Master checker status: ${runtime.buildOverview?.masterChecker?.status ?? "unknown"}`,
        `Approval queue: ${runtime.buildOverview?.masterChecker?.pendingApprovals ?? 0}`,
        `Blocked steps: ${runtime.buildOverview?.masterChecker?.blockedSteps ?? 0}`,
        `Progress: ${runtime.buildOverview?.progress?.percentComplete ?? 0}% (${runtime.buildOverview?.progress?.completedSteps ?? 0}/${runtime.buildOverview?.progress?.stepCount ?? 0})`,
        `Agent lanes: ${Array.isArray(runtime.buildAgents) ? runtime.buildAgents.length : 0}`,
        `Scripts tracked: ${Array.isArray(runtime.buildScripts) ? runtime.buildScripts.length : 0}`,
      ];
    case "avatar-library": {
      const activePersona = runtime.localLlmConfig?.activePrivatePersona ?? "unknown";
      return [
        `Active avatar system: ${runtimeSettings?.activeAvatarSystem ?? "unknown"}`,
        `Active asset root: ${runtimeSettings?.activeAssetRoot ?? "catalog default"}`,
        `Avatar ready: ${String(manifest?.avatarReady ?? false)} (${manifest?.manifestSource ?? "unknown"})`,
        `Core assets: ${Array.isArray(manifest?.coreAssetIds) ? manifest.coreAssetIds.length : 0}`,
        `Missing assets: ${missingAssets.length}`,
        `Active persona: ${activePersona}`,
      ];
    }
    case "wardrobe-manager": {
      const wp = runtime.wardrobePresets;
      const presets = Array.isArray(wp?.presets) ? wp.presets : [];
      const activeId = wp?.activePresetId ?? "none";
      const activePreset = presets.find((p) => p.id === activeId);
      const slotLabels = ["base", "hair", "upper", "lower", "footwear", "accessories"];
      const activeSlots = activePreset
        ? slotLabels.map((s) => `${s}: ${activePreset.slots?.[s] ?? "—"}`).join(", ")
        : "no active preset";

      const wardrobeAssets = assets.filter((asset) => ["clothing", "hair", "accessory", "texture"].includes(asset.kind));
      return [
        `Presets: ${presets.length} (active: ${activeId})`,
        `Active preset persona: ${activePreset?.persona ?? "unknown"}`,
        `Active slots: ${activeSlots}`,
        `Wardrobe assets in manifest: ${wardrobeAssets.length}`,
        `Missing required: ${missingRequired.length}`,
        `Selected system: ${runtimeSettings?.activeAvatarSystem ?? "unknown"}`,
        ...presets.map((p) => `  [${p.id === activeId ? "●" : "○"}] ${p.name} (${p.persona}) — ${Object.values(p.slots || {}).filter(Boolean).length} slots`),
      ];
    }
    case "animation-library":
      const checklist = getAnimationChecklistSummary();
      const catalogTotal = Number(runtime.animationCatalog?.totalFiles || 0);
      const categorySummary = Array.isArray(runtime.animationCatalog?.categories)
        ? runtime.animationCatalog.categories.slice(0, 3).map((entry) => `${entry.name}:${entry.count}`).join(", ")
        : "";
      return [
        `Animation clips detected: ${animationAssets.length}`,
        `Animation library files (catalog): ${catalogTotal}`,
        categorySummary ? `Top catalog categories: ${categorySummary}` : "Top catalog categories: none",
        `Clip slots: ${previewClips || "none detected"}`,
        `Missing required clips: ${missingRequired.filter((asset) => asset.kind === "animation").length}`,
        `Master checklist: ${checklist.done}/${checklist.total} done`,
        `Runtime profile: ${getSettingValue("anim.runtime_profile") || "high"}`,
        `Export runner: ${getSettingValue("anim.export_runner_path") || "tools/export-avatar-assets.ps1"}`,
        `Pipeline runner: ${getSettingValue("anim.pipeline_runner_path") || "tools/export-playcanvas-pipeline.ps1"}`,
        `Pipeline doc: ${getSettingValue("anim.pipeline_doc") || "docs/PLAYCANVAS_AVATAR_PIPELINE.md"}`,
      ];
    case "state-machine": {
      const requiredStates = ["idle", "listen", "ack"];
      const availableStates = new Set(animationAssets.map((asset) => String(asset.slot || "").toLowerCase()));
      const uncoveredStates = requiredStates.filter((slot) => !Array.from(availableStates).some((value) => value.includes(slot)));
      return [
        `Default state target: ${getSettingValue("sm.default_state") || "idle"}`,
        `Detected animation slots: ${animationAssets.length}`,
        `Required state coverage gaps: ${uncoveredStates.length > 0 ? uncoveredStates.join(", ") : "none"}`,
        `Manifest source: ${manifest?.manifestSource ?? "unknown"}`,
      ];
    }
    case "asset-binding":
      return [
        `Asset entries: ${assets.length}`,
        `Missing required assets: ${missingRequired.length}`,
        `Validation mode: ${getSettingValue("binding.strict_mode") || "strict"}`,
        missingRequired.length > 0
          ? `First missing required: ${missingRequired.slice(0, 3).map((asset) => asset.name).join(", ")}`
          : "All required assets present.",
      ];
    case "live-preview":
      return [
        `Camera matrix loaded: ${runtime.cameraMatrix ? "yes" : "no"}`,
        `Preview rig: ${getSettingValue("preview.camera") || "orbit"}`,
        `Avatar runtime ready: ${String(manifest?.avatarReady ?? false)}`,
        `Animation clips available: ${animationAssets.length}`,
      ];
    case "runtime-mapping":
      return [
        `Active system: ${runtimeSettings?.activeAvatarSystem ?? "unknown"}`,
        `Asset root: ${runtimeSettings?.activeAssetRoot ?? "catalog default"}`,
        `Available systems: ${Array.isArray(runtimeSettings?.availableAvatarSystems) ? runtimeSettings.availableAvatarSystems.length : 0}`,
        `Manifest source: ${manifest?.manifestSource ?? "unknown"}`,
        `Pipeline runner: ${getSettingValue("runtime.pipeline_runner_path") || "tools/export-playcanvas-pipeline.ps1"}`,
        `Runtime profile: ${getSettingValue("runtime.profile") || "high"}`,
        `Pipeline doc: ${getSettingValue("runtime.pipeline_doc") || "docs/PLAYCANVAS_AVATAR_PIPELINE.md"}`,
        `Ready for client export: ${String(manifest?.avatarReady ?? false)}`,
      ];
    case "action-graph":
      return [
        `Commands available: ${Array.isArray(runtime.commands) ? runtime.commands.length : 0}`,
        `Custom mappings: ${Array.isArray(runtime.commandMappings) ? runtime.commandMappings.length : 0}`,
        `Priority mode: ${getSettingValue("action.priority_mode") || "strict"}`,
        runtime.commandExecution
          ? `Last execute: ${runtime.commandExecution.actionType ?? "unknown"} confidence=${runtime.commandExecution.confidence ?? "n/a"}`
          : "No command execution yet.",
      ];
    case "gesture-expression":
      return [
        `Expression profile: ${runtime.gestureProfile}`,
        `Voice mode: ${runtime.voiceSettings?.mode ?? "unknown"}`,
        `Voice context: ${runtime.voiceStatus?.modeContext ?? "unknown"}`,
        `Silence timeout: ${runtime.voiceSettings?.silenceTimeoutMs ?? "unknown"}ms`,
        `Body morph mode: ${runtime.clientRuntimeSettings?.bodyMorphControls?.enabledDuringMotion === false ? "always" : "motion-only"}`,
        `Discovered body morphs: ${Array.isArray(runtime.bodyMorphCatalog) ? runtime.bodyMorphCatalog.length : 0}`,
        `Breast/physics morphs: ${Array.isArray(runtime.bodyMorphBreastKeys) ? runtime.bodyMorphBreastKeys.length : 0}${Array.isArray(runtime.bodyMorphBreastKeys) && runtime.bodyMorphBreastKeys.length > 0 ? " — " + runtime.bodyMorphBreastKeys.join(", ") : " (none matched — check console for all key names)"}`,
        `Body morph overrides: ${Object.keys(normalizeBodyMorphOverrides(runtime.bodyMorphOverrides)).length}`,
      ];
    case "workflow-studio": {
      const workflow = getSelectedWorkflow();
      const readyStep = workflow?.steps?.find((step) => step.status === "ready");
      const reviewSteps = workflow?.steps?.filter((step) => step.status === "needs_review") ?? [];
      const reviewRequired = workflow?.steps?.filter((step) => step.requiresReview).length ?? 0;
      return [
        `Workflow count: ${runtime.workflows.length}`,
        workflow ? `Selected: ${workflow.title} (${workflow.id}) status=${workflow.status}` : "Selected: none",
        readyStep ? `Ready step: ${readyStep.title} (${readyStep.id})` : "Ready step: none",
        `Review queue: ${reviewSteps.length} pending | requires review in plan: ${reviewRequired}`,
        runtime.workflowExecution
          ? `Last run provider=${runtime.workflowExecution.usedProvider} fallback=${runtime.workflowExecution.fellBack}`
          : "No workflow run yet.",
      ];
    }
    case "devices-auth":
      return [
        `Auth mode: ${runtime.authStatus?.authMode ?? "unknown"}`,
        `Pairing required: ${String(runtime.authStatus?.pairingRequired ?? false)}`,
        `Devices loaded: ${runtime.devices.length}`,
        `Display target: ${runtime.deviceDisplayProfiles?.selectedDeviceId ?? "unknown"}`,
        `Display input mode: ${runtime.clientRuntimeSettings?.displayInputMode ?? "unknown"}`,
        runtime.pairingSession
          ? `Latest pairing: ${runtime.pairingSession.id} code=${runtime.pairingSession.pairingCode}`
          : "No pairing session yet.",
      ];
    case "providers-voice":
      return [
        `Providers loaded: ${Array.isArray(runtime.providers) ? runtime.providers.length : 0}`,
        `OpenAI configured: ${String(runtime.openAiConfig?.configured ?? false)}`,
        `Local model: ${runtime.localLlmConfig?.model ?? "unknown"}`,
        `Local base URL: ${runtime.localLlmConfig?.baseUrl ?? "unknown"}`,
        `Active private persona: ${runtime.localLlmConfig?.activePrivatePersona ?? "unknown"}`,
        `Backstory schema: ${runtime.backstoryProfile?.schema ?? "not loaded"}`,
        `Backstory personas loaded: ${Object.keys(runtime.backstoryProfile?.personas ?? {}).length}`,
        `Persona switch phrases: vera mode | cherry mode | doc im lonley`,
        `Voice mode: ${runtime.voiceSettings?.mode ?? "unknown"}`,
        `Mode context: ${runtime.voiceStatus?.modeContext ?? "unknown"}`,
      ];
    case "change-governance":
      return [
        `Pending changes: ${Array.isArray(runtime.governancePending) ? runtime.governancePending.length : 0}`,
        `Last approved: ${runtime.governanceApproved?.[0]?.changeId ?? "none"}`,
        `History events loaded: ${Array.isArray(runtime.governanceHistory) ? runtime.governanceHistory.length : 0}`,
        runtime.governanceRollback
          ? `Last rollback restored files: ${Array.isArray(runtime.governanceRollback.restoredFiles) ? runtime.governanceRollback.restoredFiles.length : 0}`
          : "Last rollback: none",
      ];
    case "feature-inbox": {
      const all = Array.isArray(runtime.featureBacklog) ? runtime.featureBacklog : [];
      const statusFilter = getSettingValue("feature.status") || "all";
      const visible = statusFilter === "all" ? all : all.filter((entry) => entry.status === statusFilter);
      const pending = visible.filter((entry) => entry.status === "pending").length;
      return [
        `Feature entries loaded: ${all.length}`,
        `Visible entries: ${visible.length}`,
        `Pending visible: ${pending}`,
        visible[0]
          ? `Top item: ${visible[0].id} stage=${visible[0].stageTarget} priority=${visible[0].priority}`
          : "Top item: none",
      ];
    }
    case "report-bugs": {
      const all = Array.isArray(runtime.bugReports) ? runtime.bugReports : [];
      const statusFilter = getSettingValue("bug.filter_status") || "all";
      const visible = statusFilter === "all" ? all : all.filter((entry) => entry.status === statusFilter);
      return [
        `Bug entries loaded: ${all.length}`,
        `Visible entries: ${visible.length}`,
        visible[0]
          ? `Top issue: ${visible[0].id} status=${visible[0].status} page=${visible[0].pageId}`
          : "Top issue: none",
      ];
    }
    case "organizer-control":
      return [
        `Dashboard counts: ${runtime.dashboard ? JSON.stringify(runtime.dashboard.counts) : "not loaded"}`,
        `Projects: ${runtime.projects.length}`,
        `Tasks: ${runtime.tasks.length}`,
        `Reminders: ${runtime.reminders.length}`,
        `Approvals: ${runtime.approvals.length}`,
      ];
    case "system-status": {
      const sys = runtime.systemStatus;
      const health = Array.isArray(sys?.health) ? sys.health : [];
      const healthLine = health.map((h) => `${h.component}:${h.status}`).join(", ");
      return [
        `Uptime: ${sys?.uptime ?? "unknown"}s`,
        `Health: ${healthLine || "not loaded"}`,
        `Active provider: ${sys?.providers?.active ?? "none"}`,
        `TTS ready: ${sys?.voice?.ttsReady ?? "unknown"} | STT ready: ${sys?.voice?.sttReady ?? "unknown"}`,
        `Build progress: ${sys?.build?.progress?.percentComplete ?? 0}% (${sys?.build?.progress?.completedSteps ?? 0}/${sys?.build?.progress?.stepCount ?? 0})`,
        `Recent errors: ${Array.isArray(runtime.systemErrors) ? runtime.systemErrors.length : 0}`,
        `Browsed entries: ${Array.isArray(runtime.systemFiles) ? runtime.systemFiles.length : 0}`,
      ];
    }
    case "manager-agent": {
      const rpt = runtime.managerReport;
      const dirs = Array.isArray(runtime.managerDirectives) ? runtime.managerDirectives : [];
      return [
        `Manager: ${rpt?.manager?.agentId ?? "unknown"} status=${rpt?.manager?.status ?? "unknown"}`,
        `Builder A: status=${rpt?.builders?.[0]?.status ?? "unknown"} completed=${rpt?.builders?.[0]?.completedCount ?? 0}`,
        `Builder B: status=${rpt?.builders?.[1]?.status ?? "unknown"} completed=${rpt?.builders?.[1]?.completedCount ?? 0}`,
        `Directives total: ${rpt?.directives?.total ?? 0} | pending: ${rpt?.directives?.pending ?? 0} | running: ${rpt?.directives?.running ?? 0} | completed: ${rpt?.directives?.completed ?? 0} | failed: ${rpt?.directives?.failed ?? 0}`,
        `Recent directives: ${dirs.slice(0, 5).map((d) => `${d.id.slice(-8)}:${d.status}`).join(", ") || "none"}`,
        runtime.managerAvatarReply ? `Last avatar reply: ${runtime.managerAvatarReply}` : "",
      ].filter(Boolean);
    }
    case "pass-review": {
      const grouped = getGroupedPageNotes(getSettingValue("review.status_filter") || "all");
      const notes = Object.values(grouped).flat();
      const openCount = notes.filter((note) => normalizeNoteStatus(note.status) === "open").length;
      const deferredCount = notes.filter((note) => normalizeNoteStatus(note.status) === "deferred").length;
      const doneCount = notes.filter((note) => ["done", "rolled-into-build"].includes(normalizeNoteStatus(note.status))).length;
      return [
        `Pages with notes: ${Object.keys(grouped).length}`,
        `Visible notes: ${notes.length}`,
        `Open: ${openCount}`,
        `Deferred: ${deferredCount}`,
        `Done or rolled in: ${doneCount}`,
      ];
    }
    default:
      return [];
  }
}

async function runAction(actionId, actionLabel) {
  const confirmation = SENSITIVE_ACTIONS.get(actionId);
  if (confirmation) {
    const accepted = window.confirm(confirmation);
    if (!accepted) {
      appendAudit("action_cancelled", `${actionLabel} cancelled by operator confirmation.`, "info");
      return;
    }
  }
  await withAction(actionId, actionLabel, async () => {
    switch (actionId) {
      case "mock_notice":
        notifyInfo("Module is scaffolded. Wiring is still pending.");
        break;
      case "avatar_refresh":
      case "wardrobe_refresh":
      case "asset_refresh":
      case "state_refresh":
        await fetchClientRuntimeData();
        await renderPage();
        notifySuccess("Runtime and asset manifest refreshed.");
        break;
      case "animation_refresh":
        await fetchAnimationExportData();
        await renderPage();
        notifySuccess("Animations and export status refreshed.");
        break;
      case "animation_seed_master_plan":
        seedAnimationChecklistFromPlans();
        await renderPage();
        notifySuccess("Master animation checklist seeded for step-by-step tracking.");
        break;
      case "runtime_refresh":
        await fetchAnimationExportData();
        await renderPage();
        notifySuccess("Runtime mapping and export status refreshed.");
        break;
      case "animation_refresh_report":
      case "runtime_refresh_report":
        await fetchExportStatus();
        await renderPage();
        notifySuccess("Export report refreshed.");
        break;
      case "preview_refresh":
        await fetchLivePreviewData();
        await renderPage();
        notifySuccess("Preview diagnostics refreshed.");
        break;
      case "action_refresh":
        await fetchActionGraphData();
        await renderPage();
        notifySuccess("Commands refreshed.");
        break;
      case "action_execute_sample":
        await executeSampleCommand();
        await renderPage();
        notifySuccess("Sample command executed.");
        break;
      case "action_save_mapping":
        await saveActionGraphMapping();
        await fetchActionGraphData();
        await renderPage();
        notifySuccess("Command phrase mapping saved.");
        break;
      case "gesture_refresh":
        await fetchGestureExpressionData();
        await renderPage();
        notifySuccess("Gesture and voice context refreshed.");
        break;
      case "gesture_apply_profile":
        await applyGestureProfile();
        await renderPage();
        notifySuccess("Expression profile applied.");
        break;
      case "gesture_scan_body_morphs": {
        postGestureClientMessage({ type: "gail:morph:request-body-catalog" });
        notifySuccess("Requested body morph catalog from live client.");
        break;
      }
      case "gesture_apply_body_morphs": {
        const motionOnly = getSettingValue("morphs.motion_only") !== "false";
        const overrides = normalizeBodyMorphOverrides(runtime.bodyMorphOverrides);
        runtime.clientRuntimeSettings = await patchJson("/client/runtime-settings", {
          bodyMorphControls: {
            enabledDuringMotion: motionOnly,
            overrides,
          },
        });
        runtime.bodyMorphMotionOnly = motionOnly;
        runtime.bodyMorphOverrides = overrides;
        postGestureClientMessage({
          type: "gail:morph:set-body-overrides",
          enabledDuringMotion: motionOnly,
          overrides,
        });
        await renderPage();
        notifySuccess("Body morph controls applied to runtime and live client.");
        break;
      }
      case "gesture_clear_body_morphs": {
        const cleared = Object.fromEntries(
          (Array.isArray(runtime.bodyMorphCatalog) ? runtime.bodyMorphCatalog : []).map((key) => [key, 0]),
        );
        runtime.clientRuntimeSettings = await patchJson("/client/runtime-settings", {
          bodyMorphControls: {
            enabledDuringMotion: true,
            overrides: cleared,
          },
        });
        runtime.bodyMorphMotionOnly = true;
        runtime.bodyMorphOverrides = cleared;
        setSettingValue("morphs.motion_only", "true");
        postGestureClientMessage({
          type: "gail:morph:set-body-overrides",
          enabledDuringMotion: true,
          overrides: cleared,
        });
        await renderPage();
        notifySuccess("Body morph overrides cleared.");
        break;
      }
      case "avatar_apply_system":
      case "wardrobe_apply_system":
      case "animation_apply_system":
      case "runtime_apply_system":
        await applyRuntimeSystemFromSetting("runtime.active_system");
        await renderPage();
        notifySuccess("Avatar runtime system updated.");
        break;
      case "avatar_set_persona": {
        const persona = getSettingValue("avatar.active_persona") || "normal";
        runtime.localLlmConfig = await patchJson("/providers/local-llm-config", { activePrivatePersona: persona });
        await renderPage();
        notifySuccess(`Active persona set to ${persona}.`);
        break;
      }
      case "avatar_edit_personas":
        await openPageById("providers-voice");
        notifyInfo("Opened Providers and Voice for full persona editing.");
        break;
      case "avatar_edit_commands":
        await openPageById("action-graph");
        notifyInfo("Opened Action Graph for command editing.");
        break;
      case "wardrobe_select_preset": {
        const presets = runtime.wardrobePresets?.presets ?? [];
        if (presets.length === 0) { notifyInfo("No presets available."); break; }
        // Pick next preset in round-robin, or use the one selected via canvas click
        const currentActiveId = runtime.wardrobePresets?.activePresetId;
        const selectedPresetId = runtime._selectedWardrobePresetId || currentActiveId;
        if (!selectedPresetId || selectedPresetId === currentActiveId) {
          // Cycle to next preset
          const idx = presets.findIndex((p) => p.id === currentActiveId);
          const next = presets[(idx + 1) % presets.length];
          runtime.wardrobePresets = await patchJson("/client/wardrobe-presets", { activePresetId: next.id });
        } else {
          runtime.wardrobePresets = await patchJson("/client/wardrobe-presets", { activePresetId: selectedPresetId });
        }
        runtime._selectedWardrobePresetId = null;
        await renderPage();
        notifySuccess(`Active preset: ${runtime.wardrobePresets?.activePresetId}`);
        break;
      }
      case "wardrobe_create_preset": {
        const newId = (getSettingValue("wardrobe.new_preset_id") || "").trim().replace(/\s+/g, "_").toLowerCase();
        const newName = (getSettingValue("wardrobe.new_preset_name") || "").trim();
        const newPersona = getSettingValue("wardrobe.new_preset_persona") || "normal";
        if (!newId || !newName) { notifyInfo("Fill in New Preset ID and Name first."); break; }
        runtime.wardrobePresets = await postJson("/client/wardrobe-presets", {
          id: newId, name: newName, persona: newPersona,
          slots: { base: null, hair: null, upper: null, lower: null, footwear: null, accessories: null },
        });
        await renderPage();
        notifySuccess(`Preset created: ${newName}`);
        break;
      }
      case "wardrobe_voice_save": {
        const presetId = runtime._selectedWardrobePresetId || runtime.wardrobePresets?.activePresetId;
        if (!presetId) { notifyInfo("Select or activate a preset first."); break; }
        await saveWardrobeVoiceProfileFromCanvas(presetId);
        await renderPage();
        notifySuccess(`Saved voice profile for ${presetId}.`);
        break;
      }
      case "wardrobe_delete_preset": {
        const activePresetId = runtime.wardrobePresets?.activePresetId;
        if (!activePresetId) { notifyInfo("No active preset to delete."); break; }
        await deleteJson(`/client/wardrobe-presets/${encodeURIComponent(activePresetId)}`);
        await fetchClientRuntimeData();
        await renderPage();
        notifySuccess(`Preset deleted: ${activePresetId}`);
        break;
      }
      case "animation_run_export":
        await runExportProfile("avatar-assets", getSettingValue("anim.runtime_profile") || "high");
        await renderPage();
        notifySuccess("Avatar export completed.");
        break;
      case "animation_run_pipeline":
        await runExportProfile("playcanvas-pipeline", getSettingValue("anim.runtime_profile") || "high");
        await renderPage();
        notifySuccess("Full PlayCanvas pipeline completed.");
        break;
      case "runtime_run_pipeline":
        await runExportProfile("playcanvas-pipeline", getSettingValue("runtime.profile") || "high");
        await renderPage();
        notifySuccess("Runtime pipeline completed.");
        break;
      case "workflow_refresh":
        await fetchWorkflowData();
        await renderPage();
        notifySuccess("Workflow list refreshed.");
        break;
      case "workflow_create":
        await createWorkflow();
        await renderPage();
        notifySuccess("Workflow created.");
        break;
      case "workflow_plan":
        await planSelectedWorkflow();
        await renderPage();
        notifySuccess("Workflow planned.");
        break;
      case "workflow_run_ready":
        await runSelectedReadyStep();
        await renderPage();
        notifySuccess("Ready step executed.");
        break;
      case "workflow_open_review_queue":
        await openPageById("build-control-tower");
        await fetchBuildControlData();
        await renderPage();
        notifySuccess("Review queue opened in Build Control Tower.");
        break;
      case "build_refresh":
        await fetchBuildControlData();
        await renderPage();
        notifySuccess("Build control tower refreshed.");
        break;
      case "build_submit_step":
        await submitFirstReadyBuildStep();
        await fetchBuildControlData();
        await renderPage();
        notifySuccess("First ready step submitted for approval.");
        break;
      case "build_approve_step":
        await approveFirstPendingBuildStep();
        await fetchBuildControlData();
        await renderPage();
        notifySuccess("First pending review step approved.");
        break;
      case "build_request_changes":
        await requestChangesFirstPendingBuildStep();
        await fetchBuildControlData();
        await renderPage();
        notifySuccess("Requested changes on first pending step.");
        break;
      case "build_capture_screenshot":
        await captureBuildScreenshot();
        await renderPage();
        notifySuccess("Build screenshot captured.");
        break;
      case "build_analyze_screenshot":
        await analyzeLatestBuildScreenshot();
        await renderPage();
        notifySuccess("Build screenshot analyzed.");
        break;
      case "build_run_script":
        await runSelectedBuildScript();
        await fetchBuildControlData();
        await renderPage();
        notifySuccess("Build script run completed.");
        break;
      case "build_show_latest_results":
        await fetchSelectedBuildScriptResults();
        await renderPage();
        notifySuccess("Loaded latest script results.");
        break;
      case "open_animation_viewer": {
        const url = getSettingValue("anim.viewer_url") || "http://127.0.0.1:4180/client/anim-test/";
        const health = await getJson("/viewer/health");
        if (!health?.reachable) {
          throw new Error("Animation viewer is offline. Start the viewer service before opening this link.");
        }
        window.open(url, "_blank", "noopener,noreferrer");
        notifyInfo("Animation viewer opened in new tab.");
        break;
      }
      case "auth_refresh":
        await fetchAuthDeviceData();
        await renderPage();
        notifySuccess("Auth and devices refreshed.");
        break;
      case "pairing_create":
        await createPairingSession();
        await renderPage();
        notifySuccess("Pairing session created.");
        break;
      case "device_register":
        await registerQuickDevice();
        await renderPage();
        notifySuccess("Quick device registered.");
        break;
      case "device_unlock":
        await unlockFirstDevice();
        await renderPage();
        notifySuccess("Device unlock window granted.");
        break;
      case "display_refresh":
        await fetchAuthDeviceData();
        await renderPage();
        notifySuccess("Display profiles and runtime mode refreshed.");
        break;
      case "display_apply":
        await applyDisplayRuntimeControls();
        await renderPage();
        notifySuccess("Display target and mode applied.");
        break;
      case "provider_refresh":
        await fetchProviderVoiceData();
        await renderPage();
        notifySuccess("Provider and voice status refreshed.");
        break;
      case "provider_set_key":
        await setOpenAiConfigFromForm();
        await fetchProviderVoiceData();
        await renderPage();
        notifySuccess("OpenAI key updated.");
        break;
      case "provider_clear_key":
        await clearOpenAiConfig();
        await fetchProviderVoiceData();
        await renderPage();
        notifySuccess("OpenAI key cleared.");
        break;
      case "local_llm_save":
        await saveLocalLlmSettingsFromForm();
        await fetchProviderVoiceData();
        await renderPage();
        notifySuccess("Local LLM, persona prompts, and backstory canon saved.");
        break;
      case "voice_save":
        await saveVoiceSettingsFromForm();
        await renderPage();
        notifySuccess("Voice settings saved.");
        break;
      case "voice_warmup":
        await postJson("/voice/warmup", {});
        notifySuccess("Voice warmup requested.");
        break;
      case "voice_test":
        await postJson("/voice/speak", { text: "Gail operator studio test line." });
        notifySuccess("Voice test request sent.");
        break;
      case "governance_refresh":
        await fetchGovernanceData();
        await renderPage();
        notifySuccess("Governance data refreshed.");
        break;
      case "governance_approve_first":
        await approveFirstGovernanceChange();
        await fetchGovernanceData();
        await renderPage();
        notifySuccess("First pending change approved.");
        break;
      case "governance_reject_first":
        await rejectFirstGovernanceChange();
        await fetchGovernanceData();
        await renderPage();
        notifySuccess("First pending change rejected.");
        break;
      case "governance_rollback_last":
        await rollbackLastApprovedChange();
        await fetchGovernanceData();
        await renderPage();
        notifySuccess("Rollback to last approved snapshot completed.");
        break;
      case "governance_history":
        runtime.governanceHistory = await getJson("/governance/history?limit=200");
        await renderPage();
        notifySuccess("Governance history loaded.");
        break;
      case "feature_refresh":
        await fetchFeatureBacklogData();
        await renderPage();
        notifySuccess("Feature backlog refreshed.");
        break;
      case "feature_add":
        await addFeatureBacklogEntry();
        await fetchFeatureBacklogData();
        await renderPage();
        notifySuccess("Feature request added.");
        break;
      case "feature_promote_first":
        await promoteFirstFeatureBacklogEntry();
        await fetchFeatureBacklogData();
        await renderPage();
        notifySuccess("Feature request promoted.");
        break;
      case "bug_refresh":
        await fetchBugReportsData();
        await renderPage();
        notifySuccess("Bug log refreshed.");
        break;
      case "bug_create":
        await createBugReportFromForm();
        await fetchBugReportsData();
        await renderPage();
        notifySuccess("Bug report created.");
        break;
      case "bug_capture": {
        const first = getFilteredBugReports()[0];
        await captureBugScreenshot(first?.id);
        await fetchBugReportsData();
        await renderPage();
        notifySuccess("Screenshot attached to first visible issue.");
        break;
      }
      case "bug_capture_create": {
        const created = await createBugReportFromForm();
        await captureBugScreenshot(created?.id);
        await fetchBugReportsData();
        await renderPage();
        notifySuccess("Capture + report completed.");
        break;
      }
      case "bug_update_first":
        await updateFirstBugReport();
        await fetchBugReportsData();
        await renderPage();
        notifySuccess("First visible bug updated.");
        break;
      case "organizer_refresh":
        await fetchOrganizerData();
        await renderPage();
        notifySuccess("Organizer data refreshed.");
        break;
      case "review_refresh":
        await renderPage();
        notifySuccess("Pass review refreshed.");
        break;
      case "review_clear_done":
        clearCompletedPageNotes();
        await renderPage();
        notifySuccess("Completed page notes cleared.");
        break;
      case "task_create_quick":
        await createQuickTask();
        await fetchOrganizerData();
        await renderPage();
        notifySuccess("Quick task created.");
        break;
      case "approval_refresh":
        runtime.approvals = await getJson("/approvals");
        await renderPage();
        notifySuccess("Approvals refreshed.");
        break;
      case "system_refresh":
        await fetchSystemStatusData();
        await renderPage();
        notifySuccess("System status refreshed.");
        break;
      case "system_browse": {
        const browsePath = getSettingValue("system.browse_path") || ".";
        runtime.systemFiles = await getJson(`/system/files?path=${encodeURIComponent(browsePath)}`);
        if (!Array.isArray(runtime.systemFiles)) runtime.systemFiles = [];
        await renderPage();
        notifySuccess(`Browsed ${browsePath}: ${runtime.systemFiles.length} entries.`);
        break;
      }
      case "system_read_file": {
        const readPath = getSettingValue("system.read_file");
        if (!readPath) throw new Error("Set a file path in Read File Path first.");
        runtime.systemFileContent = await getJson(`/system/files/read?path=${encodeURIComponent(readPath)}`);
        await renderPage();
        notifySuccess(`Read file: ${readPath}`);
        break;
      }
      case "system_errors":
        runtime.systemErrors = await getJson("/system/errors");
        if (!Array.isArray(runtime.systemErrors)) runtime.systemErrors = [];
        await renderPage();
        notifySuccess(`Loaded ${runtime.systemErrors.length} error entries.`);
        break;
      case "manager_refresh":
        await fetchManagerAgentData();
        await renderPage();
        notifySuccess("Manager report refreshed.");
        break;
      case "manager_dispatch": {
        const instruction = getSettingValue("manager.instruction");
        if (!instruction) throw new Error("Enter an instruction in the Directive Instruction field first.");
        const assigneeSetting = getSettingValue("manager.assignee") || "auto";
        const body = { instruction, priority: getSettingValue("manager.priority") || "normal" };
        if (assigneeSetting !== "auto") body.assignee = assigneeSetting;
        const created = await postJson("/manager/directives", body);
        runtime.managerDirectives = [created, ...runtime.managerDirectives].slice(0, 50);
        await fetchManagerAgentData();
        await renderPage();
        notifySuccess(`Directive dispatched: ${created.id} → ${created.assignee}`);
        break;
      }
      case "manager_avatar_request": {
        const instruction = getSettingValue("manager.instruction");
        if (!instruction) throw new Error("Enter an instruction in the Directive Instruction field first.");
        const result = await postJson("/manager/avatar-request", { instruction });
        runtime.managerAvatarReply = result?.reply || "No reply.";
        await fetchManagerAgentData();
        await renderPage();
        notifySuccess("Avatar request sent to manager.");
        break;
      }
      case "manager_cancel_first": {
        const active = runtime.managerDirectives.find((d) => ["pending", "dispatched", "running"].includes(d.status));
        if (!active) throw new Error("No active directive to cancel.");
        await postJson(`/manager/directives/${active.id}/cancel`, {});
        await fetchManagerAgentData();
        await renderPage();
        notifySuccess(`Directive ${active.id} cancelled.`);
        break;
      }
      case "manager_gail_approve": {
        const awaiting = runtime.managerDirectives.find((d) => d.status === "awaiting_gail_approval");
        if (!awaiting) throw new Error("No directives awaiting Gail's approval.");
        await postJson(`/manager/directives/${awaiting.id}/gail-approve`, { decision: "approved", note: "Gail approved via operator shell." });
        await fetchManagerAgentData();
        await renderPage();
        notifySuccess(`Gail approved directive ${awaiting.id}.`);
        break;
      }
      case "manager_gail_reject": {
        const awaiting = runtime.managerDirectives.find((d) => d.status === "awaiting_gail_approval");
        if (!awaiting) throw new Error("No directives awaiting Gail's approval.");
        await postJson(`/manager/directives/${awaiting.id}/gail-approve`, { decision: "rejected", note: "Gail rejected via operator shell." });
        await fetchManagerAgentData();
        await renderPage();
        notifySuccess(`Gail rejected directive ${awaiting.id}.`);
        break;
      }
      default:
        throw new Error(`Unknown action: ${actionId}`);
    }
  });
}

function getAnimationChecklistSummary() {
  const notes = Array.isArray(ui.pageNotes["animation-library"]) ? ui.pageNotes["animation-library"] : [];
  const seeded = notes.filter((note) => note?.meta === "master_animation_plan");
  const done = seeded.filter((note) => normalizeNoteStatus(note.status) === "done").length;
  return { done, total: seeded.length };
}

function seedAnimationChecklistFromPlans() {
  const existing = Array.isArray(ui.pageNotes["animation-library"]) ? ui.pageNotes["animation-library"] : [];
  const hasSeeded = existing.some((note) => note?.meta === "master_animation_plan");
  if (hasSeeded) {
    notifyInfo("Master animation checklist already exists on this page.");
    return;
  }
  const now = new Date().toISOString();
  const seededNotes = MASTER_ANIMATION_PLAN_CHECKLIST.map((item, index) => ({
    id: `animation-library-master-${Date.now()}-${index + 1}`,
    at: now,
    title: item.title,
    details: item.details,
    status: "open",
    pageId: "animation-library",
    pageTitle: "Animation Library",
    route: "/panel/module/animation-library",
    meta: "master_animation_plan",
  }));
  ui.pageNotes["animation-library"] = [...seededNotes, ...existing].slice(0, 80);
  persistPageNotes();
  appendAudit("animation_master_plan_seeded", `Seeded ${seededNotes.length} master animation checklist items.`, "info");
}

async function withAction(actionId, actionLabel, task) {
  const button = document.querySelector(`.action-btn[data-action-id="${actionId}"]`);
  const startedAt = performance.now();
  setActionPending(actionId, button, true, actionLabel);
  try {
    await task();
    markGuidedActionComplete(activePage.id, actionId);
    const elapsedMs = Math.round(performance.now() - startedAt);
    markPageHealth(activePage.id, {
      status: "online",
      message: "Data: synced",
      lastSyncAt: new Date().toISOString(),
      lastError: undefined,
    });
    renderPageHealth();
    appendAudit("action_success", `${actionLabel} completed in ${elapsedMs}ms.`, "success");
    logLine(`[action] ${actionLabel} completed in ${elapsedMs}ms`, "success");
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : String(error);
    const message = buildActionErrorMessage(actionId, rawMessage);
    markPageHealth(activePage.id, {
      status: "degraded",
      message: "Data: action error",
      lastError: message,
    });
    renderPageHealth();
    appendAudit("action_error", `${actionLabel} failed: ${message}`, "error");
    notifyError(message);
    logLine(`[action] ${actionLabel} failed: ${message}`, "error");
  } finally {
    setActionPending(actionId, button, false, actionLabel);
    await refreshApiHealth();
  }
}

function buildActionErrorMessage(actionId, message) {
  if (actionId === "action_execute_sample") {
    if (message.includes("No hardwired command matched phrase")) {
      return `${message}. Try one of: work mode, private mode, show tasks, backup now.`;
    }
    if (message.includes("Request timed out")) {
      return `${message}. Check backend readiness and command route health.`;
    }
  }
  return message;
}

function setActionPending(actionId, button, pending, label) {
  if (!button) {
    return;
  }
  if (pending) {
    ui.pendingActions.add(actionId);
    button.disabled = true;
    button.classList.add("is-pending");
    button.textContent = `${label}...`;
  } else {
    ui.pendingActions.delete(actionId);
    button.disabled = false;
    button.classList.remove("is-pending");
    button.textContent = label;
  }
}

async function loadPageData(pageId) {
  if (pageId === "workflow-studio") return fetchWorkflowData();
  if (pageId === "build-control-tower") return fetchBuildControlData();
  if (["animation-library", "runtime-mapping"].includes(pageId)) return fetchAnimationExportData();
  if (["avatar-library", "wardrobe-manager", "state-machine", "asset-binding"].includes(pageId)) {
    await fetchClientRuntimeData();
    if (pageId === "avatar-library") await fetchProviderVoiceData();
    return;
  }
  if (pageId === "pass-review") return undefined;
  if (pageId === "live-preview") return fetchLivePreviewData();
  if (pageId === "action-graph") return fetchActionGraphData();
  if (pageId === "gesture-expression") return fetchGestureExpressionData();
  if (pageId === "devices-auth") return fetchAuthDeviceData();
  if (pageId === "providers-voice") return fetchProviderVoiceData();
  if (pageId === "change-governance") return fetchGovernanceData();
  if (pageId === "feature-inbox") return fetchFeatureBacklogData();
  if (pageId === "report-bugs") return fetchBugReportsData();
  if (pageId === "organizer-control") return fetchOrganizerData();
  if (pageId === "system-status") return fetchSystemStatusData();
  if (pageId === "manager-agent") return fetchManagerAgentData();
  return undefined;
}

async function fetchWorkflowData() {
  runtime.workflows = await getJson("/workflows");
  if (!Array.isArray(runtime.workflows)) runtime.workflows = [];
  if (runtime.workflows.length > 0 && !runtime.selectedWorkflowId) runtime.selectedWorkflowId = runtime.workflows[0].id;
  if (runtime.selectedWorkflowId && !runtime.workflows.some((w) => w.id === runtime.selectedWorkflowId)) {
    runtime.selectedWorkflowId = runtime.workflows[0]?.id ?? null;
  }
}

function getSelectedWorkflow() {
  return runtime.workflows.find((workflow) => workflow.id === runtime.selectedWorkflowId) ?? runtime.workflows[0];
}

async function createWorkflow() {
  const template = getSettingValue("workflow.template") || "intake";
  const providerPreference = getSettingValue("workflow.provider") || "openai";
  const now = new Date().toISOString().slice(0, 16).replace("T", " ");
  const objective = template === "analysis" ? "Compile findings and prep review package." : "Summarize context, draft outputs, and route through review.";
  const created = await postJson("/workflows", { title: `Studio ${template} workflow ${now}`, objective, providerPreference, contextItems: [{ title: "Studio shell context", body: "Created from shell for workflow validation.", sourceType: "manual" }] });
  runtime.selectedWorkflowId = created.id;
  await fetchWorkflowData();
}

async function planSelectedWorkflow() {
  const workflow = getSelectedWorkflow();
  if (!workflow?.id) throw new Error("No workflow available.");
  runtime.workflowExecution = await postJson(`/workflows/${workflow.id}/plan`, { replaceExistingSteps: true });
  runtime.selectedWorkflowId = runtime.workflowExecution.workflow.id;
  await fetchWorkflowData();
}

async function runSelectedReadyStep() {
  const workflow = getSelectedWorkflow();
  if (!workflow?.id) throw new Error("No workflow available.");
  const step = workflow.steps.find((candidate) => candidate.status === "ready");
  if (!step?.id) throw new Error("No ready step found.");
  runtime.workflowExecution = await postJson(`/workflows/${workflow.id}/steps/${step.id}/run`, {});
  await fetchWorkflowData();
}

async function fetchBuildControlData() {
  runtime.buildOverview = await getJson("/build/overview");
  runtime.buildAgents = await getJson("/build/agents");
  runtime.buildScripts = await getJson("/build/scripts");
  if (!Array.isArray(runtime.buildAgents)) runtime.buildAgents = [];
  if (!Array.isArray(runtime.buildScripts)) runtime.buildScripts = [];
  await fetchWorkflowData();
}

async function fetchSystemStatusData() {
  runtime.systemStatus = await getJson("/system/status");
  runtime.systemErrors = await getJson("/system/errors");
  if (!Array.isArray(runtime.systemErrors)) runtime.systemErrors = [];
}

async function fetchManagerAgentData() {
  runtime.managerReport = await getJson("/manager/report");
  const dirs = await getJson("/manager/directives");
  runtime.managerDirectives = Array.isArray(dirs) ? dirs : [];
}

function getFirstReadyBuildStep() {
  for (const workflow of runtime.workflows) {
    const step = workflow.steps.find((candidate) => candidate.status === "ready");
    if (step) {
      return { workflow, step };
    }
  }
  return null;
}

function getFirstPendingReviewStep() {
  for (const workflow of runtime.workflows) {
    const step = workflow.steps.find((candidate) => candidate.status === "needs_review");
    if (step) {
      return { workflow, step };
    }
  }
  return null;
}

function getPendingReviewQueueEntry(stepId) {
  const approvalQueue = Array.isArray(runtime.buildOverview?.approvalQueue) ? runtime.buildOverview.approvalQueue : [];
  return approvalQueue.find((entry) => entry.stepId === stepId) ?? null;
}

async function submitFirstReadyBuildStep() {
  const ready = getFirstReadyBuildStep();
  if (!ready?.step?.id) {
    throw new Error("No ready workflow step found to submit.");
  }
  await postJson(`/build/steps/${ready.step.id}/submit`, {
    summary: `Submitted from Build Control Tower for ${ready.workflow.title}.`,
    artifactPaths: [
      "docs/Build plan 4_4/GAIL_BUILD_CONTROL_TOWER_MASTER_CHECKER_PLAN.md",
      "docs/Build plan 4_4/GAIL_AI_AUTONOMY_AND_VOICE_PLAN.md",
    ],
  });
}

async function approveFirstPendingBuildStep() {
  const pending = getFirstPendingReviewStep();
  if (!pending?.step?.id) {
    throw new Error("No step currently pending review.");
  }
  const requireScreenshotEvidence = (getSettingValue("build.require_screenshot") || "true") !== "false";
  if (requireScreenshotEvidence) {
    const queueEntry = getPendingReviewQueueEntry(pending.step.id);
    if (!queueEntry?.hasScreenshotEvidence) {
      throw new Error("First pending review step still needs screenshot analysis evidence. Capture and analyze a screenshot before approval.");
    }
  }
  await postJson(`/build/steps/${pending.step.id}/approve`, {
    decision: "approve",
    notes: "Approved from Build Control Tower.",
    requireScreenshotEvidence,
  });
}

async function requestChangesFirstPendingBuildStep() {
  const pending = getFirstPendingReviewStep();
  if (!pending?.step?.id) {
    throw new Error("No step currently pending review.");
  }
  await postJson(`/build/steps/${pending.step.id}/approve`, {
    decision: "request_changes",
    notes: "Requested changes from Build Control Tower review lane.",
    requireScreenshotEvidence: false,
  });
}

async function captureBuildScreenshot() {
  const pending = getFirstPendingReviewStep();
  const feature = getSettingValue("build.feature") || "operator-shell";
  const sourcePath = getSettingValue("build.screenshot_path");
  const body = {
    feature,
    sourcePath: sourcePath || undefined,
    label: "Build Control Tower capture",
    stepId: pending?.step?.id,
  };
  runtime.buildCapture = await postJson("/build/screenshots/capture", body);
}

async function analyzeLatestBuildScreenshot() {
  const feature = getSettingValue("build.feature") || "operator-shell";
  const pending = getFirstPendingReviewStep();
  const screenshotPath = runtime.buildCapture?.screenshotPath;
  if (!screenshotPath) {
    throw new Error("No captured screenshot found. Capture screenshot first.");
  }
  runtime.buildAnalysis = await postJson("/build/screenshots/analyze", {
    feature,
    screenshotPath,
    stepId: pending?.step?.id,
  });
}

async function runSelectedBuildScript() {
  const scriptId = getSettingValue("build.script_id") || "avatar-assets";
  runtime.buildScriptRun = await postJson("/build/scripts/run", { id: scriptId });
  await fetchSelectedBuildScriptResults();
}

async function fetchSelectedBuildScriptResults() {
  const scriptId = getSettingValue("build.script_id") || "avatar-assets";
  runtime.buildScriptResults = await getJson(`/build/scripts/${encodeURIComponent(scriptId)}/results`);
}

async function fetchAuthDeviceData() {
  runtime.authStatus = await getJson("/auth/status");
  runtime.devices = await getJson("/devices");
  runtime.deviceDisplayProfiles = await getJson("/client/device-display-profiles");
  runtime.clientRuntimeSettings = await getJson("/client/runtime-settings");
  if (!Array.isArray(runtime.devices)) runtime.devices = [];
}

async function createPairingSession() {
  runtime.pairingSession = await postJson("/auth/pairing-sessions", {});
}

async function registerQuickDevice() {
  const stamp = Date.now().toString().slice(-6);
  await postJson("/devices", { id: `studio-device-${stamp}`, type: "web_admin", name: `Studio Device ${stamp}`, defaultMode: "work", qualityTier: "medium", trusted: true });
  await fetchAuthDeviceData();
}

async function unlockFirstDevice() {
  const firstDevice = runtime.devices[0];
  if (!firstDevice?.id) throw new Error("No device loaded.");
  const minutes = Number.parseInt(getSettingValue("auth.unlock_minutes") || "15", 10);
  await patchJson(`/devices/${firstDevice.id}/access-window`, { unlockForMinutes: Number.isFinite(minutes) ? minutes : 15 });
  await fetchAuthDeviceData();
}

async function applyDisplayRuntimeControls() {
  const selectedDeviceId = getSettingValue("display.selected_device_id");
  const displayInputMode = getSettingValue("display.input_mode") || "wake_word";
  if (selectedDeviceId) {
    runtime.deviceDisplayProfiles = await patchJson("/client/device-display-profiles", { selectedDeviceId });
  }
  runtime.clientRuntimeSettings = await patchJson("/client/runtime-settings", { displayInputMode });
  runtime.voiceSettings = await patchJson("/voice/settings", { mode: displayInputMode });
  runtime.voiceStatus = await getJson("/voice/status");
}

async function fetchProviderVoiceData() {
  runtime.providers = await getJson("/providers/status");
  runtime.openAiConfig = await getJson("/providers/openai-config");
  runtime.localLlmConfig = await getJson("/providers/local-llm-config");
  runtime.backstoryProfile = await getJson("/persona/backstory");
  runtime.voiceSettings = await getJson("/voice/settings");
  runtime.voiceStatus = await getJson("/voice/status");
}

async function setOpenAiConfigFromForm() {
  const apiKey = getSettingValue("openai.api_key");
  if (!apiKey) {
    throw new Error("OpenAI API key must not be empty.");
  }
  runtime.openAiConfig = await patchJson("/providers/openai-config", { apiKey });
}

async function clearOpenAiConfig() {
  runtime.openAiConfig = await patchJson("/providers/openai-config", { clear: true });
}

async function saveLocalLlmSettingsFromForm() {
  const timeoutMs = Number.parseInt(getSettingValue("localllm.timeout_ms") || "120000", 10);
  runtime.localLlmConfig = await patchJson("/providers/local-llm-config", {
    baseUrl: getSettingValue("localllm.base_url") || "http://127.0.0.1:11434",
    model: getSettingValue("localllm.model") || "dolphin-mistral:7b",
    timeoutMs: Number.isFinite(timeoutMs) ? timeoutMs : 120000,
    keepAlive: getSettingValue("localllm.keep_alive") || "10m",
    defaultPrivatePersona: getSettingValue("localllm.default_private_persona") || "private_counselor",
    activePrivatePersona: getSettingValue("localllm.active_private_persona") || "private_counselor",
    normalSystemPrompt: getSettingValue("localllm.normal_prompt") || "",
    counselorSystemPrompt: getSettingValue("localllm.counselor_prompt") || "",
    girlfriendSystemPrompt: getSettingValue("localllm.girlfriend_prompt") || "",
  });

  const normalCanon = getSettingValue("backstory.normal_canon") || "";
  const counselorCanon = getSettingValue("backstory.counselor_canon") || "";
  const girlfriendCanon = getSettingValue("backstory.girlfriend_canon") || "";
  const backstoryPayload = {};
  if (normalCanon.trim()) backstoryPayload.normalCanon = normalCanon;
  if (counselorCanon.trim()) backstoryPayload.counselorCanon = counselorCanon;
  if (girlfriendCanon.trim()) backstoryPayload.girlfriendCanon = girlfriendCanon;
  runtime.backstoryProfile = Object.keys(backstoryPayload).length > 0
    ? await patchJson("/persona/backstory", backstoryPayload)
    : await getJson("/persona/backstory");
}

async function fetchGovernanceData() {
  const changesRaw = await getJson("/governance/changes");
  const pendingRaw = await getJson("/governance/changes?state=pending");
  const approvedRaw = await getJson("/governance/changes?state=approved");
  const historyRaw = await getJson("/governance/history?limit=120");

  runtime.governanceChanges = asArray(changesRaw);
  runtime.governancePending = asArray(pendingRaw);
  runtime.governanceApproved = asArray(approvedRaw);
  runtime.governanceHistory = asArray(Array.isArray(historyRaw) ? historyRaw : historyRaw?.events);
}

function governanceDecisionPayload(decision) {
  return {
    reviewer: getSettingValue("governance.reviewer") || "operator",
    decision,
    reason: getSettingValue("governance.reason") || "Reviewed in governance panel.",
  };
}

async function approveFirstGovernanceChange() {
  const pending = Array.isArray(runtime.governancePending) ? runtime.governancePending[0] : undefined;
  if (!pending?.changeId) {
    throw new Error("No pending governance change found.");
  }
  await postJson(`/governance/changes/${pending.changeId}/decision`, governanceDecisionPayload("approve"));
}

async function rejectFirstGovernanceChange() {
  const pending = Array.isArray(runtime.governancePending) ? runtime.governancePending[0] : undefined;
  if (!pending?.changeId) {
    throw new Error("No pending governance change found.");
  }
  await postJson(`/governance/changes/${pending.changeId}/decision`, governanceDecisionPayload("reject"));
}

async function rollbackLastApprovedChange() {
  runtime.governanceRollback = await postJson("/governance/rollback/last-approved", {});
}

function getFilteredFeatureBacklog() {
  const all = asArray(runtime.featureBacklog);
  const statusFilter = getSettingValue("feature.status") || "all";
  if (statusFilter === "all") {
    return all;
  }
  return all.filter((entry) => entry.status === statusFilter);
}

async function fetchFeatureBacklogData() {
  const statusFilter = getSettingValue("feature.status") || "all";
  const query = statusFilter === "all" ? "" : `?status=${encodeURIComponent(statusFilter)}`;
  const payload = await getJson(`/backlog/features${query}`);
  runtime.featureBacklog = asArray(payload?.items);
}

async function addFeatureBacklogEntry() {
  const title = (getSettingValue("feature.title") || "").trim();
  const details = (getSettingValue("feature.details") || "").trim();
  if (!title) {
    throw new Error("Feature title must not be empty.");
  }
  if (!details) {
    throw new Error("Feature details must not be empty.");
  }
  await postJson("/backlog/features", {
    title,
    details,
    source: getSettingValue("feature.source") || "typed",
    stageTarget: getSettingValue("feature.stage") || "next_round",
    priority: getSettingValue("feature.priority") || "normal",
    capturedBy: "studio-shell-operator",
  });
}

async function promoteFirstFeatureBacklogEntry() {
  const entries = getFilteredFeatureBacklog();
  const first = entries[0];
  if (!first?.id) {
    throw new Error("No visible feature request available for promotion.");
  }
  await postJson(`/backlog/features/${first.id}/promote`, {
    target: getSettingValue("feature.promote_target") || "task",
    reviewer: getSettingValue("governance.reviewer") || "operator",
  });
}

function getFilteredBugReports() {
  const all = asArray(runtime.bugReports);
  const statusFilter = getSettingValue("bug.filter_status") || "all";
  if (statusFilter === "all") {
    return all;
  }
  return all.filter((entry) => entry.status === statusFilter);
}

async function fetchBugReportsData() {
  const statusFilter = getSettingValue("bug.filter_status") || "all";
  const query = statusFilter === "all" ? "" : `?status=${encodeURIComponent(statusFilter)}`;
  const payload = await getJson(`/reports/bugs${query}`);
  runtime.bugReports = asArray(payload?.items);
}

async function createBugReportFromForm() {
  const title = (getSettingValue("bug.title") || "").trim();
  const details = (getSettingValue("bug.details") || "").trim();
  if (!title) {
    throw new Error("Bug summary must not be empty.");
  }
  const created = await postJson("/reports/bugs", {
    title,
    details,
    status: getSettingValue("bug.status") || "open",
    workspace: activePage.id,
    pageId: activePage.id,
    mode: runtime.voiceStatus?.modeContext || "work",
    runtimeProfile: getSettingValue("runtime.profile") || getSettingValue("anim.runtime_profile") || "high",
  });
  return created;
}

async function captureBugScreenshot(issueId) {
  if (!issueId) {
    throw new Error("No issue available to attach screenshot.");
  }
  const sourcePath = (getSettingValue("bug.capture_source_path") || "").trim();
  return postJson(`/reports/bugs/${issueId}/screenshot`, {
    pageId: activePage.id,
    sourcePath: sourcePath || undefined,
  });
}

async function updateFirstBugReport() {
  const first = getFilteredBugReports()[0];
  if (!first?.id) {
    throw new Error("No visible bug report found.");
  }
  await patchJson(`/reports/bugs/${first.id}`, {
    status: getSettingValue("bug.status") || "open",
    note: `Updated from shell on ${new Date().toISOString()}`,
  });
}

async function saveVoiceSettingsFromForm() {
  const mode = getSettingValue("voice.mode") || "wake_word";
  const timeout = Number.parseInt(getSettingValue("voice.timeout_ms") || "6000", 10);
  runtime.voiceSettings = await patchJson("/voice/settings", {
    mode,
    wakeWord: getSettingValue("voice.wake_word") || "hey gail",
    silenceTimeoutMs: Number.isFinite(timeout) ? timeout : 6000,
    autoResumeAfterResponse: getSettingValue("voice.auto_resume") !== "false",
    runtime: buildVoiceRuntimePayload(),
  });
}

function numberSetting(key, fallback) {
  const value = Number(getSettingValue(key));
  return Number.isFinite(value) ? value : fallback;
}

function listSetting(key, fallback = []) {
  const raw = getSettingValue(key);
  const values = raw
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
  return values.length > 0 ? values : fallback;
}

function buildVoiceRuntimePayload() {
  const current = runtime.voiceSettings?.runtime || {};
  const timing = current.timing || {};
  const phrases = current.phrases || {};
  const thinking = phrases.thinkingFillers || {};
  const contexts = phrases.contextFillers || {};
  return {
    timing: {
      speechCooldownMs: numberSetting("voice.speech_cooldown_ms", timing.speechCooldownMs ?? 1200),
      thinkingFillerDelayMs: numberSetting("voice.thinking_filler_delay_ms", timing.thinkingFillerDelayMs ?? 650),
      followUpTimeoutMs: numberSetting("voice.follow_up_timeout_ms", timing.followUpTimeoutMs ?? 9000),
      wakeWordFollowUpTimeoutMs: numberSetting("voice.wake_follow_up_timeout_ms", timing.wakeWordFollowUpTimeoutMs ?? 7000),
      defaultSubmitTimeoutMs: numberSetting("voice.default_submit_timeout_ms", timing.defaultSubmitTimeoutMs ?? 1400),
      followUpSubmitTimeoutMs: numberSetting("voice.follow_up_submit_timeout_ms", timing.followUpSubmitTimeoutMs ?? 850),
      wakeWordSubmitTimeoutMs: numberSetting("voice.wake_submit_timeout_ms", timing.wakeWordSubmitTimeoutMs ?? 850),
      minSubmitTimeoutMs: timing.minSubmitTimeoutMs ?? 450,
      maxSubmitTimeoutMs: timing.maxSubmitTimeoutMs ?? 3500,
      ambientLowConfidenceThreshold: numberSetting("voice.ambient_confidence", timing.ambientLowConfidenceThreshold ?? 0.48),
      ambientRepeatWindowMs: numberSetting("voice.ambient_repeat_ms", timing.ambientRepeatWindowMs ?? 10000),
    },
    phrases: {
      wakeWordAliases: listSetting("voice.wake_aliases", phrases.wakeWordAliases || ["gail", "gale", "gael", "gal"]),
      wakePrefixes: listSetting("voice.wake_prefixes", phrases.wakePrefixes || ["hey", "hi", "hello", "okay", "ok", "yo"]),
      wakeAcknowledgements: listSetting("voice.wake_acks", phrases.wakeAcknowledgements || ["I'm here."]),
      thinkingFillers: {
        question: listSetting("voice.filler_question", thinking.question || ["Let me think that through."]),
        command: listSetting("voice.filler_command", thinking.command || ["On it."]),
        statement: listSetting("voice.filler_statement", thinking.statement || ["I hear you."]),
      },
      contextFillers: {
        followUp: listSetting("voice.context_follow_up", contexts.followUp || ["I'm tracking."]),
        vision: listSetting("voice.context_vision", contexts.vision || ["Looking now."]),
        persona: listSetting("voice.context_persona", contexts.persona || ["Okay, switching gears."]),
        dance: listSetting("voice.context_dance", contexts.dance || ["Okay, cueing that up."]),
        system: listSetting("voice.context_system", contexts.system || ["Okay, adjusting that."]),
      },
      conversationClosers: listSetting("voice.closers", phrases.conversationClosers || ["Standing by whenever you're ready."]),
      bootGreetings: listSetting("voice.boot_greetings", phrases.bootGreetings || ["Hey boss, I'm online and ready to go."]),
      ambientSingleWordAllowlist: listSetting("voice.ambient_allowlist", phrases.ambientSingleWordAllowlist || ["yes", "no", "stop", "cancel"]),
    },
  };
}

async function saveWardrobeVoiceProfileFromCanvas(presetId) {
  const voiceElement = document.getElementById(`wardrobe-voice-${presetId}`);
  const instructionsElement = document.getElementById(`wardrobe-instructions-${presetId}`);
  const openAiVoice = isValueElement(voiceElement) ? voiceElement.value.trim() : "";
  const openAiInstructions = isValueElement(instructionsElement) ? instructionsElement.value.trim() : "";
  runtime.voiceSettings = await patchJson(`/voice/avatar-profiles/${encodeURIComponent(presetId)}`, {
    openAiVoice,
    openAiInstructions,
  });
}

async function fetchOrganizerData() {
  runtime.dashboard = await getJson("/dashboard/overview");
  runtime.projects = await getJson("/projects");
  runtime.tasks = await getJson("/tasks");
  runtime.reminders = await getJson("/reminders");
  runtime.approvals = await getJson("/approvals");
}

async function createQuickTask() {
  const stamp = new Date().toISOString().slice(11, 19);
  await postJson("/tasks", { title: `Studio task ${stamp}`, priority: getSettingValue("org.default_priority") || "normal", status: "pending" });
}

async function fetchClientRuntimeData() {
  runtime.clientRuntimeSettings = await getJson("/client/runtime-settings");
  const assetRoot = runtime.clientRuntimeSettings?.activeAssetRoot;
  const query = assetRoot ? `?assetRoot=${encodeURIComponent(assetRoot)}` : "";
  runtime.clientAssetManifest = await getJson(`/client/asset-manifest${query}`);
  try { runtime.wardrobePresets = await getJson("/client/wardrobe-presets"); } catch { runtime.wardrobePresets = null; }
  try { runtime.voiceSettings = await getJson("/voice/settings"); } catch { runtime.voiceSettings = null; }
}

async function fetchExportStatus() {
  runtime.exportStatus = await getJson("/exports/status");
}

async function fetchAnimationExportData() {
  await fetchClientRuntimeData();
  await fetchExportStatus();
  runtime.viewerHealth = await getJson("/viewer/health");
  runtime.animationCatalog = await getJson("/animations/catalog");
}

async function runExportProfile(runner, runtimeProfile) {
  runtime.exportRunResult = await postJson("/exports/run", { runner, runtimeProfile });
  runtime.exportStatus = runtime.exportRunResult?.status ?? runtime.exportStatus;
}

async function fetchLivePreviewData() {
  await fetchClientRuntimeData();
  runtime.cameraMatrix = await getJson("/camera/matrix");
}

async function applyRuntimeSystemFromSetting(settingKey) {
  const requestedSystem = getSettingValue(settingKey);
  if (!requestedSystem) {
    throw new Error("No runtime avatar system selected.");
  }
  await patchJson("/client/runtime-settings", { activeAvatarSystem: requestedSystem });
  await fetchClientRuntimeData();
}

async function fetchActionGraphData() {
  runtime.commands = await getJson("/commands");
  runtime.commandMappings = asArray((await getJson("/commands/mappings"))?.mappings);
  if (!Array.isArray(runtime.commands)) {
    runtime.commands = [];
  }
  if (!Array.isArray(runtime.commandMappings)) {
    runtime.commandMappings = [];
  }
}

async function executeSampleCommand() {
  const phrase = getSettingValue("action.sample_phrase") || "show tasks";
  if (phrase.length < 3) {
    throw new Error("Sample phrase must be at least 3 characters.");
  }
  runtime.commandExecution = await postJson("/commands/execute", { phrase });
}

async function saveActionGraphMapping() {
  const commandKey = (getSettingValue("action.command_key") || "").trim();
  const phrase = (getSettingValue("action.new_phrase") || "").trim();
  if (!commandKey) {
    throw new Error("Command Key must not be empty.");
  }
  if (phrase.length < 3) {
    throw new Error("New Phrase must be at least 3 characters.");
  }
  const created = await postJson("/commands/mappings", { commandKey, phrase });
  runtime.commandMappings = [created.mapping, ...asArray(runtime.commandMappings)].slice(0, 120);
}

async function fetchGestureExpressionData() {
  runtime.voiceSettings = await getJson("/voice/settings");
  runtime.voiceStatus = await getJson("/voice/status");
  runtime.clientRuntimeSettings = await getJson("/client/runtime-settings");
  runtime.bodyMorphMotionOnly = runtime.clientRuntimeSettings?.bodyMorphControls?.enabledDuringMotion !== false;
  runtime.bodyMorphOverrides = normalizeBodyMorphOverrides(runtime.clientRuntimeSettings?.bodyMorphControls?.overrides);
}

async function applyGestureProfile() {
  const profile = getSettingValue("gesture.profile") || "calm";
  runtime.gestureProfile = profile;
  window.localStorage.setItem(STORAGE_KEYS.gestureProfile, profile);
  const openAiInstructions = profile === "high-energy"
    ? "Speak with high energy, animated cadence, and crisp expressive cues."
    : profile === "neutral"
      ? "Speak in a balanced neutral style with measured expression."
      : "Speak in a calm, clear, and grounded style.";
  runtime.voiceSettings = await patchJson("/voice/settings", { openAiInstructions });
  runtime.voiceStatus = await getJson("/voice/status");
}

async function refreshApiHealth() {
  if (!el.apiHealthPill) return;
  try {
    const health = await getJson("/health");
    const online = health && health.ok === true;
    setApiHealth(online ? "online" : "degraded");
  } catch {
    setApiHealth("offline");
  }
}

function setApiHealth(mode) {
  el.apiHealthPill.classList.remove("is-online", "is-degraded", "is-offline");
  if (mode === "online") {
    el.apiHealthPill.classList.add("is-online");
    el.apiHealthPill.textContent = "API: online";
    return;
  }
  if (mode === "degraded") {
    el.apiHealthPill.classList.add("is-degraded");
    el.apiHealthPill.textContent = "API: degraded";
    return;
  }
  el.apiHealthPill.classList.add("is-offline");
  el.apiHealthPill.textContent = "API: offline";
}

function defaultHeaders() {
  return { "Content-Type": "application/json", "x-gail-device-id": "studio-shell-1", "x-gail-device-type": "web_admin", "x-gail-mode": "work", "x-gail-explicit-local-save": "false" };
}

async function getJson(path) { return requestJsonWithRetry("GET", path, undefined, { retries: GET_RETRY_ATTEMPTS, baseDelayMs: GET_RETRY_BASE_MS }); }
async function postJson(path, body) { return requestJson("POST", path, body); }
async function patchJson(path, body) { return requestJson("PATCH", path, body); }
async function deleteJson(path) { return requestJson("DELETE", path, undefined); }

async function requestJsonWithRetry(method, path, body, options = { retries: 0, baseDelayMs: 200 }) {
  let attempt = 0;
  while (true) {
    attempt += 1;
    try {
      return await requestJson(method, path, body);
    } catch (error) {
      const retries = options.retries ?? 0;
      if (attempt > retries || !isRetryableError(error)) {
        throw error;
      }
      const delayMs = (options.baseDelayMs ?? 200) * Math.pow(2, attempt - 1);
      logLine(`[api] retry ${attempt}/${retries} ${method} ${path} in ${delayMs}ms`, "info");
      await sleep(delayMs);
    }
  }
}

async function requestJson(method, path, body) {
  const url = `${API_BASE}${path}`;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const startedAt = performance.now();
  try {
    const response = await fetch(url, { method, headers: defaultHeaders(), body: body !== undefined ? JSON.stringify(body) : undefined, signal: controller.signal });
    const payload = await parseResponse(response);
    const elapsedMs = Math.round(performance.now() - startedAt);
    logLine(`[api] ${method} ${path} ${response.status} (${elapsedMs}ms)`, "info");
    return payload;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new Error(`Request timed out after ${REQUEST_TIMEOUT_MS}ms: ${method} ${path}`);
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function isRetryableError(error) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return message.includes("timed out") || message.includes("failed (5") || message.includes("networkerror") || message.includes("failed to fetch");
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function parseResponse(response) {
  const text = await response.text();
  const payload = text ? safeParseJson(text) : {};
  if (!response.ok) {
    const message = payload && typeof payload === "object" && "error" in payload ? String(payload.error) : `Request failed (${response.status})`;
    throw new Error(message);
  }
  return payload;
}

function safeParseJson(text) {
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

function asArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value === undefined || value === null) {
    return [];
  }
  return [value];
}

function openCommandPalette() {
  if (typeof el.commandDialog.showModal !== "function") return;
  el.commandDialog.showModal();
  el.commandFilter.value = "";
  renderCommandResults();
  el.commandFilter.focus();
}

function renderCommandResults() {
  const rawQuery = el.commandFilter.value.trim();
  const query = rawQuery.toLowerCase();
  const pageMatches = PAGES
    .filter((page) => !query || `${page.title} ${page.summary} ${page.route}`.toLowerCase().includes(query))
    .slice(0, 12)
    .map((page) => ({ kind: "page", page }));
  const actionMatches = COMMAND_PALETTE_QUICK_ACTIONS
    .filter((entry) => !query || `${entry.label} ${entry.summary} ${entry.actionId} ${entry.pageId}`.toLowerCase().includes(query))
    .slice(0, 10)
    .map((entry) => ({ kind: "action", entry }));
  const controlMatches = rawQuery.length >= 3
    ? [{ kind: "control", text: rawQuery }]
    : [];
  const matches = [...controlMatches, ...actionMatches, ...pageMatches];
  el.commandResults.innerHTML = "";
  if (matches.length === 0) {
    const empty = document.createElement("p");
    empty.className = "command-empty";
    empty.textContent = "No pages, quick actions, or backend control routes match your search.";
    el.commandResults.appendChild(empty);
    return;
  }
  for (const match of matches) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "command-item";
    if (match.kind === "control") {
      item.innerHTML = `<strong>${escapeHtml(`Route control text: ${match.text}`)}</strong><small>Backend Control | Resolve through /control/intents</small>`;
      item.addEventListener("click", () => {
        void routeShellControlText(match.text, { trigger: "palette" });
        el.commandDialog.close();
      });
    } else if (match.kind === "action") {
      const entry = match.entry;
      item.innerHTML = `<strong>${escapeHtml(entry.label)}</strong><small>Quick Action | ${escapeHtml(entry.summary)}</small>`;
      item.addEventListener("click", () => {
        void runQuickActionFromPalette(entry);
        el.commandDialog.close();
      });
    } else {
      const page = match.page;
      item.innerHTML = `<strong>${escapeHtml(page.title)}</strong><small>${escapeHtml(page.route)} | ${escapeHtml(page.summary)}</small>`;
      item.addEventListener("click", () => {
        void setActivePage(page);
        el.commandDialog.close();
      });
    }
    el.commandResults.appendChild(item);
  }
}

async function runQuickActionFromPalette(entry) {
  const page = PAGES.find((candidate) => candidate.id === entry.pageId);
  if (!page) {
    notifyError(`Quick action page missing: ${entry.pageId}`);
    return;
  }
  await setActivePage(page);
  await runAction(entry.actionId, entry.label);
}

async function consumeLocationCommandIntent() {
  const currentUrl = new URL(window.location.href);
  const commandAction = currentUrl.searchParams.get("commandAction");
  const controlText = currentUrl.searchParams.get("controlText");
  if (!commandAction && !controlText) {
    return;
  }

  currentUrl.searchParams.delete("commandAction");
  currentUrl.searchParams.delete("controlText");
  window.history.replaceState({ pageId: activePage.id }, "", currentUrl);

  if (commandAction) {
    await routeShellCommandAction(commandAction, { trigger: "startup" });
    return;
  }

  await routeShellControlText(controlText, { trigger: "startup" });
}

async function routeShellControlText(text, options = {}) {
  const trimmed = String(text || "").trim();
  if (trimmed.length < 3) {
    throw new Error("Control text must be at least 3 characters.");
  }

  const payload = await postJson("/control/intents", {
    text: trimmed,
    source: "typed",
    autoPlan: true,
  });

  if (payload?.action === "command" && payload.command?.action) {
    await routeShellCommandAction(payload.command.action, { trigger: options.trigger || "control", inputText: trimmed });
    notifySuccess(payload.summary || `Command routed: ${payload.command.action}`);
    logLine(`[control] command ${payload.command.action} <= ${trimmed}`, "success");
    return payload;
  }

  if (payload?.action === "workflow" && payload.workflow?.id) {
    await openPageById("workflow-studio");
    await fetchWorkflowData();
    runtime.selectedWorkflowId = payload.workflow.id;
    await renderPage();
    notifySuccess(payload.summary || `Workflow planned: ${payload.workflow.title}`);
    logLine(`[control] workflow ${payload.workflow.id} <= ${trimmed}`, "success");
    return payload;
  }

  notifyInfo(payload?.summary || "Control route completed without a page action.");
  return payload;
}

async function routeShellCommandAction(commandAction, options = {}) {
  const route = SHELL_COMMAND_ACTIONS[commandAction];

  if (commandAction === "open_menu") {
    openCommandPalette();
    notifyInfo("Shell command palette opened.");
    return;
  }

  if (commandAction === "help") {
    openPageHelp();
    notifyInfo("Shell help opened.");
    return;
  }

  if (commandAction === "switch_mode_work" || commandAction === "switch_mode_private") {
    notifyInfo(`Command ${commandAction} is runtime-facing. The shell continues to operate in work context.`);
    logLine(`[command] runtime-only action ${commandAction}`, "info");
    return;
  }

  if (commandAction === "switch_private_persona_counselor" || commandAction === "switch_private_persona_girlfriend") {
    const persona = commandAction === "switch_private_persona_girlfriend" ? "private_girlfriend" : "private_counselor";
    runtime.localLlmConfig = await patchJson("/providers/local-llm-config", { activePrivatePersona: persona });
    await fetchProviderVoiceData();
    await openPageById("providers-voice");
    notifyInfo(`Active private persona set to ${persona}.`);
    logLine(`[command] ${commandAction}${options.inputText ? ` <= ${options.inputText}` : ""}`, "success");
    return;
  }

  if (!route) {
    notifyInfo(`No shell route is defined for command action ${commandAction}.`);
    logLine(`[command] unmapped action ${commandAction}`, "info");
    return;
  }

  if (route.pageId) {
    await openPageById(route.pageId);
  }
  if (typeof route.beforeRun === "function") {
    route.beforeRun();
  }
  if (route.actionId) {
    await runAction(route.actionId, route.actionLabel || route.actionId);
  } else {
    notifyInfo(`Opened ${route.pageId} for command ${commandAction}.`);
  }
  logLine(`[command] ${commandAction}${options.inputText ? ` <= ${options.inputText}` : ""}`, "success");
}

function openChangeDialog() {
  if (typeof el.changeDialog.showModal !== "function") return;
  el.changePage.value = activePage.title;
  el.changeTitle.value = `${activePage.title}: `;
  el.changeDetails.value = "";
  el.changeDialog.showModal();
  el.changeTitle.focus();
}

async function submitChangeRequest() {
  const title = (el.changeTitle.value || "").trim();
  const details = (el.changeDetails.value || "").trim();
  if (!title || !details) {
    notifyError("Change request requires both title and details.");
    return;
  }
  const bodyLines = [`Page: ${activePage.title} (${activePage.id})`, `Route: ${activePage.route}`, "", "Details:", details, ""];
  const notePayload = { title: `[Change Request] ${title}`, body: bodyLines.join("\n"), privateOnly: false };
  try {
    const result = await postJson("/notes", notePayload);
    notifySuccess("Change request submitted to backend notes.");
    appendAudit("change_request", `Submitted change request: ${title}`, "success");
    logLine(`[change] submitted id=${result.id ?? "ok"}`, "success");
  } catch {
    const queue = safeParseJson(window.localStorage.getItem(CHANGE_QUEUE_KEY) || "[]");
    const list = Array.isArray(queue) ? queue : [];
    list.push({ at: new Date().toISOString(), pageId: activePage.id, pageTitle: activePage.title, title, details, route: activePage.route });
    window.localStorage.setItem(CHANGE_QUEUE_KEY, JSON.stringify(list));
    notifyInfo("Backend unavailable. Change request queued locally.");
    appendAudit("change_request_queued", `Queued offline change request: ${title}`, "info");
  }
  el.changeDialog.close();
}

function notifySuccess(message) { showToast("success", message); }
function notifyError(message) { showToast("error", message); }
function notifyInfo(message) { showToast("info", message); }

function showToast(type, message) {
  if (!el.toastStack) return;
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  el.toastStack.appendChild(toast);
  window.setTimeout(() => {
    toast.classList.add("is-out");
    window.setTimeout(() => toast.remove(), 220);
  }, 3200);
}

function logLine(line, level = "info") {
  const now = new Date().toISOString();
  const prefix = level.toUpperCase().padEnd(5, " ");
  const previous = el.shellConsole.textContent.trim();
  const next = `${previous}\n${now} [${prefix}] ${line}`.trim();
  el.shellConsole.textContent = next.split("\n").slice(-220).join("\n");
}

function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\"", "&quot;").replaceAll("'", "&#39;");
}

/* ═══════════════════════════════════════════════════════
   WORKFLOW NODE GRAPH (Bottom Dock — Workflows Tab)
   ═══════════════════════════════════════════════════════ */

let wfData = { workflows: [], selectedNodeId: null };

async function renderWorkflowGraph() {
  if (!el.wfCanvas) return;
  el.wfCanvas.innerHTML = '<div class="wf-empty">Loading workflows...</div>';
  try {
    const response = await getJson("/workflows");
    const workflows = Array.isArray(response?.value) ? response.value : Array.isArray(response) ? response : [];
    wfData.workflows = workflows;

    if (workflows.length === 0) {
      el.wfCanvas.innerHTML = '<div class="wf-empty">No workflows found. Click <strong>+ New Workflow</strong> to create one.</div>';
      return;
    }

    let html = "";
    for (const workflow of workflows) {
      const wfId = workflow.id || workflow.workflowId || "unknown";
      const wfLabel = workflow.name || workflow.template || wfId;
      const steps = Array.isArray(workflow.steps) ? workflow.steps : [];
      const statusClass = getWfStatusClass(workflow.status);

      html += `<div class="wf-lane">`;
      html += `<div class="wf-lane-label">${escapeHtml(wfLabel)}</div>`;
      html += `<div class="wf-nodes" data-wf-id="${escapeHtml(wfId)}">`;

      if (steps.length === 0) {
        html += `<div class="wf-node ${statusClass}" data-node-id="${escapeHtml(wfId)}">`;
        html += `<div class="wf-node-title">${escapeHtml(wfLabel)}</div>`;
        html += `<div class="wf-node-status">${escapeHtml(workflow.status || "no steps")}</div>`;
        html += `</div>`;
      } else {
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          const stepId = step.id || step.stepId || `step-${i}`;
          const stepLabel = step.name || step.instruction || `Step ${i + 1}`;
          const stepStatus = step.status || "pending";
          const stepClass = getWfStatusClass(stepStatus);
          const selected = wfData.selectedNodeId === stepId ? " is-selected" : "";

          if (i > 0) html += '<span class="wf-connector">→</span>';
          html += `<div class="wf-node ${stepClass}${selected}" data-node-id="${escapeHtml(stepId)}" data-wf-id="${escapeHtml(wfId)}" draggable="true">`;
          html += `<div class="wf-node-title">${escapeHtml(stepLabel.length > 30 ? stepLabel.slice(0, 30) + "…" : stepLabel)}</div>`;
          html += `<div class="wf-node-status">${escapeHtml(stepStatus)}</div>`;
          html += `</div>`;
        }
      }
      html += `</div></div>`;
    }

    el.wfCanvas.innerHTML = html;
    wireWfNodeEvents();
    logLine(`[workflow] loaded ${workflows.length} workflow(s)`, "info");
  } catch (error) {
    el.wfCanvas.innerHTML = `<div class="wf-empty">Error loading workflows: ${escapeHtml(String(error?.message || error))}</div>`;
    logLine(`[workflow] load error: ${error?.message || error}`, "error");
  }
}

function getWfStatusClass(status) {
  if (!status) return "";
  const s = String(status).toLowerCase();
  if (s === "running" || s === "in_progress") return "is-running";
  if (s === "completed" || s === "done" || s === "approved") return "is-done";
  if (s === "failed" || s === "rejected") return "is-failed";
  return "";
}

function wireWfNodeEvents() {
  if (!el.wfCanvas) return;

  // Click to select
  el.wfCanvas.addEventListener("click", (event) => {
    const node = event.target.closest(".wf-node");
    if (!node) return;
    el.wfCanvas.querySelectorAll(".wf-node.is-selected").forEach((n) => n.classList.remove("is-selected"));
    node.classList.add("is-selected");
    wfData.selectedNodeId = node.dataset.nodeId;
    logLine(`[workflow] selected node=${node.dataset.nodeId}`, "info");
  });

  // Drag and drop reorder
  let dragNode = null;
  el.wfCanvas.addEventListener("dragstart", (event) => {
    dragNode = event.target.closest(".wf-node");
    if (dragNode) {
      event.dataTransfer.effectAllowed = "move";
      dragNode.style.opacity = "0.4";
    }
  });
  el.wfCanvas.addEventListener("dragover", (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  });
  el.wfCanvas.addEventListener("drop", (event) => {
    event.preventDefault();
    const targetNode = event.target.closest(".wf-node");
    if (!dragNode || !targetNode || dragNode === targetNode) return;
    const container = targetNode.closest(".wf-nodes");
    if (!container) return;
    const nodes = Array.from(container.querySelectorAll(".wf-node"));
    const dragIdx = nodes.indexOf(dragNode);
    const dropIdx = nodes.indexOf(targetNode);
    if (dragIdx < 0 || dropIdx < 0) return;
    if (dragIdx < dropIdx) {
      container.insertBefore(dragNode, targetNode.nextSibling);
    } else {
      container.insertBefore(dragNode, targetNode);
    }
    logLine(`[workflow] reordered node=${dragNode.dataset.nodeId} to position ${dropIdx}`, "info");
  });
  el.wfCanvas.addEventListener("dragend", () => {
    if (dragNode) dragNode.style.opacity = "";
    dragNode = null;
  });
}

async function createWorkflowFromDock() {
  try {
    const template = getSettingValue("workflow.template") || "intake";
    const providerPreference = getSettingValue("workflow.provider") || "openai";
    const now = new Date().toISOString().slice(0, 16).replace("T", " ");
    const objective = template === "analysis"
      ? "Compile findings and prep review package."
      : "Summarize context, draft outputs, and route through review.";
    const body = {
      title: `Studio ${template} workflow ${now}`,
      objective,
      providerPreference,
      contextItems: [
        {
          title: "Studio shell context",
          body: "Created from shell workflow dock.",
          sourceType: "manual",
        },
      ],
    };
    await postJson("/workflows", body);
    notifyInfo("Workflow created.");
    logLine(`[workflow] created template=${template}`, "info");
    void renderWorkflowGraph();
  } catch (error) {
    notifyError("Failed to create workflow: " + (error?.message || error));
    logLine(`[workflow] create error: ${error?.message || error}`, "error");
  }
}
