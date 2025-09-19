import { cosmiconfig } from "cosmiconfig";

import type { CommitConfig } from "./git";
import { debug, error } from "./log";

const defaultConfig: CommitConfig = {
  allowEmptyCommitMessage: false,
  allowReplaceAllOccurrences: true,
  commentChar: "#",
  gitRoot: "",
  ignoredBranchesPattern: "^(master|main|dev|develop|development|release)$",
  ignoreBranchesMissingTickets: false,
  isConventionalCommit: false,
  conventionalCommitPattern: "^([a-z]+)(\\([a-z0-9.,-_ ]+\\))?!?: ([\\w \\S]+)$",
  jiraTicketPattern: "([A-Z]+-\\d+)",
  messagePattern: "[$J] $M",
};

function resolveConfig(configPath: string) {
  try {
    return require.resolve(configPath);
  } catch {
    return configPath;
  }
}

export async function loadConfig(configPath?: string): Promise<CommitConfig> {
  try {
    const explorer = cosmiconfig("prepare-commit-msg", {
      searchPlaces: [
        "package.json",
        ".preparecommitmsgrc",
        ".preparecommitmsgrc.json",
        ".preparecommitmsgrc.yaml",
        ".preparecommitmsgrc.yml",
        "prepare-commit-msg.config.js",
      ],
    });

    const config = configPath ? await explorer.load(resolveConfig(configPath)) : await explorer.search();

    debug(`Loaded config: ${JSON.stringify(config)}`);

    if (config && !config.isEmpty) {
      const result = { ...defaultConfig, ...config.config };
      debug(`Used config: ${JSON.stringify(result)}`);
      return result;
    }
  } catch (err) {
    error(`Loading configuration failed with error: ${err}`);
  }

  const result = { ...defaultConfig };
  debug(`Used config: ${JSON.stringify(result)}`);
  return result;
}
