export const GAIL_PROJECT_NAME = "Gail";
export const GAIL_SPEC_VERSION = "V1 Foundation";
export const PRIVATE_MODE_BADGE = "PRIVATE MODE";

/**
 * Single source of truth for keywords that trigger the manager pipeline.
 * Both ControlIntentService and ConversationService import this.
 */
export const MANAGER_KEYWORDS = /\b(dispatch|deploy|create|fix|run script|execute|compile|export|generate|pipeline|ship it|assign task|set up|update the|test|check|validate|publish|push|merge|review|audit|scan|refactor|optimize|migrate|implement|wire up|connect|integrate|configure|install|upgrade|rollback)\b/i;
