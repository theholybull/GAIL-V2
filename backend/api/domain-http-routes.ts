import type {
  AddListItemInput,
  CreateCommandMappingInput,
  CreateConversationMessageInput,
  CreateConversationSessionInput,
  CreateCartItemInput,
  CreateManagerDirectiveInput,
  ExecuteCommandInput,
  ResolveControlIntentInput,
  CreateListInput,
  CreateMemoryEntryInput,
  ImportDocumentsInput,
  UpdateClientRuntimeSettingsInput,
  CreateNoteInput,
  CreatePartRecordInput,
  CreateProjectInput,
  CreateReminderInput,
  CreateTaskInput,
  CreateWorkflowInput,
  VoiceSpeakInput,
  VoiceTranscribeInput,
  UpdateAvatarVoiceProfileInput,
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
  UpdateVoiceSettingsInput,
} from "../../shared/contracts/index";
import type { createDomainServices } from "../bootstrap";
import type { HttpRoute } from "./http-types";
import { requireTrustedRegisteredDevice } from "./device-trust-policy";
import { requireCapability } from "./device-policy";
import {
  validateRegisterDeviceInput,
  validateUpdateDeviceSensitiveAccessInput,
  validateUpdateDeviceTrustInput,
} from "./device-validators";
import { enforceNonPrivateSensitiveAction, enforceSensitiveAuthPolicy, enforceWritePolicy } from "./policy";
import {
  validateCreateApprovalRequestInput,
  validateResolveApprovalRequestInput,
} from "./approval-validators";
import { requirePrivateMode } from "./private-session-policy";
import { validateCreatePrivateSessionNoteInput } from "./private-session-validators";
import { HttpError } from "./http-error";
import { sendJson } from "./json-response";
import {
  validateAddListItemInput,
  validateBuildScriptRunInput,
  validateBuildScreenshotAnalyzeInput,
  validateBuildScreenshotCaptureInput,
  validateBuildStepApprovalInput,
  validateBuildStepSubmissionInput,
  validateDecideGovernanceChangeInput,
  validateCompletePairingInput,
  validateCreateConversationMessageInput,
  validateCreateConversationSessionInput,
  validateCreateBugReportInput,
  validateCreateCommandMappingInput,
  validateCreateFeatureBacklogInput,
  validateCreateCartItemInput,
  validateCreateListInput,
  validateCreateMemoryEntryInput,
  validateImportDocumentsInput,
  validateUpdateClientRuntimeSettingsInput,
  validateUpdateDeviceDisplayProfilesInput,
  validateCreateNoteInput,
  validateCreatePartRecordInput,
  validateCreateProjectInput,
  validateCreateReminderInput,
  validateCreateTaskInput,
  validateCreateWorkflowInput,
  validateUpdateCartItemInput,
  validateUpdateListInput,
  validateUpdateListItemInput,
  validateUpdateMemoryEntryInput,
  validateUpdateNoteInput,
  validateUpdatePartRecordInput,
  validateUpdateProjectInput,
  validateUpdateReminderInput,
  validateUpdateTaskInput,
  validateUpdateWorkflowInput,
  validateUpdateBugReportInput,
  validateUpdateFeatureBacklogInput,
  validatePromoteFeatureBacklogInput,
  validatePlanWorkflowInput,
  validateRunExportInput,
  validateUpdateWorkflowStepInput,
  validateExecuteCommandInput,
  validateResolveControlIntentInput,
  validateUpdateVoiceSettingsInput,
  validateUpdateAvatarVoiceProfileInput,
  validateUpdateOpenAiConfigInput,
  validateUpdateLocalLlmConfigInput,
  validateVoiceSpeakInput,
  validateVoiceTranscribeInput,
  validateAddBugScreenshotInput,
  validateSetActiveWardrobePresetInput,
  validateCreateWardrobePresetInput,
  validateUpdateWardrobePresetInput,
  validateUpsertAnimationWorkbenchCollectionInput,
  validateRunAnimationWorkbenchJobInput,
} from "./validators";

type DomainServices = ReturnType<typeof createDomainServices>["services"];

export function createDomainHttpRoutes(services: DomainServices): HttpRoute[] {
  const respondPrivateSessionError = (response: import("node:http").ServerResponse, error: unknown): void => {
    if (error instanceof HttpError) {
      sendJson(response, error.statusCode, {
        error: error.message,
        details: error.details,
      });
      return;
    }

    const message = error instanceof Error ? error.message : "Unknown error.";
    sendJson(response, 500, {
      error: "Private session request failed.",
      details: message,
    });
  };

  const guardPrivateSessionRoute = (
    response: import("node:http").ServerResponse,
    handler: () => void,
  ): void => {
    try {
      handler();
    } catch (error) {
      respondPrivateSessionError(response, error);
    }
  };

  return [
    {
      method: "GET",
      path: "/health",
      handle: ({ response, meta }) => {
        requireCapability(meta, "health");
        sendJson(response, 200, {
          ok: true,
          service: "gail-backend",
          date: new Date().toISOString(),
        });
      },
    },
    {
      method: "GET",
      path: "/access/status",
      handle: ({ response, meta }) => {
        requireCapability(meta, "health");
        sendJson(response, 200, services.accessService.getStatus(services.authService.getStatus()));
      },
    },
    {
      method: "GET",
      path: "/auth/status",
      handle: ({ response }) => {
        sendJson(response, 200, services.authService.getStatus());
      },
    },
    {
      method: "POST",
      path: "/auth/pairing-sessions",
      handle: ({ request, response }) => {
        sendJson(response, 201, services.authService.createPairingSession(request));
      },
    },
    {
      method: "POST",
      path: "/auth/pairing-sessions/:id/complete",
      handle: ({ params, body, request, response }) => {
        const input = validateCompletePairingInput(body);
        sendJson(response, 201, services.authService.completePairing(request, params.id, input));
      },
    },
    {
      method: "GET",
      path: "/dashboard/overview",
      handle: ({ response, meta }) => {
        requireCapability(meta, "dashboard_read");
        sendJson(response, 200, services.dashboardService.getOverview(meta));
      },
    },
    {
      method: "GET",
      path: "/providers/status",
      handle: ({ response, meta }) => {
        requireCapability(meta, "providers_read");
        sendJson(response, 200, services.providerService.list());
      },
    },
    {
      method: "GET",
      path: "/viewer/health",
      handle: async ({ request, response, meta }) => {
        requireCapability(meta, "health");
        const host = request.headers.host ?? "127.0.0.1:4180";
        const url = process.env.GAIL_ANIMATION_VIEWER_URL ?? `http://${host}/client/anim-test/`;
        try {
          const probe = await fetch(url, { method: "GET" });
          sendJson(response, 200, {
            ok: probe.ok,
            reachable: probe.ok,
            status: probe.status,
            url,
          });
        } catch (error) {
          sendJson(response, 200, {
            ok: false,
            reachable: false,
            status: 0,
            url,
            message: error instanceof Error ? error.message : String(error),
          });
        }
      },
    },
    {
      method: "GET",
      path: "/animations/catalog",
      handle: ({ response, meta }) => {
        requireCapability(meta, "dashboard_read");
        sendJson(response, 200, services.animationCatalogService.getSummary());
      },
    },
    {
      method: "GET",
      path: "/animation-workbench/state",
      handle: async ({ response, meta }) => {
        requireCapability(meta, "health");
        const viewerUrl = services.animationWorkbenchService.getViewerUrl();
        let viewer = {
          url: viewerUrl,
          reachable: false,
          status: 0,
        };
        try {
          const probe = await fetch(viewerUrl, { method: "GET" });
          viewer = {
            url: viewerUrl,
            reachable: probe.ok,
            status: probe.status,
          };
        } catch {
        }

        sendJson(response, 200, {
          runtimeSettings: services.clientRuntimeSettingsService.getSettings(),
          assetManifest: services.clientAssetsService.getManifest(services.clientRuntimeSettingsService.getSettings().activeAssetRoot),
          wardrobePresets: services.wardrobePresetsService.getPresets(),
          exportStatus: services.exportService.getStatus(),
          animationCatalog: services.animationCatalogService.getSummary(),
          workbench: services.animationWorkbenchService.getStore(),
          roots: services.animationWorkbenchService.listRoots(),
          libraryItems: services.animationWorkbenchService.listLibraryItems(),
          latestJob: services.animationWorkbenchService.getLatestJob(),
          viewer,
        });
      },
    },
    {
      method: "GET",
      path: "/animation-workbench/files",
      handle: ({ request, response, meta }) => {
        requireCapability(meta, "health");
        const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
        const rootId = url.searchParams.get("root") ?? "workspace";
        const requestedPath = url.searchParams.get("path") ?? ".";
        sendJson(response, 200, services.animationWorkbenchService.listFiles(rootId, requestedPath));
      },
    },
    {
      method: "GET",
      path: "/animation-workbench/files/read",
      handle: ({ request, response, meta }) => {
        requireCapability(meta, "health");
        const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
        const rootId = url.searchParams.get("root") ?? "workspace";
        const requestedPath = url.searchParams.get("path");
        if (!requestedPath) {
          sendJson(response, 400, { error: "Query parameter 'path' is required." });
          return;
        }
        sendJson(response, 200, services.animationWorkbenchService.readFile(rootId, requestedPath));
      },
    },
    {
      method: "POST",
      path: "/animation-workbench/collections",
      handle: ({ body, response, meta }) => {
        requireCapability(meta, "commands_write");
        const input = validateUpsertAnimationWorkbenchCollectionInput(body);
        sendJson(response, 200, services.animationWorkbenchService.createCollection(input));
      },
    },
    {
      method: "PATCH",
      path: "/animation-workbench/collections/:id",
      handle: ({ params, body, response, meta }) => {
        requireCapability(meta, "commands_write");
        const input = validateUpsertAnimationWorkbenchCollectionInput(body);
        sendJson(response, 200, services.animationWorkbenchService.updateCollection(params.id, input));
      },
    },
    {
      method: "DELETE",
      path: "/animation-workbench/collections/:id",
      handle: ({ params, response, meta }) => {
        requireCapability(meta, "commands_write");
        sendJson(response, 200, services.animationWorkbenchService.deleteCollection(params.id));
      },
    },
    {
      method: "GET",
      path: "/animation-workbench/jobs/latest",
      handle: ({ response, meta }) => {
        requireCapability(meta, "health");
        sendJson(response, 200, services.animationWorkbenchService.getLatestJob());
      },
    },
    {
      method: "POST",
      path: "/animation-workbench/jobs/run",
      handle: ({ body, response, meta }) => {
        requireCapability(meta, "commands_write");
        const input = validateRunAnimationWorkbenchJobInput(body);
        sendJson(response, 200, services.animationWorkbenchService.runJob(input));
      },
    },
    {
      method: "GET",
      path: "/providers/openai-config",
      handle: ({ response, meta }) => {
        requireCapability(meta, "providers_read");
        sendJson(response, 200, services.openAiConfigService.getStatus());
      },
    },
    {
      method: "PATCH",
      path: "/providers/openai-config",
      handle: ({ body, response, meta }) => {
        requireCapability(meta, "providers_write");
        enforceSensitiveAuthPolicy(meta, "provider configuration changes");
        const input = validateUpdateOpenAiConfigInput(body);
        sendJson(response, 200, services.openAiConfigService.update(input));
      },
    },
    {
      method: "GET",
      path: "/providers/local-llm-config",
      handle: ({ response, meta }) => {
        requireCapability(meta, "providers_read");
        sendJson(response, 200, services.localLlmConfigService.getStatus());
      },
    },
    {
      method: "PATCH",
      path: "/providers/local-llm-config",
      handle: ({ body, response, meta }) => {
        requireCapability(meta, "providers_write");
        const input = validateUpdateLocalLlmConfigInput(body);
        if (!isPersonaOnlyLocalLlmUpdate(input)) {
          enforceSensitiveAuthPolicy(meta, "provider configuration changes");
        }
        sendJson(response, 200, services.localLlmConfigService.update(input));
      },
    },
    // — Backstory —
        {
      method: "GET",
      path: "/persona/backstory",
      handle: ({ response, meta }) => {
        requireCapability(meta, "providers_read");
        sendJson(response, 200, services.backstoryService.read());
      },
    },
    {
      method: "PATCH",
      path: "/persona/backstory",
      handle: ({ body, response, meta }) => {
        requireCapability(meta, "providers_write");
        enforceSensitiveAuthPolicy(meta, "persona backstory changes");

        const record = body as Record<string, unknown> | undefined;
        const normalCanon = typeof record?.normalCanon === "string" ? record.normalCanon : undefined;
        const counselorCanon = typeof record?.counselorCanon === "string" ? record.counselorCanon : undefined;
        const girlfriendCanon = typeof record?.girlfriendCanon === "string" ? record.girlfriendCanon : undefined;
        const hangoutCanon = typeof record?.hangoutCanon === "string" ? record.hangoutCanon : undefined;

        if (!normalCanon && !counselorCanon && !girlfriendCanon && !hangoutCanon) {
          sendJson(response, 400, {
            error: "At least one of normalCanon, counselorCanon, girlfriendCanon, or hangoutCanon is required.",
          });
          return;
        }

        const updated = services.backstoryService.updatePersonaCanon({
          normal: normalCanon,
          private_counselor: counselorCanon,
          private_girlfriend: girlfriendCanon,
          private_hangout: hangoutCanon,
        });
        sendJson(response, 200, updated);
      },
    },
    {
      method: "GET",
      path: "/persona/backstory/custom",
      handle: ({ response, meta }) => {
        requireCapability(meta, "providers_read");
        sendJson(response, 200, services.backstoryService.listCustom());
      },
    },
    {
      method: "POST",
      path: "/persona/backstory/custom",
      handle: ({ body, response, meta }) => {
        requireCapability(meta, "providers_write");
        enforceSensitiveAuthPolicy(meta, "persona backstory changes");

        const b = body as Record<string, unknown> | undefined;
        const label = typeof b?.label === "string" ? b.label.trim() : "";
        const content = typeof b?.content === "string" ? b.content.trim() : "";
        const personaRaw = typeof b?.persona === "string" ? b.persona : "shared";
        const persona = [
          "shared",
          "normal",
          "private_counselor",
          "private_girlfriend",
          "private_hangout",
        ].includes(personaRaw)
          ? personaRaw as "shared" | "normal" | "private_counselor" | "private_girlfriend" | "private_hangout"
          : "shared";

        if (!label || !content) {
          sendJson(response, 400, { error: "label and content are required." });
          return;
        }

        services.backstoryService.addCustom(label, content, persona);
        sendJson(response, 201, { ok: true, additions: services.backstoryService.listCustom() });
      },
    },
    {
      method: "DELETE",
      path: "/persona/backstory/custom/:index",
      handle: ({ params, response, meta }) => {
        requireCapability(meta, "providers_write");
        enforceSensitiveAuthPolicy(meta, "persona backstory changes");

        const index = parseInt(params.index, 10);
        if (Number.isNaN(index)) {
          sendJson(response, 400, { error: "Invalid index." });
          return;
        }
        const removed = services.backstoryService.removeCustom(index);
        sendJson(response, removed ? 200 : 404, removed ? { ok: true } : { error: "Not found." });
      },
    },
    {
      method: "GET",
      path: "/voice/settings",
      handle: ({ response, meta }) => {
        requireCapability(meta, "voice_read");
        sendJson(response, 200, services.voiceService.getSettings());
      },
    },
    {
      method: "GET",
      path: "/voice/engines",
      handle: ({ response, meta }) => {
        requireCapability(meta, "voice_read");
        sendJson(response, 200, services.voiceService.listTtsEngines());
      },
    },
    {
      method: "PATCH",
      path: "/voice/settings",
      handle: ({ body, response, meta }) => {
        requireCapability(meta, "voice_write");
        const input = validateUpdateVoiceSettingsInput(body);
        sendJson(response, 200, services.voiceService.updateSettings(input));
      },
    },
    {
      method: "GET",
      path: "/voice/avatar-profiles",
      handle: ({ response, meta }) => {
        requireCapability(meta, "voice_read");
        sendJson(response, 200, services.voiceService.getAvatarVoiceProfiles());
      },
    },
    {
      method: "PATCH",
      path: "/voice/avatar-profiles/:presetId",
      handle: ({ params, body, response, meta }) => {
        requireCapability(meta, "voice_write");
        const input = validateUpdateAvatarVoiceProfileInput(body);
        sendJson(response, 200, services.voiceService.updateAvatarVoiceProfile(params.presetId, input));
      },
    },
    {
      method: "POST",
      path: "/voice/speak",
      handle: async ({ body, response, meta }) => {
        requireCapability(meta, "voice_write");
        const input = validateVoiceSpeakInput(body);
        sendJson(response, 200, await services.voiceService.synthesizeSpeech(input));
      },
    },
    {
      method: "POST",
      path: "/voice/transcribe",
      handle: async ({ body, response, meta }) => {
        requireCapability(meta, "voice_write");
        const input = validateVoiceTranscribeInput(body);
        sendJson(response, 200, await services.voiceService.transcribeSpeech(input));
      },
    },
    {
      method: "GET",
      path: "/voice/status",
      handle: ({ response, meta }) => {
        requireCapability(meta, "voice_read");
        sendJson(response, 200, services.voiceService.getStatus(meta));
      },
    },
    {
      method: "POST",
      path: "/voice/warmup",
      handle: async ({ response, meta }) => {
        requireCapability(meta, "voice_write");
        sendJson(response, 200, await services.voiceService.warmupPreferredTts());
      },
    },
    {
      method: "GET",
      path: "/camera/matrix",
      handle: ({ response, meta }) => {
        requireCapability(meta, "camera_read");
        sendJson(response, 200, services.voiceService.getCameraMatrix());
      },
    },
    {
      method: "POST",
      path: "/vision/analyze",
      handle: async ({ body, response, meta }) => {
        requireCapability(meta, "notes_write");
        const b = body as Record<string, unknown> | undefined;
        const imageBase64 = typeof b?.imageBase64 === "string" ? b.imageBase64 : undefined;
        if (!imageBase64) {
          sendJson(response, 400, { error: "imageBase64 is required." });
          return;
        }
        const mimeType = typeof b?.mimeType === "string" ? b.mimeType : "image/jpeg";
        const prompt = typeof b?.prompt === "string" ? b.prompt : undefined;
        const result = await services.visionService.analyzeImage({ imageBase64, mimeType, prompt });
        sendJson(response, 200, result);
      },
    },
    {
      method: "GET",
      path: "/conversation/sessions",
      handle: ({ response, meta }) => {
        requireCapability(meta, "notes_read");
        sendJson(response, 200, services.conversationService.list(meta));
      },
    },
    {
      method: "POST",
      path: "/conversation/sessions",
      handle: ({ body, response, meta }) => {
        requireCapability(meta, "notes_write");
        const input = validateCreateConversationSessionInput(body);
        sendJson(response, 201, services.conversationService.createSession(meta, input));
      },
    },
    {
      method: "GET",
      path: "/conversation/sessions/:id",
      handle: ({ params, response, meta }) => {
        requireCapability(meta, "notes_read");
        const result = services.conversationService.getById(params.id, meta);
        sendJson(response, result ? 200 : 404, result ?? { error: "Conversation session not found." });
      },
    },
    {
      method: "POST",
      path: "/conversation/sessions/:id/messages",
      handle: async ({ params, body, response, meta }) => {
        requireCapability(meta, "notes_write");
        const input = validateCreateConversationMessageInput(body);
        sendJson(response, 201, await services.conversationService.addMessage(params.id, meta, input));
      },
    },
    {
      method: "POST",
      path: "/conversation/sessions/:id/messages/stream",
      handle: async ({ params, body, response, meta }) => {
        requireCapability(meta, "notes_write");
        const input = validateCreateConversationMessageInput(body);
        response.statusCode = 200;
        response.setHeader("Content-Type", "text/event-stream; charset=utf-8");
        response.setHeader("Cache-Control", "no-cache, no-transform");
        response.setHeader("Connection", "keep-alive");
        response.flushHeaders?.();

        const writeEvent = (event: string, payload: unknown) => {
          response.write(`event: ${event}\n`);
          response.write(`data: ${JSON.stringify(payload)}\n\n`);
        };

        try {
          const result = await services.conversationService.addMessageStream(params.id, meta, input, {
            onTextDelta: (delta) => writeEvent("delta", { delta }),
          });
          writeEvent("done", result);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown streaming error.";
          writeEvent("error", { error: message });
        } finally {
          response.end();
        }
      },
    },
    {
      method: "GET",
      path: "/memory/entries",
      handle: ({ request, response, meta }) => {
        requireCapability(meta, "notes_read");
        const requestUrl = new URL(request.url ?? "/", "http://localhost");
        const query = requestUrl.searchParams.get("query");
        sendJson(response, 200, query
          ? services.memoryService.searchEntries(meta, query)
          : services.memoryService.listEntries(meta));
      },
    },
    {
      method: "POST",
      path: "/memory/entries",
      handle: ({ body, response, meta }) => {
        requireCapability(meta, "notes_write");
        const input = validateCreateMemoryEntryInput(body);
        sendJson(response, 201, services.memoryService.addEntry(meta, input));
      },
    },
    {
      method: "POST",
      path: "/imports/documents",
      handle: ({ body, response, meta }) => {
        requireCapability(meta, "notes_write");
        const input = validateImportDocumentsInput(body);
        sendJson(response, 201, services.importService.importDocuments(meta, input));
      },
    },
    {
      method: "PATCH",
      path: "/memory/entries/:id",
      handle: ({ params, body, response, meta }) => {
        requireCapability(meta, "notes_write");
        const input = validateUpdateMemoryEntryInput(body);
        const result = services.memoryService.updateEntry(meta, params.id, input);
        sendJson(response, result ? 200 : 404, result ?? { error: "Memory entry not found." });
      },
    },
    {
      method: "DELETE",
      path: "/memory/entries/:id",
      handle: ({ params, response, meta }) => {
        requireCapability(meta, "notes_write");
        const deleted = services.memoryService.deleteEntry(meta, params.id);
        sendJson(response, deleted ? 200 : 404, deleted ? { deleted: true, id: params.id } : { error: "Memory entry not found." });
      },
    },
    {
      method: "GET",
      path: "/private-memory/entries",
      handle: ({ request, response, meta }) => {
        const requestUrl = new URL(request.url ?? "/", "http://localhost");
        const query = requestUrl.searchParams.get("query");
        sendJson(response, 200, query
          ? services.privateMemoryService.searchEntries(query, meta.privatePersona)
          : services.privateMemoryService.recallRecent(50, meta.privatePersona));
      },
    },
    {
      method: "POST",
      path: "/private-memory/entries",
      handle: ({ body, response, meta }) => {
        const record = body as Record<string, unknown> ?? {};
        const title = typeof record.title === "string" ? record.title : "";
        const bodyText = typeof record.body === "string" ? record.body : "";
        if (!title || !bodyText) throw new HttpError(400, "title and body are required.");
        const tags = Array.isArray(record.tags) ? record.tags.filter((t: unknown) => typeof t === "string") as string[] : [];
        const explicit = typeof record.explicit === "boolean" ? record.explicit : true; // shell writes are explicit
        sendJson(response, 201, services.privateMemoryService.addEntry(title, bodyText, tags, "shell", meta.privatePersona, explicit));
      },
    },
    {
      method: "DELETE",
      path: "/private-memory/entries/:id",
      handle: ({ params, response }) => {
        const deleted = services.privateMemoryService.deleteEntry(params.id);
        sendJson(response, deleted ? 200 : 404, deleted ? { deleted: true, id: params.id } : { error: "Private memory entry not found." });
      },
    },
    {
      method: "GET",
      path: "/private-memory/traits",
      handle: ({ response, meta }) => {
        sendJson(response, 200, services.privateMemoryService.getTraits(meta.privatePersona));
      },
    },
    {
      method: "PATCH",
      path: "/private-memory/traits",
      handle: ({ body, response, meta }) => {
        const record = body as Record<string, unknown> ?? {};
        const key = typeof record.key === "string" ? record.key : "";
        const value = typeof record.value === "string" ? record.value : "";
        if (!key || !value) throw new HttpError(400, "key and value are required.");
        const explicit = typeof record.explicit === "boolean" ? record.explicit : true;
        sendJson(response, 200, services.privateMemoryService.setTrait(key, value, meta.privatePersona, explicit));
      },
    },
    {
      method: "DELETE",
      path: "/private-memory/traits/:key",
      handle: ({ params, response }) => {
        const deleted = services.privateMemoryService.removeTrait(params.key);
        sendJson(response, deleted ? 200 : 404, deleted ? { deleted: true, key: params.key } : { error: "Trait not found." });
      },
    },
    {
      method: "GET",
      path: "/commands",
      handle: ({ response, meta }) => {
        requireCapability(meta, "commands_read");
        sendJson(response, 200, services.commandService.list());
      },
    },
    {
      method: "POST",
      path: "/commands/execute",
      handle: ({ body, response, meta }) => {
        requireCapability(meta, "commands_write");
        const input = validateExecuteCommandInput(body);
        sendJson(response, 200, services.commandService.execute(meta, input));
      },
    },
    {
      method: "GET",
      path: "/commands/mappings",
      handle: ({ response, meta }) => {
        requireCapability(meta, "commands_read");
        sendJson(response, 200, {
          mappings: services.commandService.listMappings(),
        });
      },
    },
    {
      method: "POST",
      path: "/commands/mappings",
      handle: ({ body, response, meta }) => {
        requireCapability(meta, "commands_write");
        const input = validateCreateCommandMappingInput(body);
        sendJson(response, 201, services.commandService.createMapping(input));
      },
    },
    {
      method: "POST",
      path: "/control/intents",
      handle: async ({ body, response, meta }) => {
        requireCapability(meta, "commands_write");
        const input = validateResolveControlIntentInput(body);
        sendJson(response, 200, await services.controlIntentService.resolve(meta, input));
      },
    },
    {
      method: "GET",
      path: "/backlog/features",
      handle: ({ request, response, meta }) => {
        requireCapability(meta, "notes_read");
        const requestUrl = new URL(request.url ?? "/", "http://localhost");
        const stageTarget = requestUrl.searchParams.get("stageTarget") ?? undefined;
        const priority = requestUrl.searchParams.get("priority") ?? undefined;
        const status = requestUrl.searchParams.get("status") ?? undefined;
        sendJson(response, 200, {
          items: services.featureBacklogService.list({
            stageTarget: stageTarget as "current_build" | "next_round" | "future_upgrade" | undefined,
            priority: priority as "low" | "normal" | "high" | "critical" | undefined,
            status: status as "pending" | "planned" | "in_progress" | "done" | "deferred" | undefined,
          }),
        });
      },
    },
    {
      method: "GET",
      path: "/reports/bugs",
      handle: ({ request, response, meta }) => {
        requireCapability(meta, "notes_read");
        const requestUrl = new URL(request.url ?? "/", "http://localhost");
        const status = requestUrl.searchParams.get("status") ?? undefined;
        sendJson(response, 200, {
          items: services.bugReportService.list(status as "open" | "in_progress" | "blocked" | "done" | undefined),
        });
      },
    },
    {
      method: "POST",
      path: "/reports/bugs",
      handle: ({ body, response, meta }) => {
        requireCapability(meta, "notes_write");
        const input = validateCreateBugReportInput(body);
        sendJson(response, 201, services.bugReportService.create(input));
      },
    },
    {
      method: "PATCH",
      path: "/reports/bugs/:id",
      handle: ({ params, body, response, meta }) => {
        requireCapability(meta, "notes_write");
        const input = validateUpdateBugReportInput(body);
        sendJson(response, 200, services.bugReportService.update(params.id, input));
      },
    },
    {
      method: "POST",
      path: "/reports/bugs/:id/screenshot",
      handle: ({ params, body, response, meta }) => {
        requireCapability(meta, "notes_write");
        const input = validateAddBugScreenshotInput(body);
        sendJson(response, 200, services.bugReportService.addScreenshot(params.id, input));
      },
    },
    {
      method: "POST",
      path: "/backlog/features",
      handle: ({ body, response, meta }) => {
        requireCapability(meta, "notes_write");
        const input = validateCreateFeatureBacklogInput(body);
        sendJson(response, 201, services.featureBacklogService.create(input));
      },
    },
    {
      method: "PATCH",
      path: "/backlog/features/:id",
      handle: ({ params, body, response, meta }) => {
        requireCapability(meta, "notes_write");
        const input = validateUpdateFeatureBacklogInput(body);
        sendJson(response, 200, services.featureBacklogService.update(params.id, input));
      },
    },
    {
      method: "POST",
      path: "/backlog/features/:id/promote",
      handle: ({ params, body, response, meta }) => {
        requireCapability(meta, "notes_write");
        const input = validatePromoteFeatureBacklogInput(body);
        sendJson(response, 200, services.featureBacklogService.promote(params.id, input));
      },
    },
    {
      method: "GET",
      path: "/client/runtime-settings",
      handle: ({ response, meta }) => {
        requireCapability(meta, "dashboard_read");
        sendJson(response, 200, services.clientRuntimeSettingsService.getSettings());
      },
    },
    {
      method: "PATCH",
      path: "/client/runtime-settings",
      handle: ({ body, response, meta }) => {
        requireCapability(meta, "devices_write");
        const input = validateUpdateClientRuntimeSettingsInput(body);
        sendJson(response, 200, services.clientRuntimeSettingsService.updateSettings(input));
      },
    },
    {
      method: "GET",
      path: "/client/asset-manifest",
      handle: ({ request, response, meta }) => {
        requireCapability(meta, "dashboard_read");
        const requestUrl = new URL(request.url ?? "/", "http://localhost");
        const requestedAssetRoot = requestUrl.searchParams.get("assetRoot") ?? undefined;
        const runtimeSettings = services.clientRuntimeSettingsService.getSettings();
        sendJson(response, 200, services.clientAssetsService.getManifest(requestedAssetRoot ?? runtimeSettings.activeAssetRoot));
      },
    },
    {
      method: "GET",
      path: "/client/device-display-profiles",
      handle: ({ response, meta }) => {
        requireCapability(meta, "dashboard_read");
        sendJson(response, 200, services.deviceDisplayProfileService.getProfiles());
      },
    },
    {
      method: "PATCH",
      path: "/client/device-display-profiles",
      handle: ({ body, response, meta }) => {
        requireCapability(meta, "devices_write");
        const input = validateUpdateDeviceDisplayProfilesInput(body);
        sendJson(response, 200, services.deviceDisplayProfileService.updateProfiles(input));
      },
    },
    // ── Wardrobe presets ──
    {
      method: "GET",
      path: "/client/wardrobe-presets",
      handle: ({ response, meta }) => {
        requireCapability(meta, "dashboard_read");
        sendJson(response, 200, services.wardrobePresetsService.getPresets());
      },
    },
    {
      method: "PATCH",
      path: "/client/wardrobe-presets",
      handle: ({ body, response, meta }) => {
        requireCapability(meta, "devices_write");
        const input = validateSetActiveWardrobePresetInput(body);
        sendJson(response, 200, services.wardrobePresetsService.setActivePreset(input));
      },
    },
    {
      method: "POST",
      path: "/client/wardrobe-presets",
      handle: ({ body, response, meta }) => {
        requireCapability(meta, "devices_write");
        const input = validateCreateWardrobePresetInput(body);
        sendJson(response, 200, services.wardrobePresetsService.createPreset(input));
      },
    },
    {
      method: "PATCH",
      path: "/client/wardrobe-presets/:presetId",
      handle: ({ params, body, response, meta }) => {
        requireCapability(meta, "devices_write");
        const presetId = params.presetId;
        if (!presetId) throw new HttpError(400, "Missing presetId.");
        const input = validateUpdateWardrobePresetInput(body);
        sendJson(response, 200, services.wardrobePresetsService.updatePreset(presetId, input));
      },
    },
    {
      method: "DELETE",
      path: "/client/wardrobe-presets/:presetId",
      handle: ({ params, response, meta }) => {
        requireCapability(meta, "devices_write");
        const presetId = params.presetId;
        if (!presetId) throw new HttpError(400, "Missing presetId.");
        sendJson(response, 200, services.wardrobePresetsService.deletePreset(presetId));
      },
    },
    {
      method: "GET",
      path: "/exports/status",
      handle: ({ response, meta }) => {
        requireCapability(meta, "commands_read");
        sendJson(response, 200, services.exportService.getStatus());
      },
    },
    {
      method: "POST",
      path: "/exports/run",
      handle: async ({ body, response, meta }) => {
        requireCapability(meta, "commands_write");
        const input = validateRunExportInput(body);
        sendJson(response, 200, await services.exportService.runExport(input));
      },
    },
    {
      method: "GET",
      path: "/devices",
      handle: ({ response, meta }) => {
        requireCapability(meta, "devices_read");
        sendJson(response, 200, services.deviceService.list());
      },
    },
    {
      method: "POST",
      path: "/devices",
      handle: ({ body, response, meta }) => {
        requireCapability(meta, "devices_write");
        enforceSensitiveAuthPolicy(meta, "device registration");
        const input = validateRegisterDeviceInput(body);
        sendJson(response, 201, services.deviceService.register(input));
      },
    },
    {
      method: "PATCH",
      path: "/devices/:id/trust",
      handle: ({ params, body, response, meta }) => {
        requireCapability(meta, "devices_write");
        enforceSensitiveAuthPolicy(meta, "device trust updates");
        const input = validateUpdateDeviceTrustInput(body);
        const result = services.deviceService.updateTrust(params.id, input);
        sendJson(response, result ? 200 : 404, result ?? { error: "Device not found." });
      },
    },
    {
      method: "PATCH",
      path: "/devices/:id/access-window",
      handle: ({ params, body, response, meta }) => {
        requireCapability(meta, "devices_write");
        enforceSensitiveAuthPolicy(meta, "device sensitive-access updates");
        const input = validateUpdateDeviceSensitiveAccessInput(body);
        const result = services.deviceService.updateSensitiveAccess(params.id, input);
        sendJson(response, result ? 200 : 404, result ?? { error: "Device not found." });
      },
    },
    {
      method: "GET",
      path: "/approvals",
      handle: ({ response, meta }) => {
        requireCapability(meta, "approvals_read");
        sendJson(response, 200, services.approvalService.list());
      },
    },
    {
      method: "POST",
      path: "/approvals",
      handle: ({ body, response, meta }) => {
        requireCapability(meta, "approvals_write");
        enforceSensitiveAuthPolicy(meta, "approval creation");
        enforceNonPrivateSensitiveAction(meta, "approval creation");
        const input = validateCreateApprovalRequestInput(body);
        sendJson(response, 201, services.approvalService.create(input));
      },
    },
    {
      method: "PATCH",
      path: "/approvals/:id",
      handle: ({ params, body, response, meta }) => {
        requireCapability(meta, "approvals_write");
        enforceSensitiveAuthPolicy(meta, "approval resolution");
        enforceNonPrivateSensitiveAction(meta, "approval resolution");
        requireTrustedRegisteredDevice(services.deviceService, meta);
        const input = validateResolveApprovalRequestInput(body);
        const result = services.approvalService.resolve(params.id, input);
        sendJson(response, result ? 200 : 404, result ?? { error: "Approval not found." });
      },
    },
    {
      method: "GET",
      path: "/private/session",
      handle: ({ response, meta }) => {
        guardPrivateSessionRoute(response, () => {
          requireCapability(meta, "private_session");
          requirePrivateMode(meta);
          sendJson(
            response,
            200,
            services.memoryService.getPrivateSession(meta.deviceId ?? "anonymous-device"),
          );
        });
      },
    },
    {
      method: "POST",
      path: "/private/session/notes",
      handle: ({ body, response, meta }) => {
        guardPrivateSessionRoute(response, () => {
          requireCapability(meta, "private_session");
          requirePrivateMode(meta);
          const input = validateCreatePrivateSessionNoteInput(body);
          sendJson(
            response,
            201,
            services.memoryService.addPrivateSessionNote(meta.deviceId ?? "anonymous-device", input),
          );
        });
      },
    },
    {
      method: "POST",
      path: "/private/session/wipe",
      handle: ({ response, meta }) => {
        guardPrivateSessionRoute(response, () => {
          requireCapability(meta, "private_session");
          requirePrivateMode(meta);
          sendJson(
            response,
            200,
            services.memoryService.wipePrivateSession(meta.deviceId ?? "anonymous-device"),
          );
        });
      },
    },
    {
      method: "GET",
      path: "/projects",
      handle: ({ response, meta }) => {
        requireCapability(meta, "projects_read");
        sendJson(response, 200, services.projectService.list());
      },
    },
    {
      method: "POST",
      path: "/projects",
      handle: ({ body, response, meta }) => {
        requireCapability(meta, "projects_write");
        const input = validateCreateProjectInput(body);
        enforceWritePolicy("project", meta, input);
        sendJson(response, 201, services.projectService.create(input));
      },
    },
    {
      method: "PATCH",
      path: "/projects/:id",
      handle: ({ params, body, response, meta }) => {
        requireCapability(meta, "projects_write");
        const input = validateUpdateProjectInput(body);
        enforceWritePolicy("project", meta, input);
        const result = services.projectService.update(params.id, input);
        sendJson(response, result ? 200 : 404, result ?? { error: "Project not found." });
      },
    },
    {
      method: "GET",
      path: "/notes",
      handle: ({ response, meta }) => {
        requireCapability(meta, "notes_read");
        sendJson(response, 200, services.noteService.listForMode(meta));
      },
    },
    {
      method: "POST",
      path: "/notes",
      handle: ({ body, response, meta }) => {
        requireCapability(meta, "notes_write");
        const input = validateCreateNoteInput(body);
        enforceWritePolicy("note", meta, input);
        sendJson(response, 201, services.noteService.createForMode(meta, input));
      },
    },
    {
      method: "PATCH",
      path: "/notes/:id",
      handle: ({ params, body, response, meta }) => {
        requireCapability(meta, "notes_write");
        const input = validateUpdateNoteInput(body);
        enforceWritePolicy("note", meta, input);
        const result = services.noteService.updateForMode(meta, params.id, input);
        sendJson(response, result ? 200 : 404, result ?? { error: "Note not found." });
      },
    },
    {
      method: "GET",
      path: "/lists",
      handle: ({ response, meta }) => {
        requireCapability(meta, "lists_read");
        sendJson(response, 200, services.listService.list());
      },
    },
    {
      method: "POST",
      path: "/lists",
      handle: ({ body, response, meta }) => {
        requireCapability(meta, "lists_write");
        const input = validateCreateListInput(body);
        enforceWritePolicy("list", meta, input);
        sendJson(response, 201, services.listService.create(input));
      },
    },
    {
      method: "PATCH",
      path: "/lists/:id",
      handle: ({ params, body, response, meta }) => {
        requireCapability(meta, "lists_write");
        const input = validateUpdateListInput(body);
        enforceWritePolicy("list", meta, input);
        const result = services.listService.update(params.id, input);
        sendJson(response, result ? 200 : 404, result ?? { error: "List not found." });
      },
    },
    {
      method: "POST",
      path: "/lists/:id/items",
      handle: ({ params, body, response, meta }) => {
        requireCapability(meta, "lists_write");
        const input = validateAddListItemInput(body);
        enforceWritePolicy("list", meta, input);
        const result = services.listService.addItem(params.id, input);
        sendJson(response, result ? 201 : 404, result ?? { error: "List not found." });
      },
    },
    {
      method: "PATCH",
      path: "/lists/:id/items/:itemId",
      handle: ({ params, body, response, meta }) => {
        requireCapability(meta, "lists_write");
        const input = validateUpdateListItemInput(body);
        enforceWritePolicy("list", meta, input);
        const result = services.listService.updateItem(params.id, params.itemId, input);
        sendJson(response, result ? 200 : 404, result ?? { error: "List or item not found." });
      },
    },
    {
      method: "GET",
      path: "/tasks",
      handle: ({ response, meta }) => {
        requireCapability(meta, "tasks_read");
        sendJson(response, 200, services.taskService.list());
      },
    },
    {
      method: "POST",
      path: "/tasks",
      handle: ({ body, response, meta }) => {
        requireCapability(meta, "tasks_write");
        const input = validateCreateTaskInput(body);
        enforceWritePolicy("task", meta, input);
        sendJson(response, 201, services.taskService.create(input));
      },
    },
    {
      method: "PATCH",
      path: "/tasks/:id",
      handle: ({ params, body, response, meta }) => {
        requireCapability(meta, "tasks_write");
        const input = validateUpdateTaskInput(body);
        enforceWritePolicy("task", meta, input);
        const result = services.taskService.update(params.id, input);
        sendJson(response, result ? 200 : 404, result ?? { error: "Task not found." });
      },
    },
    {
      method: "GET",
      path: "/workflows",
      handle: ({ response, meta }) => {
        requireCapability(meta, "tasks_read");
        sendJson(response, 200, services.workflowService.list());
      },
    },
    {
      method: "POST",
      path: "/workflows",
      handle: ({ body, response, meta }) => {
        requireCapability(meta, "tasks_write");
        const input = validateCreateWorkflowInput(body);
        sendJson(response, 201, services.workflowService.create(input));
      },
    },
    {
      method: "GET",
      path: "/workflows/:id",
      handle: ({ params, response, meta }) => {
        requireCapability(meta, "tasks_read");
        const result = services.workflowService.getById(params.id);
        sendJson(response, result ? 200 : 404, result ?? { error: "Workflow not found." });
      },
    },
    {
      method: "PATCH",
      path: "/workflows/:id",
      handle: ({ params, body, response, meta }) => {
        requireCapability(meta, "tasks_write");
        const input = validateUpdateWorkflowInput(body);
        const result = services.workflowService.update(params.id, input);
        sendJson(response, result ? 200 : 404, result ?? { error: "Workflow not found." });
      },
    },
    {
      method: "POST",
      path: "/workflows/:id/plan",
      handle: ({ params, body, response, meta }) => {
        requireCapability(meta, "tasks_write");
        const input = validatePlanWorkflowInput(body);
        sendJson(response, 200, services.workflowService.planWorkflow(params.id, meta, input));
      },
    },
    {
      method: "PATCH",
      path: "/workflows/:id/steps/:stepId",
      handle: ({ params, body, response, meta }) => {
        requireCapability(meta, "tasks_write");
        const input = validateUpdateWorkflowStepInput(body);
        const result = services.workflowService.updateStep(params.id, params.stepId, input);
        sendJson(response, result ? 200 : 404, result ?? { error: "Workflow not found." });
      },
    },
    {
      method: "POST",
      path: "/workflows/:id/steps/:stepId/run",
      handle: async ({ params, response, meta }) => {
        requireCapability(meta, "tasks_write");
        sendJson(response, 200, await services.workflowService.runStep(params.id, params.stepId, meta));
      },
    },
    {
      method: "GET",
      path: "/build/overview",
      handle: ({ response, meta }) => {
        requireCapability(meta, "tasks_read");
        sendJson(response, 200, services.buildControlService.getOverview());
      },
    },
    {
      method: "GET",
      path: "/build/agents",
      handle: ({ response, meta }) => {
        requireCapability(meta, "tasks_read");
        sendJson(response, 200, services.buildControlService.getAgents());
      },
    },
    {
      method: "POST",
      path: "/build/steps/:id/submit",
      handle: ({ params, body, response, meta }) => {
        requireCapability(meta, "tasks_write");
        const input = validateBuildStepSubmissionInput(body);
        sendJson(response, 200, services.buildControlService.submitStep(params.id, input));
      },
    },
    {
      method: "POST",
      path: "/build/steps/:id/approve",
      handle: ({ params, body, response, meta }) => {
        requireCapability(meta, "tasks_write");
        const input = validateBuildStepApprovalInput(body);
        sendJson(response, 200, services.buildControlService.approveStep(params.id, input));
      },
    },
    {
      method: "GET",
      path: "/build/screenshots/capture",
      handle: ({ response, meta }) => {
        requireCapability(meta, "tasks_read");
        sendJson(response, 200, {
          endpoint: "/build/screenshots/capture",
          method: "POST",
          shellRoute: "/panel/module/build-control-tower",
          accepts: ["feature", "label", "sourcePath", "stepId"],
          note: "Use POST to capture screenshot evidence. GET is provided for shell discovery and audit tooling.",
        });
      },
    },
    {
      method: "POST",
      path: "/build/screenshots/capture",
      handle: ({ body, response, meta }) => {
        requireCapability(meta, "tasks_write");
        const input = validateBuildScreenshotCaptureInput(body);
        sendJson(response, 200, services.buildControlService.captureScreenshot(input));
      },
    },
    {
      method: "GET",
      path: "/build/screenshots/analyze",
      handle: ({ response, meta }) => {
        requireCapability(meta, "tasks_read");
        sendJson(response, 200, {
          endpoint: "/build/screenshots/analyze",
          method: "POST",
          shellRoute: "/panel/module/build-control-tower",
          accepts: ["feature", "screenshotPath", "stepId"],
          note: "Use POST to analyze a stored screenshot and persist QA findings. GET is provided for shell discovery and audit tooling.",
        });
      },
    },
    {
      method: "POST",
      path: "/build/screenshots/analyze",
      handle: ({ body, response, meta }) => {
        requireCapability(meta, "tasks_write");
        const input = validateBuildScreenshotAnalyzeInput(body);
        sendJson(response, 200, services.buildControlService.analyzeScreenshot(input));
      },
    },
    {
      method: "GET",
      path: "/build/scripts",
      handle: ({ response, meta }) => {
        requireCapability(meta, "tasks_read");
        sendJson(response, 200, services.buildControlService.listScripts());
      },
    },
    {
      method: "POST",
      path: "/build/scripts/run",
      handle: async ({ body, response, meta }) => {
        requireCapability(meta, "tasks_write");
        const input = validateBuildScriptRunInput(body);
        sendJson(response, 200, await services.buildControlService.runScript(input));
      },
    },
    {
      method: "GET",
      path: "/build/scripts/:id/results",
      handle: ({ params, response, meta }) => {
        requireCapability(meta, "tasks_read");
        sendJson(response, 200, services.buildControlService.getScriptResults(params.id));
      },
    },
    {
      method: "GET",
      path: "/governance/changes",
      handle: ({ request, response, meta }) => {
        requireCapability(meta, "tasks_read");
        const requestUrl = new URL(request.url ?? "/", "http://localhost");
        const state = requestUrl.searchParams.get("state");
        if (state === "pending") {
          sendJson(response, 200, services.changeGovernanceService.listPendingChanges());
          return;
        }
        if (state === "approved") {
          const approved = services.changeGovernanceService.getLastApprovedChange();
          sendJson(response, 200, approved ? [approved] : []);
          return;
        }
        sendJson(response, 200, services.changeGovernanceService.listChanges());
      },
    },
    {
      method: "GET",
      path: "/governance/changes/:id",
      handle: ({ params, response, meta }) => {
        requireCapability(meta, "tasks_read");
        const record = services.changeGovernanceService.getChange(params.id);
        sendJson(response, record ? 200 : 404, record ?? { error: "Change not found." });
      },
    },
    {
      method: "POST",
      path: "/governance/changes/:id/decision",
      handle: ({ params, body, response, meta }) => {
        requireCapability(meta, "tasks_write");
        const input = validateDecideGovernanceChangeInput(body);
        sendJson(response, 200, services.changeGovernanceService.decideChange(params.id, input));
      },
    },
    {
      method: "POST",
      path: "/governance/rollback/last-approved",
      handle: ({ response, meta }) => {
        requireCapability(meta, "tasks_write");
        sendJson(response, 200, services.changeGovernanceService.rollbackToLastApproved());
      },
    },
    {
      method: "GET",
      path: "/governance/rollback/last-approved",
      handle: ({ response, meta }) => {
        requireCapability(meta, "tasks_read");
        const approvedChange = services.changeGovernanceService.getLastApprovedChange();
        sendJson(response, 200, {
          available: Boolean(approvedChange?.lastApprovedSnapshotId),
          method: "POST",
          shellRoute: "/panel/module/change-governance",
          lastApprovedChange: approvedChange ?? null,
        });
      },
    },
    {
      method: "GET",
      path: "/governance/history",
      handle: ({ request, response, meta }) => {
        requireCapability(meta, "tasks_read");
        const requestUrl = new URL(request.url ?? "/", "http://localhost");
        const limitRaw = requestUrl.searchParams.get("limit");
        const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 200;
        sendJson(response, 200, services.changeGovernanceService.getHistory(Number.isFinite(limit) ? limit : 200));
      },
    },
    {
      method: "GET",
      path: "/reminders",
      handle: ({ response, meta }) => {
        requireCapability(meta, "reminders_read");
        sendJson(response, 200, services.reminderService.list());
      },
    },
    {
      method: "POST",
      path: "/reminders",
      handle: ({ body, response, meta }) => {
        requireCapability(meta, "reminders_write");
        const input = validateCreateReminderInput(body);
        enforceWritePolicy("reminder", meta, input);
        sendJson(response, 201, services.reminderService.create(input));
      },
    },
    {
      method: "PATCH",
      path: "/reminders/:id",
      handle: ({ params, body, response, meta }) => {
        requireCapability(meta, "reminders_write");
        const input = validateUpdateReminderInput(body);
        enforceWritePolicy("reminder", meta, input);
        const result = services.reminderService.update(params.id, input);
        sendJson(response, result ? 200 : 404, result ?? { error: "Reminder not found." });
      },
    },
    {
      method: "GET",
      path: "/parts",
      handle: ({ response, meta }) => {
        requireCapability(meta, "parts_read");
        sendJson(response, 200, services.partsService.list());
      },
    },
    {
      method: "POST",
      path: "/parts",
      handle: ({ body, response, meta }) => {
        requireCapability(meta, "parts_write");
        const input = validateCreatePartRecordInput(body);
        enforceWritePolicy("part", meta, input);
        sendJson(response, 201, services.partsService.create(input));
      },
    },
    {
      method: "PATCH",
      path: "/parts/:id",
      handle: ({ params, body, response, meta }) => {
        requireCapability(meta, "parts_write");
        const input = validateUpdatePartRecordInput(body);
        enforceWritePolicy("part", meta, input);
        const result = services.partsService.update(params.id, input);
        sendJson(response, result ? 200 : 404, result ?? { error: "Part not found." });
      },
    },
    {
      method: "GET",
      path: "/cart",
      handle: ({ response, meta }) => {
        requireCapability(meta, "cart_read");
        sendJson(response, 200, services.cartService.list());
      },
    },
    {
      method: "POST",
      path: "/cart",
      handle: ({ body, response, meta }) => {
        requireCapability(meta, "cart_write");
        const input = validateCreateCartItemInput(body);
        enforceWritePolicy("cart", meta, input);
        sendJson(response, 201, services.cartService.create(input));
      },
    },
    {
      method: "PATCH",
      path: "/cart/:id",
      handle: ({ params, body, response, meta }) => {
        requireCapability(meta, "cart_write");
        const input = validateUpdateCartItemInput(body);
        enforceWritePolicy("cart", meta, input);
        if (input.status === "approved") {
          sendJson(response, 202, {
            status: "pending_approval",
            message: "Cart approval requires a separate approval request and commit flow.",
          });
          return;
        }
        const result = services.cartService.update(params.id, input);
        sendJson(response, result ? 200 : 404, result ?? { error: "Cart item not found." });
      },
    },
    {
      method: "POST",
      path: "/cart/:id/approve-request",
      handle: ({ params, body, request, response, meta }) => {
        requireCapability(meta, "cart_write");
        enforceSensitiveAuthPolicy(meta, "cart approval requests");
        enforceNonPrivateSensitiveAction(meta, "cart approval requests");
        requireTrustedRegisteredDevice(services.deviceService, meta);
        const cartItem = services.cartService.getById(params.id);
        if (!cartItem) {
          sendJson(response, 404, { error: "Cart item not found." });
          return;
        }

        const record = body as Record<string, unknown> | undefined;
        const requestUrl = new URL(request.url ?? "/", "http://localhost");
        const queryExpiresAt = requestUrl.searchParams.get("expiresAt") ?? undefined;
        const expiresAt = typeof record?.expiresAt === "string"
          ? record.expiresAt
          : typeof queryExpiresAt === "string"
            ? queryExpiresAt
          : new Date(Date.now() + 15 * 60_000).toISOString();

        const approval = services.approvalService.create({
          actionType: "approve_cart_item",
          reason: `Approve cart item ${params.id}`,
          requestedByDeviceId: meta.deviceId ?? `${meta.deviceType}-requester`,
          expiresAt,
        });

        sendJson(response, 201, {
          approval,
          cartItem,
        });
      },
    },
    {
      method: "POST",
      path: "/cart/:id/approve-commit",
      handle: ({ params, body, response, meta }) => {
        requireCapability(meta, "cart_write");
        enforceSensitiveAuthPolicy(meta, "cart approval commits");
        enforceNonPrivateSensitiveAction(meta, "cart approval commits");
        requireTrustedRegisteredDevice(services.deviceService, meta);
        const record = body as Record<string, unknown> | undefined;
        const approvalId = typeof record?.approvalId === "string" ? record.approvalId : undefined;
        if (!approvalId) {
          sendJson(response, 400, { error: "approvalId must be provided." });
          return;
        }

        const approval = services.approvalService.getById(approvalId);
        if (!approval) {
          sendJson(response, 404, { error: "Approval not found." });
          return;
        }

        if (approval.status === "expired") {
          sendJson(response, 410, {
            error: "Approval has expired before commit.",
          });
          return;
        }

        if (approval.status === "rejected") {
          sendJson(response, 403, {
            error: "Approval was rejected and cannot be committed.",
          });
          return;
        }

        if (approval.status !== "approved") {
          sendJson(response, 403, {
            error: "Approval must be resolved as approved before commit.",
          });
          return;
        }

        const result = services.cartService.update(params.id, { status: "approved" });
        sendJson(response, result ? 200 : 404, result ?? { error: "Cart item not found." });
      },
    },

    // ── System Status ─────────────────────────────────────
    {
      method: "GET",
      path: "/system/status",
      handle: ({ response, meta }) => {
        requireCapability(meta, "health");
        sendJson(response, 200, services.systemStatusService.getStatus());
      },
    },
    {
      method: "GET",
      path: "/system/errors",
      handle: ({ response, meta }) => {
        requireCapability(meta, "health");
        sendJson(response, 200, services.systemStatusService.getErrors());
      },
    },

    // ── File System ───────────────────────────────────────
    {
      method: "GET",
      path: "/system/files",
      handle: ({ request, response, meta }) => {
        requireCapability(meta, "health");
        const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
        const requestedPath = url.searchParams.get("path") ?? ".";
        const entries = services.fileSystemService.listDirectory(requestedPath);
        sendJson(response, 200, entries);
      },
    },
    {
      method: "GET",
      path: "/system/files/read",
      handle: ({ request, response, meta }) => {
        requireCapability(meta, "health");
        const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
        const filePath = url.searchParams.get("path");
        if (!filePath) {
          sendJson(response, 400, { error: "Query parameter 'path' is required." });
          return;
        }
        const result = services.fileSystemService.readFile(filePath);
        sendJson(response, 200, result);
      },
    },

    // ── Manager Agent ─────────────────────────────────────
    {
      method: "GET",
      path: "/manager/report",
      handle: ({ response, meta }) => {
        requireCapability(meta, "health");
        services.managerAgentService.refreshDirectiveStatuses();
        sendJson(response, 200, services.managerAgentService.getReport());
      },
    },
    {
      method: "GET",
      path: "/manager/status",
      handle: ({ response, meta }) => {
        requireCapability(meta, "health");
        sendJson(response, 200, services.managerAgentService.getManagerStatus());
      },
    },
    {
      method: "GET",
      path: "/manager/builders",
      handle: ({ response, meta }) => {
        requireCapability(meta, "health");
        sendJson(response, 200, services.managerAgentService.getBuilderStatuses());
      },
    },
    {
      method: "GET",
      path: "/manager/directives",
      handle: ({ request, response, meta }) => {
        requireCapability(meta, "health");
        const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
        const status = url.searchParams.get("status") ?? undefined;
        const limit = parseInt(url.searchParams.get("limit") ?? "50", 10);
        sendJson(response, 200, services.managerAgentService.listDirectives(status, limit));
      },
    },
    {
      method: "GET",
      path: "/manager/directives/:id",
      handle: ({ params, response, meta }) => {
        requireCapability(meta, "health");
        const directive = services.managerAgentService.getDirective(params.id);
        sendJson(response, directive ? 200 : 404, directive ?? { error: "Directive not found." });
      },
    },
    {
      method: "POST",
      path: "/manager/directives",
      handle: ({ body, response, meta }) => {
        requireCapability(meta, "tasks_write");
        const input = body as CreateManagerDirectiveInput;
        if (!input?.instruction) {
          sendJson(response, 400, { error: "Field 'instruction' is required." });
          return;
        }
        const directive = services.managerAgentService.createDirective(input);
        sendJson(response, 201, directive);
      },
    },
    {
      method: "POST",
      path: "/manager/directives/:id/cancel",
      handle: ({ params, response, meta }) => {
        requireCapability(meta, "tasks_write");
        const directive = services.managerAgentService.cancelDirective(params.id);
        sendJson(response, directive ? 200 : 404, directive ?? { error: "Directive not found." });
      },
    },
    {
      method: "POST",
      path: "/manager/avatar-request",
      handle: async ({ body, response, meta }) => {
        requireCapability(meta, "tasks_write");
        const input = body as { instruction?: string } | undefined;
        if (!input?.instruction) {
          sendJson(response, 400, { error: "Field 'instruction' is required." });
          return;
        }
        const reply = await services.managerAgentService.handleAvatarRequest(input.instruction);
        sendJson(response, 200, { reply });
      },
    },
    {
      method: "POST",
      path: "/manager/directives/:id/retry",
      handle: ({ params, response, meta }) => {
        requireCapability(meta, "tasks_write");
        const directive = services.managerAgentService.retryDirective(params.id);
        sendJson(response, directive ? 200 : 404, directive ?? { error: "Directive not found." });
      },
    },
    {
      method: "GET",
      path: "/manager/directives/:id/plan",
      handle: async ({ params, response, meta }) => {
        requireCapability(meta, "health");
        const plan = await services.managerAgentService.generatePlanSummary(params.id);
        sendJson(response, 200, { directiveId: params.id, plan });
      },
    },
    {
      method: "GET",
      path: "/manager/activity-summary",
      handle: async ({ response, meta }) => {
        requireCapability(meta, "health");
        const summary = await services.managerAgentService.generateActivitySummary();
        sendJson(response, 200, { summary });
      },
    },
    {
      method: "GET",
      path: "/manager/logs",
      handle: ({ request, response, meta }) => {
        requireCapability(meta, "health");
        const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
        const agentId = url.searchParams.get("agentId") ?? undefined;
        const limit = parseInt(url.searchParams.get("limit") ?? "50", 10);
        sendJson(response, 200, services.managerAgentService.getLogs(agentId, limit));
      },
    },
    {
      method: "GET",
      path: "/manager/directives/:id/logs",
      handle: ({ params, response, meta }) => {
        requireCapability(meta, "health");
        sendJson(response, 200, services.managerAgentService.getDirectiveLogs(params.id));
      },
    },
    {
      method: "POST",
      path: "/manager/directives/:id/gail-approve",
      handle: ({ params, body, response, meta }) => {
        requireCapability(meta, "tasks_write");
        const record = body as Record<string, unknown> | undefined;
        const decision = record?.decision as "approved" | "rejected" | undefined;
        if (!decision || (decision !== "approved" && decision !== "rejected")) {
          sendJson(response, 400, { error: "Body must include decision: 'approved' or 'rejected'." });
          return;
        }
        const note = typeof record?.note === "string" ? record.note : undefined;
        const directive = services.managerAgentService.gailApprove(params.id, decision, note);
        sendJson(response, directive ? 200 : 404, directive ?? { error: "Directive not found." });
      },
    },
    {
      method: "GET",
      path: "/manager/gail-context",
      handle: ({ response, meta }) => {
        requireCapability(meta, "health");
        sendJson(response, 200, { context: services.managerAgentService.getGailContext() });
      },
    },
    {
      method: "GET",
      path: "/manager/awaiting-approval",
      handle: ({ response, meta }) => {
        requireCapability(meta, "health");
        const directives = services.managerAgentService.listDirectives("awaiting_gail_approval", 50);
        sendJson(response, 200, directives);
      },
    },
  ];
}

function isPersonaOnlyLocalLlmUpdate(input: ReturnType<typeof validateUpdateLocalLlmConfigInput>): boolean {
  const keys = Object.keys(input);
  return keys.length > 0 && keys.every((key) => key === "activePrivatePersona");
}
