import { execSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";

import { debug, log } from "./log";

/**
 * Configuration interface for the commit message preparation
 */
export interface CommitConfig {
  allowEmptyCommitMessage: boolean;
  allowReplaceAllOccurrences: boolean;
  commentChar: string;
  gitRoot: string;
  ignoredBranchesPattern: string;
  ignoreBranchesMissingTickets: boolean;
  isConventionalCommit: boolean;
  conventionalCommitPattern: string;
  jiraTicketPattern: string;
  messagePattern: string;
}

/**
 * Git rev-parse result interface
 */
export interface GitRevParseResult {
  prefix: string;
  gitCommonDir: string;
}

/**
 * Message info interface for commit message analysis
 */
export interface MessageInfo {
  cleanMessage: string;
  originalMessage: string;
  hasAnyText: boolean;
  hasUserText: boolean;
  hasVerboseText: boolean;
}

const gitVerboseStatusSeparator = "------------------------ >8 ------------------------";

function getMsgFilePath(gitRoot: string, index = 0): string {
  debug("getMsgFilePath");

  if (gitRoot.length > 0) {
    // At first looking into this path, then if it's empty trying other ways
    if (!isAbsolute(gitRoot)) {
      const cwd = process.cwd();

      log(`Resolving .git path from ${cwd}`);

      gitRoot = resolve(cwd, gitRoot);
    }

    if (!gitRoot.includes(".git")) {
      gitRoot = join(gitRoot, ".git");
    }

    return join(gitRoot, "COMMIT_EDITMSG");
  }

  // Modern Husky (v5+) passes arguments directly via process.argv
  // The commit message file path should be the first argument after the script name
  if (process.env.HUSKY_GIT_PARAMS === undefined) {
    // Look for the commit message file path in process.argv
    // It should be at index 2 (after node and script path)
    const messageFilePath = process.argv[2];
    if (messageFilePath?.includes("COMMIT_EDITMSG")) {
      debug(`Found commit message file path: ${messageFilePath}`);
      return messageFilePath;
    }

    // Fallback: search for any argument that looks like a git file path
    const gitFilePath = process.argv.find((arg) => arg.includes(".git") || arg.includes("COMMIT_EDITMSG"));
    if (gitFilePath) {
      debug(`Found git file path: ${gitFilePath}`);
      return gitFilePath;
    }

    throw new Error(
      `You are using Husky 5+. Please ensure $1 is passed to the script. Received args: ${JSON.stringify(process.argv)}`,
    );
  }

  // Legacy Husky 2-4 stashes git hook parameters $* into a HUSKY_GIT_PARAMS env var.
  const gitParams = process.env.HUSKY_GIT_PARAMS || "";

  // Throw a friendly error if the git params environment variable can't be found – the user may be missing Husky.
  if (!gitParams) {
    throw new Error(`The process.env.HUSKY_GIT_PARAMS isn't set. Is supported Husky version installed?`);
  }

  // Unfortunately, this will break if there are escaped spaces within a single argument;
  // I don't believe there's a workaround for this without modifying Husky itself
  const params = gitParams.split(" ");
  if (index >= params.length) {
    throw new Error(`Invalid parameter index ${index}. Available parameters: ${JSON.stringify(params)}`);
  }
  return params[index];
}

function escapeReplacement(str: string): string {
  return str.replace(/[$]/, "$$$$"); // In replacement to escape $ needs $$
}

function replaceMessageByPattern(jiraTicket: string, message: string, pattern: string, replaceAll: boolean): string {
  const jiraTicketRegExp = new RegExp("\\$J", replaceAll ? "g" : "");
  const messageRegExp = new RegExp("\\$M", replaceAll ? "g" : "");
  const result = pattern
    .replace(jiraTicketRegExp, escapeReplacement(jiraTicket))
    .replace(messageRegExp, escapeReplacement(message));

  debug(`Replacing message: ${result}`);

  return result;
}

function getMessageInfo(message: string, config: CommitConfig): MessageInfo {
  debug(`Original commit message: ${message}`);

  const messageSections = message.split(gitVerboseStatusSeparator)[0];
  const lines = messageSections
    .trim()
    .split("\n")
    .map((line) => line.trimStart())
    .filter((line) => !line.startsWith(config.commentChar));

  const cleanMessage = lines.join("\n").trim();

  debug(`Clean commit message (${cleanMessage.length}): ${cleanMessage}`);

  return {
    cleanMessage,
    originalMessage: message,
    hasAnyText: message.length !== 0,
    hasUserText: cleanMessage.length !== 0,
    hasVerboseText: message.includes(gitVerboseStatusSeparator),
  };
}

function findFirstLineToInsert(lines: string[], config: CommitConfig): number {
  let firstNotEmptyLine = -1;

  for (let i = 0; i < lines.length; ++i) {
    const line = lines[i];

    // ignore everything after commentChar or the scissors comment, which present when doing a --verbose commit,
    // or `git config commit.status true`
    if (line === gitVerboseStatusSeparator) {
      break;
    }

    if (line.startsWith(config.commentChar)) {
      continue;
    }

    if (firstNotEmptyLine === -1) {
      firstNotEmptyLine = i;
      break;
    }
  }

  return firstNotEmptyLine;
}

function insertJiraTicketIntoMessage(messageInfo: MessageInfo, jiraTicket: string, config: CommitConfig): string {
  const message = messageInfo.originalMessage;
  const lines = message.split("\n").map((line) => line.trimStart());

  if (!messageInfo.hasUserText) {
    debug(`User didn't write the message. Allow empty commit is ${String(config.allowEmptyCommitMessage)}`);

    const preparedMessage = replaceMessageByPattern(
      jiraTicket,
      "",
      config.messagePattern,
      config.allowReplaceAllOccurrences,
    );

    if (messageInfo.hasAnyText) {
      const insertedMessage = config.allowEmptyCommitMessage
        ? preparedMessage
        : `# ${preparedMessage}\n` +
          "# JIRA prepare commit msg > " +
          "Please uncomment the line above if you want to insert JIRA ticket into commit message";

      lines.unshift(insertedMessage);
    } else {
      if (config.allowEmptyCommitMessage) {
        lines.unshift(preparedMessage);
      } else {
        debug(`Commit message is empty. Skipping...`);
      }
    }
  } else {
    const firstLineToInsert = findFirstLineToInsert(lines, config);

    debug(`First line to insert is: ${firstLineToInsert > -1 ? lines[firstLineToInsert] : ""} (${firstLineToInsert})`);

    if (firstLineToInsert !== -1) {
      const line = lines[firstLineToInsert];

      if (config.isConventionalCommit) {
        debug(`Finding conventional commit in: ${line}`);
        const conventionalCommitRegExp = new RegExp(config.conventionalCommitPattern, "g");
        conventionalCommitRegExp.lastIndex = -1;
        const [match, type, scope, msg] = conventionalCommitRegExp.exec(line) ?? [];
        if (match) {
          debug(`Conventional commit message: ${match}`);

          if (!msg.includes(jiraTicket)) {
            const replacedMessage = replaceMessageByPattern(
              jiraTicket,
              msg,
              config.messagePattern,
              config.allowReplaceAllOccurrences,
            );
            lines[firstLineToInsert] = `${type}${scope || ""}: ${replacedMessage}`;
          }
        }
      } else if (!line.includes(jiraTicket)) {
        lines[firstLineToInsert] = replaceMessageByPattern(
          jiraTicket,
          line || "",
          config.messagePattern,
          config.allowReplaceAllOccurrences,
        );
      }
    }

    // Add jira ticket into the message in case of missing
    if (lines.every((line) => !line.includes(jiraTicket))) {
      lines[0] = replaceMessageByPattern(
        jiraTicket,
        lines[0] || "",
        config.messagePattern,
        config.allowReplaceAllOccurrences,
      );
    }
  }

  return lines.join("\n");
}

/**
 * Executes git rev-parse command to get git information
 */
export function gitRevParse(cwd = process.cwd(), gitRoot = ""): GitRevParseResult {
  const args = [];

  // If git root is specified, checking existing work tree
  if (gitRoot !== "" && gitRoot !== ".") {
    log(`Git root is specified as ${gitRoot}`);

    args.push("--git-dir", gitRoot);
  }

  args.push("rev-parse", "--show-prefix", "--git-common-dir");

  // https://github.com/typicode/husky/issues/580
  // https://github.com/typicode/husky/issues/587
  try {
    const output = execSync(`git ${args.join(" ")}`, {
      cwd,
      encoding: "utf8",
    });

    // Split by newlines but don't trim the whole output first to preserve empty lines
    const lines = output.split("\n").map((s) => s.replace(/\\\\/, "/"));

    // The first line is prefix, second line is gitCommonDir
    // If there are fewer lines, fill with empty strings
    const prefix = lines[0] || "";
    const gitCommonDir = (lines[1] || "").trim(); // Only trim the gitCommonDir

    return { prefix, gitCommonDir };
  } catch (error) {
    throw new Error(`Git command failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Gets the git root directory
 */
export function getRoot(gitRoot: string): string {
  debug("getRoot");

  const cwd = process.cwd();

  const { gitCommonDir } = gitRevParse(cwd, gitRoot);

  // Git rev-parse returns unknown options as is.
  // If we get --absolute-git-dir in the output,
  // it probably means that an old version of Git has been used.
  // There seem to be a bug with --git-common-dir that was fixed in 2.13.0.
  // See issues above.
  if (gitCommonDir === "--git-common-dir") {
    throw new Error("Husky requires Git >= 2.13.0, please upgrade Git");
  }

  // Handle empty gitCommonDir
  if (!gitCommonDir) {
    throw new Error("Git common directory not found");
  }

  return resolve(cwd, gitCommonDir);
}

/**
 * Gets the current git branch name
 */
export function getBranchName(gitRoot: string): string {
  debug("gitBranchName");

  const cwd = process.cwd();
  const args = [];

  // If git root is specified, checking existing work tree
  if (gitRoot !== "" && gitRoot !== ".") {
    args.push("--git-dir", gitRoot);
  }

  args.push("symbolic-ref", "--short", "HEAD");

  try {
    const output = execSync(`git ${args.join(" ")}`, {
      cwd,
      encoding: "utf8",
    });

    return output.trim();
  } catch (error) {
    throw new Error(`Git command failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Extracts JIRA ticket from branch name
 */
export function getJiraTicket(branchName: string, config: CommitConfig): string | null {
  debug("getJiraTicket");

  const jiraIdPattern = new RegExp(config.jiraTicketPattern, "i");
  const matched = jiraIdPattern.exec(branchName);
  const jiraTicket = matched?.[0];

  return jiraTicket ?? null;
}

/**
 * Writes JIRA ticket to commit message file
 */
export async function writeJiraTicket(jiraTicket: string, config: CommitConfig): Promise<void> {
  debug("writeJiraTicket");

  const messageFilePath = getMsgFilePath(config.gitRoot);
  let message: string;

  // Read file with commit message
  try {
    message = await readFile(messageFilePath, "utf8");
  } catch (ex) {
    console.error(ex);
    throw new Error(`Unable to read the file "${messageFilePath}".`);
  }

  const messageInfo = getMessageInfo(message, config);
  const messageWithJiraTicket = insertJiraTicketIntoMessage(messageInfo, jiraTicket, config);

  debug(messageWithJiraTicket);

  // Write message back to file
  try {
    await writeFile(messageFilePath, messageWithJiraTicket, "utf8");
  } catch (ex) {
    console.error(ex);
    throw new Error(`Unable to write the file "${messageFilePath}".`);
  }
}
