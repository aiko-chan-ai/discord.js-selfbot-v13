// These are enums that are used in the typings file but do not exist as actual exported values. To prevent them from
// showing up in an editor, they are imported from here instead of exporting them there directly.

export const enum ActivityTypes {
  PLAYING = 0,
  STREAMING = 1,
  LISTENING = 2,
  WATCHING = 3,
  CUSTOM = 4,
  COMPETING = 5,
  HANG = 6,
}

export const enum ApplicationCommandTypes {
  CHAT_INPUT = 1,
  USER = 2,
  MESSAGE = 3,
}

export const enum ApplicationCommandOptionTypes {
  SUB_COMMAND = 1,
  SUB_COMMAND_GROUP = 2,
  STRING = 3,
  INTEGER = 4,
  BOOLEAN = 5,
  USER = 6,
  CHANNEL = 7,
  ROLE = 8,
  MENTIONABLE = 9,
  NUMBER = 10,
  ATTACHMENT = 11,
}

export const enum ApplicationCommandPermissionTypes {
  ROLE = 1,
  USER = 2,
}

export const enum AutoModerationRuleTriggerTypes {
  KEYWORD = 1,
  SPAM = 2,
  KEYWORD_PRESET = 3,
  MENTION_SPAM = 4,
}

export const enum AutoModerationRuleKeywordPresetTypes {
  PROFANITY = 1,
  SEXUAL_CONTENT = 2,
  SLURS = 3,
}

export const enum AutoModerationActionTypes {
  BLOCK_MESSAGE = 1,
  SEND_ALERT_MESSAGE = 2,
  TIMEOUT = 3,
}

export const enum AutoModerationRuleEventTypes {
  MESSAGE_SEND = 1,
}

export const enum ChannelTypes {
  GUILD_TEXT = 0,
  DM = 1,
  GUILD_VOICE = 2,
  GROUP_DM = 3,
  GUILD_CATEGORY = 4,
  GUILD_NEWS = 5,
  GUILD_STORE = 6,
  UNKNOWN = 7,
  GUILD_NEWS_THREAD = 10,
  GUILD_PUBLIC_THREAD = 11,
  GUILD_PRIVATE_THREAD = 12,
  GUILD_STAGE_VOICE = 13,
  GUILD_DIRECTORY = 14,
  GUILD_FORUM = 15,
  GUILD_MEDIA = 16,
}

export const enum SortOrderTypes {
  LATEST_ACTIVITY = 1,
  CREATION_DATE = 2,
}

export const enum ForumLayoutTypes {
  NOT_SET = 0,
  LIST_VIEW = 1,
  GALLERY_VIEW = 2,
}

export const enum PollLayoutTypes {
  DEFAULT = 1,
  IMAGE_ONLY_ANSWERS,
}

export const enum MessageTypes {
  DEFAULT = 0,
  RECIPIENT_ADD,
  RECIPIENT_REMOVE,
  CALL,
  CHANNEL_NAME_CHANGE,
  CHANNEL_ICON_CHANGE,
  CHANNEL_PINNED_MESSAGE,
  GUILD_MEMBER_JOIN,
  USER_PREMIUM_GUILD_SUBSCRIPTION,
  USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_1,
  USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_2,
  USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_3,
  CHANNEL_FOLLOW_ADD,
  GUILD_DISCOVERY_DISQUALIFIED = 14,
  GUILD_DISCOVERY_REQUALIFIED,
  GUILD_DISCOVERY_GRACE_PERIOD_INITIAL_WARNING,
  GUILD_DISCOVERY_GRACE_PERIOD_FINAL_WARNING,
  THREAD_CREATED,
  REPLY,
  APPLICATION_COMMAND,
  THREAD_STARTER_MESSAGE,
  GUILD_INVITE_REMINDER,
  CONTEXT_MENU_COMMAND,
  AUTO_MODERATION_ACTION,
  ROLE_SUBSCRIPTION_PURCHASE,
  INTERACTION_PREMIUM_UPSELL,
  STAGE_START,
  STAGE_END,
  STAGE_SPEAKER,
  STAGE_RAISE_HAND,
  STAGE_TOPIC,
  GUILD_APPLICATION_PREMIUM_SUBSCRIPTION,
  PREMIUM_REFERRAL = 35,
  GUILD_INCIDENT_ALERT_MODE_ENABLED,
  GUILD_INCIDENT_ALERT_MODE_DISABLED,
  GUILD_INCIDENT_REPORT_RAID,
  GUILD_INCIDENT_REPORT_FALSE_ALARM,
  GUILD_DEADCHAT_REVIVE_PROMPT,
  CUSTOM_GIFT,
  GUILD_GAMING_STATS_PROMPT,
  PURCHASE_NOTIFICATION = 44,
  POLL_RESULT = 46,
  CHANGELOG,
  NITRO_NOTIFICATION,
}

export const enum MessageReferenceTypes {
  DEFAULT = 0,
  FORWARD,
}

export const enum DefaultMessageNotificationLevels {
  ALL_MESSAGES = 0,
  ONLY_MENTIONS = 1,
}

export const enum ExplicitContentFilterLevels {
  DISABLED = 0,
  MEMBERS_WITHOUT_ROLES = 1,
  ALL_MEMBERS = 2,
}

export const enum GuildScheduledEventEntityTypes {
  STAGE_INSTANCE = 1,
  VOICE = 2,
  EXTERNAL = 3,
}

export const enum GuildScheduledEventPrivacyLevels {
  GUILD_ONLY = 2,
}

export const enum GuildScheduledEventStatuses {
  SCHEDULED = 1,
  ACTIVE = 2,
  COMPLETED = 3,
  CANCELED = 4,
}

export const enum InteractionResponseTypes {
  PONG = 1,
  CHANNEL_MESSAGE_WITH_SOURCE = 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE = 5,
  DEFERRED_MESSAGE_UPDATE = 6,
  UPDATE_MESSAGE = 7,
  APPLICATION_COMMAND_AUTOCOMPLETE_RESULT = 8,
  MODAL = 9,
}

export const enum InteractionTypes {
  PING = 1,
  APPLICATION_COMMAND = 2,
  MESSAGE_COMPONENT = 3,
  APPLICATION_COMMAND_AUTOCOMPLETE = 4,
  MODAL_SUBMIT = 5,
}

export const enum InviteTargetTypes {
  STREAM = 1,
  EMBEDDED_APPLICATION,
  ROLE_SUBSCRIPTIONS,
  CREATOR_PAGE,
}

export const enum InviteTypes {
  GUILD,
  GROUP_DM,
  FRIEND,
}

export const enum MembershipStates {
  INVITED = 1,
  ACCEPTED = 2,
}

export const enum MessageButtonStyles {
  PRIMARY = 1,
  SECONDARY = 2,
  SUCCESS = 3,
  DANGER = 4,
  LINK = 5,
}

export const enum MessageComponentTypes {
  ACTION_ROW = 1,
  BUTTON = 2,
  STRING_SELECT = 3,
  TEXT_INPUT = 4,
  USER_SELECT = 5,
  ROLE_SELECT = 6,
  MENTIONABLE_SELECT = 7,
  CHANNEL_SELECT = 8,
}

export const enum SelectMenuComponentTypes {
  STRING_SELECT = 3,
  USER_SELECT = 5,
  ROLE_SELECT = 6,
  MENTIONABLE_SELECT = 7,
  CHANNEL_SELECT = 8,
}

export const enum MFALevels {
  NONE = 0,
  ELEVATED = 1,
}

export const enum NSFWLevels {
  DEFAULT = 0,
  EXPLICIT = 1,
  SAFE = 2,
  AGE_RESTRICTED = 3,
}

export const enum OverwriteTypes {
  role = 0,
  member = 1,
}

export const enum PremiumTiers {
  NONE = 0,
  TIER_1 = 1,
  TIER_2 = 2,
  TIER_3 = 3,
}

export const enum PrivacyLevels {
  PUBLIC = 1,
  GUILD_ONLY = 2,
}

export const enum StickerFormatTypes {
  PNG = 1,
  APNG = 2,
  LOTTIE = 3,
  GIF = 4,
}

export const enum StickerTypes {
  STANDARD = 1,
  GUILD = 2,
}

export const enum TextInputStyles {
  SHORT = 1,
  PARAGRAPH = 2,
}

export const enum VerificationLevels {
  NONE = 0,
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  VERY_HIGH = 4,
}

export const enum VideoQualityModes {
  AUTO = 1,
  FULL = 2,
}

export const enum ReactionTypes {
  NORMAL = 0,
  BURST = 1,
}

export const enum WebhookTypes {
  Incoming = 1,
  'Channel Follower' = 2,
  Application = 3,
}

export enum ApplicationRoleConnectionMetadataTypes {
  INTEGER_LESS_THAN_OR_EQUAL = 1,
  INTEGER_GREATER_THAN_OR_EQUAL,
  INTEGER_EQUAL,
  INTEGER_NOT_EQUAL,
  DATATIME_LESS_THAN_OR_EQUAL,
  DATATIME_GREATER_THAN_OR_EQUAL,
  BOOLEAN_EQUAL,
  BOOLEAN_NOT_EQUAL,
}

export const enum RelationshipTypes {
  NONE = 0,
  FRIEND = 1,
  BLOCKED = 2,
  PENDING_INCOMING = 3,
  PENDING_OUTGOING = 4,
  IMPLICIT = 5,
}

export const enum RelationshipTypes {
  NONE = 0,
  FRIEND = 1,
  BLOCKED = 2,
  PENDING_INCOMING = 3,
  PENDING_OUTGOING = 4,
  IMPLICIT = 5,
}

export const enum ReadStateTypes {
  CHANNEL = 0,
  GUILD_SCHEDULED_EVENT = 1,
  NOTIFICATION_CENTER = 2,
  GUILD_HOME = 3,
  GUILD_ONBOARDING_QUESTION = 4,
  MESSAGE_REQUESTS = 5,
}
