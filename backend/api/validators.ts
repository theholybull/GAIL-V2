import type {
  AddListItemInput,
  BuildScriptRunInput,
  BuildScreenshotAnalyzeInput,
  BuildScreenshotCaptureInput,
  BuildStepApprovalInput,
  BuildStepSubmissionInput,
  CreateCommandMappingInput,
  CreateFeatureBacklogInput,
  CompletePairingInput,
  ResolveControlIntentInput,
  CreateConversationMessageInput,
  CreateConversationSessionInput,
  CreateCartItemInput,
  ExecuteCommandInput,
  CreateListInput,
  CreateMemoryEntryInput,
  ImportDocumentsInput,
  UpdateClientRuntimeSettingsInput,
  UpdateDeviceDisplayProfilesInput,
  CreateNoteInput,
  CreatePartRecordInput,
  CreateProjectInput,
  CreateReminderInput,
  CreateTaskInput,
  CreateWorkflowInput,
  PlanWorkflowInput,
  VoiceSpeakInput,
  VoiceTranscribeInput,
  UpdateAvatarVoiceProfileInput,
  UpdateVoiceSettingsInput,
  UpdateOpenAiConfigInput,
  UpdateLocalLlmConfigInput,
  UpdateCartItemInput,
  UpdateListInput,
  UpdateListItemInput,
  UpdateMemoryEntryInput,
  UpdateNoteInput,
  UpdatePartRecordInput,
  UpdateProjectInput,
  UpdateReminderInput,
  UpdateTaskInput,
  UpdateWorkflowInput,
  UpdateWorkflowStepInput,
  UpdateFeatureBacklogInput,
  PromoteFeatureBacklogInput,
} from "../../shared/contracts/index";
import type { VoiceRuntimeConfig } from "../../shared/contracts/index";
import {
  PART_SOURCE_TYPES,
  PART_STATUSES,
  PRIORITY_LEVELS,
  REMINDER_STATUSES,
  TASK_STATUSES,
  WORKFLOW_STATUSES,
  WORKFLOW_STEP_STATUSES,
} from "../../shared/contracts/index";
import { HttpError } from "./http-error";

type BodyRecord = Record<string, unknown>;

export interface RunExportInput {
  runner: "avatar-assets" | "playcanvas-pipeline";
  runtimeProfile: "high" | "medium" | "low";
  includeReview?: boolean;
}

export interface AnimationWorkbenchItemApiInput {
  id: string;
  label: string;
  sourcePath: string;
  sourceType: string;
  category?: string;
  slot?: string;
  gapAfterFrames?: number;
}

export interface UpsertAnimationWorkbenchCollectionApiInput {
  name: string;
  type: "action_sequence" | "clothing_set" | "item_set";
  avatarId?: string;
  avatarSystem?: string;
  wardrobePresetId?: string;
  blendPath?: string;
  outputBlendPath?: string;
  armatureName?: string;
  runtimeProfile?: "high" | "medium" | "low";
  actionPrefix?: string;
  gapFrames?: number;
  notes?: string;
  items: AnimationWorkbenchItemApiInput[];
}

export interface RunAnimationWorkbenchJobApiInput {
  collectionId: string;
}

export interface DecideGovernanceChangeApiInput {
  reviewer: string;
  decision: "approve" | "reject";
  reason?: string;
}

export interface CreateBugReportApiInput {
  title: string;
  details?: string;
  status?: "open" | "in_progress" | "blocked" | "done";
  workspace: string;
  pageId: string;
  mode: string;
  runtimeProfile: string;
  screenshotPaths?: string[];
}

export interface UpdateBugReportApiInput {
  title?: string;
  details?: string;
  status?: "open" | "in_progress" | "blocked" | "done";
  note?: string;
}

export interface AddBugScreenshotApiInput {
  pageId?: string;
  sourcePath?: string;
  imageBase64?: string;
}

export function validateCreateProjectInput(body: unknown): CreateProjectInput {
  const record = asRecord(body);
  return {
    title: requireString(record, "title"),
    summary: optionalString(record, "summary"),
    tags: optionalStringArray(record, "tags"),
  };
}

export function validateCompletePairingInput(body: unknown): CompletePairingInput {
  const record = asRecord(body);
  const type = requireString(record, "type");
  const defaultMode = requireString(record, "defaultMode");
  const qualityTier = requireString(record, "qualityTier");
  assertIn(type, ["uconsole", "kiosk", "iphone", "watch", "web_admin", "service"], "type");
  assertIn(defaultMode, ["work", "home_shop", "private", "lightweight", "focus"], "defaultMode");
  assertIn(qualityTier, ["low", "medium", "high"], "qualityTier");

  return cleanUndefined({
    pairingCode: requireString(record, "pairingCode"),
    id: requireString(record, "id"),
    type: type as CompletePairingInput["type"],
    name: requireString(record, "name"),
    defaultMode: defaultMode as CompletePairingInput["defaultMode"],
    qualityTier: qualityTier as CompletePairingInput["qualityTier"],
    trusted: optionalBoolean(record, "trusted"),
    supportsCamera: optionalBoolean(record, "supportsCamera"),
    supportsWatchApproval: optionalBoolean(record, "supportsWatchApproval"),
    supportsRichAvatar: optionalBoolean(record, "supportsRichAvatar"),
    credentialLabel: optionalString(record, "credentialLabel"),
  });
}

export function validateCreateConversationSessionInput(body: unknown): CreateConversationSessionInput {
  const record = asRecord(body);
  const providerPreference = optionalString(record, "providerPreference");
  assertIn(providerPreference, ["openai", "local-llm"], "providerPreference");
  return cleanUndefined({
    title: optionalString(record, "title"),
    providerPreference: providerPreference as CreateConversationSessionInput["providerPreference"],
  });
}

export function validateCreateConversationMessageInput(body: unknown): CreateConversationMessageInput {
  const record = asRecord(body);
  return {
    content: requireString(record, "content"),
  };
}

export function validateCreateMemoryEntryInput(body: unknown): CreateMemoryEntryInput {
  const record = asRecord(body);
  return cleanUndefined({
    title: requireString(record, "title"),
    body: requireString(record, "body"),
    tags: optionalStringArray(record, "tags") ?? [],
    source: optionalString(record, "source"),
  });
}

export function validateImportDocumentsInput(body: unknown): ImportDocumentsInput {
  const record = asRecord(body);
  const items = record.items;
  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpError(400, "items must be a non-empty array.");
  }
  if (items.length > 100) {
    throw new HttpError(400, "items must contain at most 100 entries.");
  }

  return {
    items: items.map((entry, index) => {
      const item = asRecord(entry);
      const target = requireString(item, "target");
      assertIn(target, ["memory", "note"], `items[${index}].target`);
      return cleanUndefined({
        target: target as ImportDocumentsInput["items"][number]["target"],
        title: optionalString(item, "title"),
        body: optionalString(item, "body"),
        tags: optionalStringArray(item, "tags") ?? [],
        source: optionalString(item, "source"),
        projectId: optionalString(item, "projectId"),
        fileName: optionalString(item, "fileName"),
        mimeType: optionalString(item, "mimeType"),
        fileBase64: optionalString(item, "fileBase64"),
        archiveOriginal: optionalBoolean(item, "archiveOriginal"),
      });
    }),
  };
}

export function validateUpdateMemoryEntryInput(body: unknown): UpdateMemoryEntryInput {
  const record = asRecord(body);
  ensureNonEmptyPatch(record);
  return cleanUndefined({
    title: optionalString(record, "title"),
    body: optionalString(record, "body"),
    tags: optionalStringArray(record, "tags"),
    source: optionalString(record, "source"),
  });
}

export function validateExecuteCommandInput(body: unknown): ExecuteCommandInput {
  const record = asRecord(body);
  return {
    phrase: requireString(record, "phrase"),
  };
}

export function validateCreateCommandMappingInput(body: unknown): CreateCommandMappingInput {
  const record = asRecord(body);
  return {
    commandKey: requireString(record, "commandKey"),
    phrase: requireString(record, "phrase"),
  };
}

export function validateCreateFeatureBacklogInput(body: unknown): CreateFeatureBacklogInput {
  const record = asRecord(body);
  const source = requireString(record, "source");
  const stageTarget = requireString(record, "stageTarget");
  const priority = requireString(record, "priority");
  assertIn(source, ["voice", "typed"], "source");
  assertIn(stageTarget, ["current_build", "next_round", "future_upgrade"], "stageTarget");
  assertIn(priority, ["low", "normal", "high", "critical"], "priority");
  return {
    title: requireString(record, "title"),
    details: requireString(record, "details"),
    source: source as CreateFeatureBacklogInput["source"],
    stageTarget: stageTarget as CreateFeatureBacklogInput["stageTarget"],
    priority: priority as CreateFeatureBacklogInput["priority"],
    capturedBy: requireString(record, "capturedBy"),
  };
}

export function validateUpdateFeatureBacklogInput(body: unknown): UpdateFeatureBacklogInput {
  const record = asRecord(body);
  ensureNonEmptyPatch(record);
  const stageTarget = optionalString(record, "stageTarget");
  const priority = optionalString(record, "priority");
  const status = optionalString(record, "status");
  assertIn(stageTarget, ["current_build", "next_round", "future_upgrade"], "stageTarget");
  assertIn(priority, ["low", "normal", "high", "critical"], "priority");
  assertIn(status, ["pending", "planned", "in_progress", "done", "deferred"], "status");
  return cleanUndefined({
    title: optionalString(record, "title"),
    details: optionalString(record, "details"),
    stageTarget: stageTarget as UpdateFeatureBacklogInput["stageTarget"],
    priority: priority as UpdateFeatureBacklogInput["priority"],
    status: status as UpdateFeatureBacklogInput["status"],
  });
}

export function validatePromoteFeatureBacklogInput(body: unknown): PromoteFeatureBacklogInput {
  const record = asRecord(body);
  const target = requireString(record, "target");
  assertIn(target, ["task", "workflow", "change_request"], "target");
  return cleanUndefined({
    target: target as PromoteFeatureBacklogInput["target"],
    reviewer: optionalString(record, "reviewer"),
  });
}

export function validateResolveControlIntentInput(body: unknown): ResolveControlIntentInput {
  const record = asRecord(body);
  const source = optionalString(record, "source");
  assertIn(source, ["typed", "voice"], "source");
  return cleanUndefined({
    text: requireString(record, "text"),
    source: source as ResolveControlIntentInput["source"],
    autoPlan: optionalBoolean(record, "autoPlan"),
  });
}

export function validateRunExportInput(body: unknown): RunExportInput {
  const record = asRecord(body);
  const runner = requireString(record, "runner");
  const runtimeProfile = requireString(record, "runtimeProfile");
  assertIn(runner, ["avatar-assets", "playcanvas-pipeline"], "runner");
  assertIn(runtimeProfile, ["high", "medium", "low"], "runtimeProfile");
  return cleanUndefined({
    runner: runner as RunExportInput["runner"],
    runtimeProfile: runtimeProfile as RunExportInput["runtimeProfile"],
    includeReview: optionalBoolean(record, "includeReview"),
  });
}

export function validateUpsertAnimationWorkbenchCollectionInput(body: unknown): UpsertAnimationWorkbenchCollectionApiInput {
  const record = asRecord(body);
  const type = requireString(record, "type");
  const runtimeProfile = optionalString(record, "runtimeProfile");
  const items = record.items;

  assertIn(type, ["action_sequence", "clothing_set", "item_set"], "type");
  assertIn(runtimeProfile, ["high", "medium", "low"], "runtimeProfile");

  if (!Array.isArray(items)) {
    throw new HttpError(400, "items must be an array.");
  }

  return cleanUndefined({
    name: requireString(record, "name"),
    type: type as UpsertAnimationWorkbenchCollectionApiInput["type"],
    avatarId: optionalString(record, "avatarId"),
    avatarSystem: optionalString(record, "avatarSystem"),
    wardrobePresetId: optionalString(record, "wardrobePresetId"),
    blendPath: optionalString(record, "blendPath"),
    outputBlendPath: optionalString(record, "outputBlendPath"),
    armatureName: optionalString(record, "armatureName"),
    runtimeProfile: runtimeProfile as UpsertAnimationWorkbenchCollectionApiInput["runtimeProfile"],
    actionPrefix: optionalString(record, "actionPrefix"),
    gapFrames: optionalNumber(record, "gapFrames"),
    notes: optionalString(record, "notes"),
    items: items.map((entry, index) => {
      const item = asRecord(entry);
      return cleanUndefined({
        id: requireString(item, "id"),
        label: requireString(item, "label"),
        sourcePath: requireString(item, "sourcePath"),
        sourceType: requireString(item, "sourceType"),
        category: optionalString(item, "category"),
        slot: optionalString(item, "slot"),
        gapAfterFrames: optionalNumber(item, "gapAfterFrames"),
      } satisfies AnimationWorkbenchItemApiInput);
    }),
  });
}

export function validateRunAnimationWorkbenchJobInput(body: unknown): RunAnimationWorkbenchJobApiInput {
  const record = asRecord(body);
  return {
    collectionId: requireString(record, "collectionId"),
  };
}

export function validateUpdateVoiceSettingsInput(body: unknown): UpdateVoiceSettingsInput {
  const record = asRecord(body);
  ensureNonEmptyPatch(record);
  const mode = optionalString(record, "mode");
  assertIn(mode, ["push_to_talk", "wake_word", "always_listening", "typed"], "mode");
  const preferredTtsEngine = optionalString(record, "preferredTtsEngine");
  const fallbackTtsEngine = optionalString(record, "fallbackTtsEngine");
  assertIn(preferredTtsEngine, ["browser-speech-synthesis", "openai-gpt-4o-mini-tts", "openai-tts-1", "openai-tts-1-hd"], "preferredTtsEngine");
  assertIn(fallbackTtsEngine, ["browser-speech-synthesis"], "fallbackTtsEngine");
  const silenceTimeoutMs = optionalNumber(record, "silenceTimeoutMs");
  if (silenceTimeoutMs !== undefined && (silenceTimeoutMs < 500 || silenceTimeoutMs > 15000)) {
    throw new HttpError(400, "silenceTimeoutMs must be between 500 and 15000.");
  }

  return cleanUndefined({
    mode: mode as UpdateVoiceSettingsInput["mode"],
    wakeWord: optionalString(record, "wakeWord"),
    silenceTimeoutMs,
    autoResumeAfterResponse: optionalBoolean(record, "autoResumeAfterResponse"),
    preferredTtsEngine: preferredTtsEngine as UpdateVoiceSettingsInput["preferredTtsEngine"],
    fallbackTtsEngine: fallbackTtsEngine as UpdateVoiceSettingsInput["fallbackTtsEngine"],
    preferLocalBrowserVoice: optionalBoolean(record, "preferLocalBrowserVoice"),
    openAiVoice: optionalString(record, "openAiVoice"),
    openAiInstructions: optionalString(record, "openAiInstructions"),
    browserVoiceName: optionalString(record, "browserVoiceName"),
    runtime: optionalVoiceRuntimeConfig(record, "runtime"),
  });
}

export function validateUpdateAvatarVoiceProfileInput(body: unknown): UpdateAvatarVoiceProfileInput {
  const record = asRecord(body);
  ensureNonEmptyPatch(record);
  return cleanUndefined({
    openAiVoice: optionalString(record, "openAiVoice"),
    openAiInstructions: optionalString(record, "openAiInstructions"),
    browserVoiceName: optionalString(record, "browserVoiceName"),
  });
}

export function validateUpdateClientRuntimeSettingsInput(body: unknown): UpdateClientRuntimeSettingsInput {
  const record = asRecord(body);
  ensureNonEmptyPatch(record);
  const activeAvatarSystem = optionalString(record, "activeAvatarSystem");
  const displayInputMode = optionalString(record, "displayInputMode");
  const bodyMorphControlsRecord = optionalNestedRecord(record, "bodyMorphControls");
  const bodyMorphOverridesRecord = bodyMorphControlsRecord
    ? optionalNestedRecord(bodyMorphControlsRecord, "overrides")
    : undefined;
  const bodyMorphOverrides = bodyMorphOverridesRecord
    ? Object.fromEntries(
      Object.entries(bodyMorphOverridesRecord).map(([key, rawValue]) => {
        if (typeof rawValue !== "number" || !Number.isFinite(rawValue)) {
          throw new HttpError(400, `bodyMorphControls.overrides.${key} must be a finite number.`);
        }
        return [key, Math.max(0, Math.min(1, rawValue))];
      }),
    )
    : undefined;
  assertIn(activeAvatarSystem, ["legacy_fallback", "handoff_20260330", "gail_primary"], "activeAvatarSystem");
  assertIn(displayInputMode, ["wake_word", "always_listening", "typed"], "displayInputMode");
  return cleanUndefined({
    activeAvatarSystem: activeAvatarSystem as UpdateClientRuntimeSettingsInput["activeAvatarSystem"],
    displayInputMode: displayInputMode as UpdateClientRuntimeSettingsInput["displayInputMode"],
    bodyMorphControls: bodyMorphControlsRecord
      ? cleanUndefined({
        enabledDuringMotion: optionalBoolean(bodyMorphControlsRecord, "enabledDuringMotion"),
        overrides: bodyMorphOverrides,
      }) as UpdateClientRuntimeSettingsInput["bodyMorphControls"]
      : undefined,
  });
}

export function validateUpdateDeviceDisplayProfilesInput(body: unknown): UpdateDeviceDisplayProfilesInput {
  const record = asRecord(body);
  ensureNonEmptyPatch(record);
  const selectedDeviceId = optionalString(record, "selectedDeviceId");
  const profilesRaw = record.profiles;
  let profiles: UpdateDeviceDisplayProfilesInput["profiles"] | undefined;
  if (profilesRaw !== undefined) {
    if (!Array.isArray(profilesRaw)) {
      throw new HttpError(400, "profiles must be an array.");
    }
    profiles = profilesRaw.map((entry, index) => {
      const profile = asRecord(entry);
      const display = asRecord(profile.display);
      const mesh = asRecord(profile.mesh);
      const staging = asRecord(profile.staging);
      const avatarTransform = asRecord(staging.avatarTransform);
      const cameraTransform = asRecord(staging.cameraTransform);
      return {
        id: requireString(profile, "id"),
        label: requireString(profile, "label"),
        display: {
          width: requireNumber(display, "width", `profiles[${index}].display.width`),
          height: requireNumber(display, "height", `profiles[${index}].display.height`),
          renderScale: requireNumber(display, "renderScale", `profiles[${index}].display.renderScale`),
          aspectRatio: requireString(display, "aspectRatio"),
          safeFrame: requireNumber(display, "safeFrame", `profiles[${index}].display.safeFrame`),
        },
        mesh: {
          bodyQuality: requireQuality(mesh, "bodyQuality", index),
          clothingQuality: requireQuality(mesh, "clothingQuality", index),
          hairQuality: requireQuality(mesh, "hairQuality", index),
          animationLod: requireQuality(mesh, "animationLod", index),
        },
        staging: {
          sceneId: requireString(staging, "sceneId"),
          avatarTransform: {
            position: requireNumberTuple(avatarTransform, "position", `profiles[${index}].staging.avatarTransform.position`),
            rotation: optionalNumberTuple(avatarTransform, "rotation", `profiles[${index}].staging.avatarTransform.rotation`),
            scale: optionalNumberTuple(avatarTransform, "scale", `profiles[${index}].staging.avatarTransform.scale`),
          },
          cameraTransform: {
            position: requireNumberTuple(cameraTransform, "position", `profiles[${index}].staging.cameraTransform.position`),
            target: optionalNumberTuple(cameraTransform, "target", `profiles[${index}].staging.cameraTransform.target`),
          },
        },
      };
    });
  }

  return cleanUndefined({
    selectedDeviceId,
    profiles,
  });
}

export function validateUpdateOpenAiConfigInput(body: unknown): UpdateOpenAiConfigInput {
  const record = asRecord(body);
  ensureNonEmptyPatch(record);
  const apiKey = optionalString(record, "apiKey");
  const clear = optionalBoolean(record, "clear");
  if (apiKey !== undefined && apiKey.trim().length === 0) {
    throw new HttpError(400, "apiKey must not be empty when provided.");
  }
  return cleanUndefined({
    apiKey,
    clear,
  });
}

export function validateUpdateLocalLlmConfigInput(body: unknown): UpdateLocalLlmConfigInput {
  const record = asRecord(body);
  ensureNonEmptyPatch(record);
  const defaultPrivatePersona = optionalString(record, "defaultPrivatePersona");
  const activePrivatePersona = optionalString(record, "activePrivatePersona");
  assertIn(defaultPrivatePersona, ["normal", "private_counselor", "private_girlfriend", "private_hangout"], "defaultPrivatePersona");
  assertIn(activePrivatePersona, ["normal", "private_counselor", "private_girlfriend", "private_hangout"], "activePrivatePersona");
  const timeoutMs = optionalNumber(record, "timeoutMs");
  if (timeoutMs !== undefined && (timeoutMs < 1000 || timeoutMs > 300000)) {
    throw new HttpError(400, "timeoutMs must be between 1000 and 300000.");
  }
  return cleanUndefined({
    baseUrl: optionalString(record, "baseUrl"),
    model: optionalString(record, "model"),
    timeoutMs,
    keepAlive: optionalString(record, "keepAlive"),
    normalSystemPrompt: optionalString(record, "normalSystemPrompt"),
    defaultPrivatePersona: defaultPrivatePersona as UpdateLocalLlmConfigInput["defaultPrivatePersona"],
    activePrivatePersona: activePrivatePersona as UpdateLocalLlmConfigInput["activePrivatePersona"],
    counselorModel: optionalString(record, "counselorModel"),
    girlfriendModel: optionalString(record, "girlfriendModel"),
    hangoutModel: optionalString(record, "hangoutModel"),
    counselorSystemPrompt: optionalString(record, "counselorSystemPrompt"),
    girlfriendSystemPrompt: optionalString(record, "girlfriendSystemPrompt"),
    hangoutSystemPrompt: optionalString(record, "hangoutSystemPrompt"),
  });
}

export function validateVoiceSpeakInput(body: unknown): VoiceSpeakInput {
  const record = asRecord(body);
  const engineOverride = optionalString(record, "engineOverride");
  assertIn(engineOverride, ["browser-speech-synthesis", "openai-gpt-4o-mini-tts", "openai-tts-1", "openai-tts-1-hd"], "engineOverride");
  return cleanUndefined({
    text: requireString(record, "text"),
    engineOverride: engineOverride as VoiceSpeakInput["engineOverride"],
    voiceOverride: optionalString(record, "voiceOverride"),
    instructionsOverride: optionalString(record, "instructionsOverride"),
  });
}

export function validateVoiceTranscribeInput(body: unknown): VoiceTranscribeInput {
  const record = asRecord(body);
  const mimeType = requireString(record, "mimeType").toLowerCase().trim();
  const baseMimeType = mimeType.split(";")[0]?.trim() || mimeType;
  assertIn(baseMimeType, ["audio/webm", "audio/mp4", "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/aac", "audio/ogg"], "mimeType");
  return cleanUndefined({
    audioBase64: requireString(record, "audioBase64"),
    mimeType,
    language: optionalString(record, "language"),
    prompt: optionalString(record, "prompt"),
  });
}

export function validateCreateWorkflowInput(body: unknown): CreateWorkflowInput {
  const record = asRecord(body);
  const providerPreference = optionalString(record, "providerPreference");
  assertIn(providerPreference, ["openai", "local-llm"], "providerPreference");
  return cleanUndefined({
    title: requireString(record, "title"),
    objective: requireString(record, "objective"),
    projectId: optionalString(record, "projectId"),
    providerPreference: providerPreference as CreateWorkflowInput["providerPreference"],
    contextItems: optionalWorkflowContextItems(record, "contextItems"),
  });
}

export function validateCreateBugReportInput(body: unknown): CreateBugReportApiInput {
  const record = asRecord(body);
  const status = optionalString(record, "status");
  assertIn(status, ["open", "in_progress", "blocked", "done"], "status");
  return cleanUndefined({
    title: requireString(record, "title"),
    details: optionalString(record, "details"),
    status: status as CreateBugReportApiInput["status"],
    workspace: requireString(record, "workspace"),
    pageId: requireString(record, "pageId"),
    mode: requireString(record, "mode"),
    runtimeProfile: requireString(record, "runtimeProfile"),
    screenshotPaths: optionalStringArray(record, "screenshotPaths"),
  });
}

export function validateUpdateBugReportInput(body: unknown): UpdateBugReportApiInput {
  const record = asRecord(body);
  ensureNonEmptyPatch(record);
  const status = optionalString(record, "status");
  assertIn(status, ["open", "in_progress", "blocked", "done"], "status");
  return cleanUndefined({
    title: optionalString(record, "title"),
    details: optionalString(record, "details"),
    status: status as UpdateBugReportApiInput["status"],
    note: optionalString(record, "note"),
  });
}

export function validateAddBugScreenshotInput(body: unknown): AddBugScreenshotApiInput {
  if (body === undefined || body === null) {
    return {};
  }
  const record = asRecord(body);
  return cleanUndefined({
    pageId: optionalString(record, "pageId"),
    sourcePath: optionalString(record, "sourcePath"),
    imageBase64: optionalString(record, "imageBase64"),
  });
}

export function validateUpdateWorkflowInput(body: unknown): UpdateWorkflowInput {
  const record = asRecord(body);
  ensureNonEmptyPatch(record);
  const providerPreference = optionalString(record, "providerPreference");
  const status = optionalString(record, "status");
  assertIn(providerPreference, ["openai", "local-llm"], "providerPreference");
  assertIn(status, WORKFLOW_STATUSES, "status");
  return cleanUndefined({
    title: optionalString(record, "title"),
    objective: optionalString(record, "objective"),
    projectId: optionalString(record, "projectId"),
    providerPreference: providerPreference as UpdateWorkflowInput["providerPreference"],
    status: status as UpdateWorkflowInput["status"],
    contextItems: optionalWorkflowContextItems(record, "contextItems"),
  });
}

export function validatePlanWorkflowInput(body: unknown): PlanWorkflowInput {
  if (body === undefined || body === null) {
    return {};
  }
  const record = asRecord(body);
  return cleanUndefined({
    replaceExistingSteps: optionalBoolean(record, "replaceExistingSteps"),
  });
}

export function validateUpdateWorkflowStepInput(body: unknown): UpdateWorkflowStepInput {
  const record = asRecord(body);
  ensureNonEmptyPatch(record);
  const status = optionalString(record, "status");
  const assignee = optionalString(record, "assignee");
  assertIn(status, WORKFLOW_STEP_STATUSES, "status");
  assertIn(assignee, ["ai", "codex", "human"], "assignee");
  return cleanUndefined({
    title: optionalString(record, "title"),
    instruction: optionalString(record, "instruction"),
    status: status as UpdateWorkflowStepInput["status"],
    assignee: assignee as UpdateWorkflowStepInput["assignee"],
    requiresReview: optionalBoolean(record, "requiresReview"),
  });
}

export function validateBuildStepSubmissionInput(body: unknown): BuildStepSubmissionInput {
  const record = asRecord(body);
  return cleanUndefined({
    summary: requireString(record, "summary"),
    artifactPaths: optionalStringArray(record, "artifactPaths"),
  });
}

export function validateBuildStepApprovalInput(body: unknown): BuildStepApprovalInput {
  const record = asRecord(body);
  const decision = requireString(record, "decision");
  assertIn(decision, ["approve", "request_changes", "block"], "decision");
  return cleanUndefined({
    decision: decision as BuildStepApprovalInput["decision"],
    notes: optionalString(record, "notes"),
    requireScreenshotEvidence: optionalBoolean(record, "requireScreenshotEvidence"),
  });
}

export function validateBuildScreenshotCaptureInput(body: unknown): BuildScreenshotCaptureInput {
  const record = asRecord(body);
  return cleanUndefined({
    feature: requireString(record, "feature"),
    sourcePath: optionalString(record, "sourcePath"),
    label: optionalString(record, "label"),
    stepId: optionalString(record, "stepId"),
  });
}

export function validateBuildScreenshotAnalyzeInput(body: unknown): BuildScreenshotAnalyzeInput {
  const record = asRecord(body);
  return cleanUndefined({
    feature: requireString(record, "feature"),
    screenshotPath: requireString(record, "screenshotPath"),
    stepId: optionalString(record, "stepId"),
  });
}

export function validateBuildScriptRunInput(body: unknown): BuildScriptRunInput {
  const record = asRecord(body);
  return cleanUndefined({
    id: requireString(record, "id"),
    args: optionalStringArray(record, "args"),
  });
}

export function validateDecideGovernanceChangeInput(body: unknown): DecideGovernanceChangeApiInput {
  const record = asRecord(body);
  const decision = requireString(record, "decision");
  assertIn(decision, ["approve", "reject"], "decision");
  return cleanUndefined({
    reviewer: requireString(record, "reviewer"),
    decision: decision as DecideGovernanceChangeApiInput["decision"],
    reason: optionalString(record, "reason"),
  });
}

export function validateUpdateProjectInput(body: unknown): UpdateProjectInput {
  const record = asRecord(body);
  ensureNonEmptyPatch(record);
  const status = optionalString(record, "status");
  if (status !== undefined && !["active", "paused", "archived"].includes(status)) {
    throw new HttpError(400, "status must be active, paused, or archived.");
  }

  return cleanUndefined({
    title: optionalString(record, "title"),
    summary: optionalString(record, "summary"),
    status: status as UpdateProjectInput["status"] | undefined,
    tags: optionalStringArray(record, "tags"),
  });
}

export function validateCreateNoteInput(body: unknown): CreateNoteInput {
  const record = asRecord(body);
  return {
    title: requireString(record, "title"),
    body: requireString(record, "body"),
    projectId: optionalString(record, "projectId"),
    privateOnly: optionalBoolean(record, "privateOnly"),
  };
}

export function validateUpdateNoteInput(body: unknown): UpdateNoteInput {
  const record = asRecord(body);
  ensureNonEmptyPatch(record);
  return cleanUndefined({
    title: optionalString(record, "title"),
    body: optionalString(record, "body"),
    projectId: optionalString(record, "projectId"),
    privateOnly: optionalBoolean(record, "privateOnly"),
  });
}

export function validateCreateListInput(body: unknown): CreateListInput {
  const record = asRecord(body);
  return {
    title: requireString(record, "title"),
    description: optionalString(record, "description"),
  };
}

export function validateUpdateListInput(body: unknown): UpdateListInput {
  const record = asRecord(body);
  ensureNonEmptyPatch(record);
  return cleanUndefined({
    title: optionalString(record, "title"),
    description: optionalString(record, "description"),
    archived: optionalBoolean(record, "archived"),
  });
}

export function validateAddListItemInput(body: unknown): AddListItemInput {
  const record = asRecord(body);
  return {
    text: requireString(record, "text"),
  };
}

export function validateUpdateListItemInput(body: unknown): UpdateListItemInput {
  const record = asRecord(body);
  ensureNonEmptyPatch(record);
  return cleanUndefined({
    text: optionalString(record, "text"),
    completed: optionalBoolean(record, "completed"),
  });
}

export function validateCreateTaskInput(body: unknown): CreateTaskInput {
  const record = asRecord(body);
  const priority = optionalString(record, "priority");
  const status = optionalString(record, "status");
  assertIn(priority, PRIORITY_LEVELS, "priority");
  assertIn(status, TASK_STATUSES, "status");

  return {
    title: requireString(record, "title"),
    details: optionalString(record, "details"),
    projectId: optionalString(record, "projectId"),
    dueAt: optionalString(record, "dueAt"),
    sourceThreadId: optionalString(record, "sourceThreadId"),
    priority: priority as CreateTaskInput["priority"],
    status: status as CreateTaskInput["status"],
  };
}

export function validateUpdateTaskInput(body: unknown): UpdateTaskInput {
  const record = asRecord(body);
  ensureNonEmptyPatch(record);
  const priority = optionalString(record, "priority");
  const status = optionalString(record, "status");
  assertIn(priority, PRIORITY_LEVELS, "priority");
  assertIn(status, TASK_STATUSES, "status");

  return cleanUndefined({
    title: optionalString(record, "title"),
    details: optionalString(record, "details"),
    projectId: optionalString(record, "projectId"),
    dueAt: optionalString(record, "dueAt"),
    sourceThreadId: optionalString(record, "sourceThreadId"),
    priority: priority as UpdateTaskInput["priority"],
    status: status as UpdateTaskInput["status"],
  });
}

export function validateCreateReminderInput(body: unknown): CreateReminderInput {
  const record = asRecord(body);
  const status = optionalString(record, "status");
  assertIn(status, REMINDER_STATUSES, "status");
  return {
    title: requireString(record, "title"),
    remindAt: requireString(record, "remindAt"),
    details: optionalString(record, "details"),
    linkedTaskId: optionalString(record, "linkedTaskId"),
    status: status as CreateReminderInput["status"],
  };
}

export function validateUpdateReminderInput(body: unknown): UpdateReminderInput {
  const record = asRecord(body);
  ensureNonEmptyPatch(record);
  const status = optionalString(record, "status");
  assertIn(status, REMINDER_STATUSES, "status");
  return cleanUndefined({
    title: optionalString(record, "title"),
    remindAt: optionalString(record, "remindAt"),
    details: optionalString(record, "details"),
    linkedTaskId: optionalString(record, "linkedTaskId"),
    status: status as UpdateReminderInput["status"],
  });
}

export function validateCreatePartRecordInput(body: unknown): CreatePartRecordInput {
  const record = asRecord(body);
  const sourceType = requireString(record, "sourceType");
  const status = optionalString(record, "status");
  assertIn(sourceType, PART_SOURCE_TYPES, "sourceType");
  assertIn(status, PART_STATUSES, "status");
  return {
    title: requireString(record, "title"),
    sourceType: sourceType as CreatePartRecordInput["sourceType"],
    projectId: optionalString(record, "projectId"),
    partNumber: optionalString(record, "partNumber"),
    sourceUrl: optionalString(record, "sourceUrl"),
    compatibilityNotes: optionalString(record, "compatibilityNotes"),
    status: status as CreatePartRecordInput["status"],
  };
}

export function validateUpdatePartRecordInput(body: unknown): UpdatePartRecordInput {
  const record = asRecord(body);
  ensureNonEmptyPatch(record);
  const sourceType = optionalString(record, "sourceType");
  const status = optionalString(record, "status");
  assertIn(sourceType, PART_SOURCE_TYPES, "sourceType");
  assertIn(status, PART_STATUSES, "status");
  return cleanUndefined({
    title: optionalString(record, "title"),
    sourceType: sourceType as UpdatePartRecordInput["sourceType"],
    projectId: optionalString(record, "projectId"),
    partNumber: optionalString(record, "partNumber"),
    sourceUrl: optionalString(record, "sourceUrl"),
    compatibilityNotes: optionalString(record, "compatibilityNotes"),
    status: status as UpdatePartRecordInput["status"],
  });
}

export function validateCreateCartItemInput(body: unknown): CreateCartItemInput {
  const record = asRecord(body);
  return {
    title: requireString(record, "title"),
    sourceUrl: requireString(record, "sourceUrl"),
    quantity: optionalNumber(record, "quantity"),
    partId: optionalString(record, "partId"),
    notes: optionalString(record, "notes"),
  };
}

export function validateUpdateCartItemInput(body: unknown): UpdateCartItemInput {
  const record = asRecord(body);
  ensureNonEmptyPatch(record);
  const status = optionalString(record, "status");
  assertIn(status, ["pending_review", "saved_for_later", "approved", "removed"], "status");
  return cleanUndefined({
    title: optionalString(record, "title"),
    sourceUrl: optionalString(record, "sourceUrl"),
    quantity: optionalNumber(record, "quantity"),
    partId: optionalString(record, "partId"),
    notes: optionalString(record, "notes"),
    status: status as UpdateCartItemInput["status"],
  });
}

function asRecord(body: unknown): BodyRecord {
  if (body === undefined || body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "Request body must be a JSON object.");
  }

  return body as BodyRecord;
}

function ensureNonEmptyPatch(record: BodyRecord): void {
  if (Object.keys(record).length === 0) {
    throw new HttpError(400, "Patch body must include at least one field.");
  }
}

function requireString(record: BodyRecord, key: string): string {
  const value = record[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HttpError(400, `${key} must be a non-empty string.`);
  }

  return value;
}

function optionalString(record: BodyRecord, key: string): string | undefined {
  const value = record[key];
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new HttpError(400, `${key} must be a string.`);
  }

  return value;
}

function optionalBoolean(record: BodyRecord, key: string): boolean | undefined {
  const value = record[key];
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "boolean") {
    throw new HttpError(400, `${key} must be a boolean.`);
  }

  return value;
}

function optionalNumber(record: BodyRecord, key: string): number | undefined {
  const value = record[key];
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new HttpError(400, `${key} must be a finite number.`);
  }

  return value;
}

function requireNumber(record: BodyRecord, key: string, label = key): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new HttpError(400, `${label} must be a finite number.`);
  }
  return value;
}

function requireNumberTuple(record: BodyRecord, key: string, label = key): [number, number, number] {
  const value = record[key];
  if (!Array.isArray(value) || value.length !== 3 || value.some((item) => typeof item !== "number" || !Number.isFinite(item))) {
    throw new HttpError(400, `${label} must be an array of three numbers.`);
  }
  return [value[0], value[1], value[2]];
}

function optionalNumberTuple(record: BodyRecord, key: string, label = key): [number, number, number] | undefined {
  const value = record[key];
  if (value === undefined) {
    return undefined;
  }
  if (!Array.isArray(value) || value.length !== 3 || value.some((item) => typeof item !== "number" || !Number.isFinite(item))) {
    throw new HttpError(400, `${label} must be an array of three numbers.`);
  }
  return [value[0], value[1], value[2]];
}

function requireQuality(record: BodyRecord, key: string, index: number): "low" | "medium" | "high" {
  const value = requireString(record, key);
  assertIn(value, ["low", "medium", "high"], `profiles[${index}].mesh.${key}`);
  return value as "low" | "medium" | "high";
}

function optionalStringArray(record: BodyRecord, key: string): string[] | undefined {
  const value = record[key];
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new HttpError(400, `${key} must be an array of strings.`);
  }

  return value;
}

function optionalNestedRecord(record: BodyRecord, key: string): BodyRecord | undefined {
  const value = record[key];
  if (value === undefined) {
    return undefined;
  }
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError(400, `${key} must be an object.`);
  }
  return value as BodyRecord;
}

function optionalVoiceRuntimeConfig(record: BodyRecord, key: string): VoiceRuntimeConfig | undefined {
  const runtime = optionalNestedRecord(record, key);
  if (!runtime) {
    return undefined;
  }
  const timing = optionalNestedRecord(runtime, "timing");
  const phrases = optionalNestedRecord(runtime, "phrases");
  const thinkingFillers = phrases ? optionalNestedRecord(phrases, "thinkingFillers") : undefined;
  const contextFillers = phrases ? optionalNestedRecord(phrases, "contextFillers") : undefined;
  return cleanUndefined({
    timing: timing ? cleanUndefined({
      speechCooldownMs: optionalNumber(timing, "speechCooldownMs"),
      thinkingFillerDelayMs: optionalNumber(timing, "thinkingFillerDelayMs"),
      followUpTimeoutMs: optionalNumber(timing, "followUpTimeoutMs"),
      wakeWordFollowUpTimeoutMs: optionalNumber(timing, "wakeWordFollowUpTimeoutMs"),
      defaultSubmitTimeoutMs: optionalNumber(timing, "defaultSubmitTimeoutMs"),
      followUpSubmitTimeoutMs: optionalNumber(timing, "followUpSubmitTimeoutMs"),
      wakeWordSubmitTimeoutMs: optionalNumber(timing, "wakeWordSubmitTimeoutMs"),
      minSubmitTimeoutMs: optionalNumber(timing, "minSubmitTimeoutMs"),
      maxSubmitTimeoutMs: optionalNumber(timing, "maxSubmitTimeoutMs"),
      ambientLowConfidenceThreshold: optionalNumber(timing, "ambientLowConfidenceThreshold"),
      ambientRepeatWindowMs: optionalNumber(timing, "ambientRepeatWindowMs"),
    }) : undefined,
    phrases: phrases ? cleanUndefined({
      wakeWordAliases: optionalStringArray(phrases, "wakeWordAliases"),
      wakePrefixes: optionalStringArray(phrases, "wakePrefixes"),
      wakeAcknowledgements: optionalStringArray(phrases, "wakeAcknowledgements"),
      thinkingFillers: thinkingFillers ? cleanUndefined({
        question: optionalStringArray(thinkingFillers, "question"),
        command: optionalStringArray(thinkingFillers, "command"),
        statement: optionalStringArray(thinkingFillers, "statement"),
      }) : undefined,
      contextFillers: contextFillers ? cleanUndefined({
        followUp: optionalStringArray(contextFillers, "followUp"),
        vision: optionalStringArray(contextFillers, "vision"),
        persona: optionalStringArray(contextFillers, "persona"),
        dance: optionalStringArray(contextFillers, "dance"),
        system: optionalStringArray(contextFillers, "system"),
      }) : undefined,
      conversationClosers: optionalStringArray(phrases, "conversationClosers"),
      bootGreetings: optionalStringArray(phrases, "bootGreetings"),
      ambientSingleWordAllowlist: optionalStringArray(phrases, "ambientSingleWordAllowlist"),
    }) : undefined,
  }) as VoiceRuntimeConfig;
}

function optionalWorkflowContextItems(record: BodyRecord, key: string): CreateWorkflowInput["contextItems"] | undefined {
  const value = record[key];
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new HttpError(400, `${key} must be an array.`);
  }

  return value.map((entry, index) => {
    const item = asRecord(entry);
    const sourceType = optionalString(item, "sourceType");
    assertIn(sourceType, ["manual", "memory", "note", "conversation"], `${key}[${index}].sourceType`);
    return cleanUndefined({
      title: requireString(item, "title"),
      body: requireString(item, "body"),
      sourceType: sourceType as NonNullable<CreateWorkflowInput["contextItems"]>[number]["sourceType"],
      sourceId: optionalString(item, "sourceId"),
    });
  });
}

function assertIn(value: string | undefined, allowed: readonly string[], key: string): void {
  if (value !== undefined && !allowed.includes(value)) {
    throw new HttpError(400, `${key} must be one of: ${allowed.join(", ")}.`);
  }
}

function cleanUndefined<T extends Record<string, unknown>>(record: T): T {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined),
  ) as T;
}

// ── Wardrobe preset validators ──

import type {
  CreateWardrobePresetInput,
  UpdateWardrobePresetInput,
  UpdateWardrobeActivePresetInput,
  WardrobeSlotMap,
} from "../services/wardrobe-presets-service";

const WARDROBE_SLOT_KEYS: readonly string[] = ["base", "hair", "upper", "lower", "footwear", "accessories"];

function validateSlotMap(record: BodyRecord, key: string): WardrobeSlotMap {
  const raw = record[key];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new HttpError(400, `${key} must be a JSON object with slot keys.`);
  }
  const slots = raw as Record<string, unknown>;
  const result: WardrobeSlotMap = {};
  for (const slotKey of WARDROBE_SLOT_KEYS) {
    const v = slots[slotKey];
    if (v === undefined) continue;
    if (v === null || (typeof v === "string" && v.trim().length > 0)) {
      (result as Record<string, string | null>)[slotKey] = v === null ? null : (v as string);
    } else {
      throw new HttpError(400, `slots.${slotKey} must be a non-empty string or null.`);
    }
  }
  return result;
}

export function validateSetActiveWardrobePresetInput(body: unknown): UpdateWardrobeActivePresetInput {
  const record = asRecord(body);
  return { activePresetId: requireString(record, "activePresetId") };
}

export function validateCreateWardrobePresetInput(body: unknown): CreateWardrobePresetInput {
  const record = asRecord(body);
  const persona = requireString(record, "persona");
  assertIn(persona, ["normal", "private_counselor", "private_girlfriend", "private_hangout"], "persona");
  return {
    id: requireString(record, "id"),
    name: requireString(record, "name"),
    persona,
    slots: validateSlotMap(record, "slots"),
  };
}

export function validateUpdateWardrobePresetInput(body: unknown): UpdateWardrobePresetInput {
  const record = asRecord(body);
  ensureNonEmptyPatch(record);
  const persona = optionalString(record, "persona");
  assertIn(persona, ["normal", "private_counselor", "private_girlfriend", "private_hangout"], "persona");
  const slots = record.slots !== undefined ? validateSlotMap(record, "slots") : undefined;
  return cleanUndefined({
    name: optionalString(record, "name"),
    persona,
    slots,
  });
}
