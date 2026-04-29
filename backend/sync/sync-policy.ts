export const syncPolicy = {
  localAuthority: "sqlite",
  cloudReplica: "postgres",
  excludeFromSync: ["private_memory", "private_session", "private_notes"],
};
