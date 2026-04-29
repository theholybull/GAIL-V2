import { resolve } from "node:path";
import {
  SqlitePrivateNoteRepository,
  SqliteConversationRepository,
  SqliteCartRepository,
  SqliteDeviceCredentialRepository,
  SqliteDeviceRepository,
  SqliteListRepository,
  SqliteNoteRepository,
  SqlitePairingSessionRepository,
  SqliteApprovalRepository,
  SqlitePartRepository,
  SqliteProjectRepository,
  SqliteReminderRepository,
  SqliteTaskRepository,
  SqliteWorkflowRepository,
  SqliteDirectiveRepository,
  sqliteConfig,
} from "./db";
import {
  AccessService,
  ApprovalService,
  AgentLogService,
  AnimationCatalogService,
  AnimationWorkbenchService,
  AuthService,
  BuildControlService,
  BugReportService,
  FileSystemService,
  ManagerAgentService,
  SystemStatusService,
  CartService,
  ClientAssetsService,
  ClientRuntimeSettingsService,
  ChangeGovernanceService,
  CommandService,
  ConversationService,
  ControlIntentService,
  DailySummaryService,
  DashboardService,
  DeviceDisplayProfileService,
  DeviceService,
  ExportService,
  FeatureBacklogService,
  ImportService,
  ListService,
  LocalLlmConfigService,
  MemoryService,
  PrivateMemoryService,
  NoteService,
  OpenAiConfigService,
  PartsService,
  ProjectService,
  ProviderService,
  ReminderService,
  TaskService,
  VoiceService,
  WorkflowService,
} from "./services";
import { ActionBroker, CommandBroker } from "./brokers";
import { LocalLlmProvider, OpenAIProvider } from "./providers";
import { BackstoryService } from "./services/backstory-service";
import { VisionService } from "./services/vision-service";
import { WardrobePresetsService } from "./services/wardrobe-presets-service";

export function createDomainServices() {
  const memoryService = new MemoryService();
  const privateMemoryService = new PrivateMemoryService();
  const openAiConfigService = new OpenAiConfigService();
  const localLlmConfigService = new LocalLlmConfigService();
  const backstoryService = new BackstoryService();
  const openaiProvider = new OpenAIProvider(openAiConfigService);
  const localLlmProvider = new LocalLlmProvider(localLlmConfigService);
  const repositories = {
    projects: new SqliteProjectRepository(),
    notes: new SqliteNoteRepository(),
    privateNotes: new SqlitePrivateNoteRepository(),
    lists: new SqliteListRepository(),
    tasks: new SqliteTaskRepository(),
    reminders: new SqliteReminderRepository(),
    parts: new SqlitePartRepository(),
    cart: new SqliteCartRepository(),
    approvals: new SqliteApprovalRepository(),
    devices: new SqliteDeviceRepository(),
    pairingSessions: new SqlitePairingSessionRepository(),
    deviceCredentials: new SqliteDeviceCredentialRepository(),
    workflows: new SqliteWorkflowRepository(),
  };
  const projectService = new ProjectService(repositories.projects);
  const noteService = new NoteService(repositories.notes, repositories.privateNotes);
  const importService = new ImportService(memoryService, noteService, projectService);
  const listService = new ListService(repositories.lists);
  const taskService = new TaskService(repositories.tasks);
  const reminderService = new ReminderService(repositories.reminders);
  const partsService = new PartsService(repositories.parts);
  const cartService = new CartService(repositories.cart);
  const approvalService = new ApprovalService(repositories.approvals);
  const deviceService = new DeviceService(repositories.devices);
  const authService = new AuthService(
    repositories.devices,
    repositories.pairingSessions,
    repositories.deviceCredentials,
    deviceService,
  );
  const actionBroker = new ActionBroker({
    cartService,
    projectService,
    taskService,
  });
  const commandBroker = new CommandBroker();
  const providerService = new ProviderService([openaiProvider, localLlmProvider]);
  const voiceService = new VoiceService(openAiConfigService);
  const accessService = new AccessService();
  const clientRuntimeSettingsService = new ClientRuntimeSettingsService();
  const wardrobePresetsService = new WardrobePresetsService();
  const deviceDisplayProfileService = new DeviceDisplayProfileService();
  const commandService = new CommandService(actionBroker);
  const workflowService = new WorkflowService(
    repositories.workflows,
    {
      "local-llm": localLlmProvider,
      openai: openaiProvider,
    },
    memoryService,
    noteService,
    projectService,
  );
  const changeGovernanceService = new ChangeGovernanceService();
  const buildControlService = new BuildControlService(workflowService, changeGovernanceService);
  const featureBacklogService = new FeatureBacklogService(taskService, workflowService, changeGovernanceService);
  const bugReportService = new BugReportService();
  const animationCatalogService = new AnimationCatalogService();
  const animationWorkbenchService = new AnimationWorkbenchService();
  const systemStatusService = new SystemStatusService(buildControlService, providerService, voiceService);
  const fileSystemService = new FileSystemService(resolve(process.cwd(), ".."));
  const agentLogService = new AgentLogService();
  const managerAgentService = new ManagerAgentService(buildControlService, workflowService, systemStatusService, agentLogService, new SqliteDirectiveRepository());

  const conversationService = new ConversationService({
    "local-llm": localLlmProvider,
    openai: openaiProvider,
  }, new SqliteConversationRepository(), memoryService, providerService, privateMemoryService, undefined, localLlmConfigService, backstoryService);
  conversationService.setManagerAgentService(managerAgentService);
  conversationService.setWorkflowService(workflowService);

  const dailySummaryService = new DailySummaryService(memoryService, privateMemoryService);
  dailySummaryService.start();

  return {
    repositories,
    storage: {
      engine: sqliteConfig.engine,
      path: sqliteConfig.path,
      privatePath: sqliteConfig.privatePath,
    },
    services: {
      conversationService,
      providerService,
      openAiConfigService,
      localLlmConfigService,
      voiceService,
      workflowService,
      changeGovernanceService,
      buildControlService,
      featureBacklogService,
      bugReportService,
      animationCatalogService,
      animationWorkbenchService,
      controlIntentService: new ControlIntentService(commandService, workflowService, managerAgentService),
      approvalService,
      accessService,
      authService,
      deviceService,
      exportService: new ExportService(),
      projectService,
      noteService,
      importService,
      memoryService,
      privateMemoryService,
      dailySummaryService,
      listService,
      taskService,
      reminderService,
      partsService,
      cartService,
      clientRuntimeSettingsService,
      deviceDisplayProfileService,
      clientAssetsService: new ClientAssetsService(),
      wardrobePresetsService,
      actionBroker,
      commandBroker,
      commandService,
      systemStatusService,
      fileSystemService,
      agentLogService,
      managerAgentService,
      backstoryService,
      visionService: new VisionService(openAiConfigService),
      dashboardService: new DashboardService({
        approvalService,
        cartService,
        deviceService,
        listService,
        noteService,
        partsService,
        projectService,
        reminderService,
        taskService,
      }),
    },
  };
}
