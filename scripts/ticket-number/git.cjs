const { isAbsolute, join, resolve } = require("node:path");

const { debug, log } = require("./log.cjs");

const gitVerboseStatusSeparator = "------------------------ >8 ------------------------";

function getMsgFilePath(gitRoot, index = 0) {
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

  // It is Husky 5
  if (process.env.HUSKY_GIT_PARAMS === undefined) {
    const messageFilePath = process.argv.find((arg) => arg.includes(".git"));
    if (messageFilePath) {
      return messageFilePath;
    } else {
      throw new Error(`You are using Husky 5. Please add $1 to jira-pre-commit-msg's parameters.`);
    }
  }

  // Husky 2-4 stashes git hook parameters $* into a HUSKY_GIT_PARAMS env var.
  const gitParams = process.env.HUSKY_GIT_PARAMS || "";

  // Throw a friendly error if the git params environment variable can't be found – the user may be missing Husky.
  if (!gitParams) {
    throw new Error(`The process.env.HUSKY_GIT_PARAMS isn't set. Is supported Husky version installed?`);
  }

  // Unfortunately, this will break if there are escaped spaces within a single argument;
  // I don't believe there's a workaround for this without modifying Husky itself
  return gitParams.split(" ")[index];
}

function escapeReplacement(str) {
  return str.replace(/[$]/, "$$$$"); // In replacement to escape $ needs $$
}

function replaceMessageByPattern(jiraTicket, message, pattern, replaceAll) {
  const jiraTicketRegExp = new RegExp("\\$J", replaceAll ? "g" : "");
  const messageRegExp = new RegExp("\\$M", replaceAll ? "g" : "");
  const result = pattern
    .replace(jiraTicketRegExp, escapeReplacement(jiraTicket))
    .replace(messageRegExp, escapeReplacement(message));

  debug(`Replacing message: ${result}`);

  return result;
}

function getMessageInfo(message, config) {
  debug(`Original commit message: ${message}`);

  const messageSections = message.split(gitVerboseStatusSeparator)[0];
  const lines = messageSections
    .trim()
    .split("\n")
    .map((line) => line.trimLeft())
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

function findFirstLineToInsert(lines, config) {
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

function insertJiraTicketIntoMessage(messageInfo, jiraTicket, config) {
  const message = messageInfo.originalMessage;
  const lines = message.split("\n").map((line) => line.trimLeft());

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

module.exports.gitRevParse = function gitRevParse(cwd = process.cwd(), gitRoot = "") {
  const args = [];

  // If git root is specified, checking existing work tree
  if (gitRoot !== "" && gitRoot !== ".") {
    log(`Git root is specified as ${gitRoot}`);

    args.push("--git-dir", gitRoot);
  }

  args.push("rev-parse", "--show-prefix", "--git-common-dir");

  // https://github.com/typicode/husky/issues/580
  // https://github.com/typicode/husky/issues/587
  const proc = Bun.spawnSync(["git", ...args], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });

  if (!proc.success) {
    throw new Error(proc.stderr?.toString() || "Unknown error");
  }

  const [prefix, gitCommonDir] = proc.stdout
    .toString()
    .split("\n")
    .map((s) => s.trim().replace(/\\\\/, "/"));

  return { prefix, gitCommonDir };
};

module.exports.getRoot = function getRoot(gitRoot) {
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

  return resolve(cwd, gitCommonDir);
};

module.exports.getBranchName = function getBranchName(gitRoot) {
  debug("gitBranchName");

  const cwd = process.cwd();
  const args = [];

  // If git root is specified, checking existing work tree
  if (gitRoot !== "" && gitRoot !== ".") {
    args.push("--git-dir", gitRoot);
  }

  args.push("symbolic-ref", "--short", "HEAD");

  const proc = Bun.spawnSync(["git", ...args], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });

  if (!proc.success) {
    throw new Error(proc.stderr?.toString() || "Unknown error");
  }

  return proc.stdout.toString().trim();
};

module.exports.getJiraTicket = function getJiraTicket(branchName, config) {
  debug("getJiraTicket");

  const jiraIdPattern = new RegExp(config.jiraTicketPattern, "i");
  const matched = jiraIdPattern.exec(branchName);
  const jiraTicket = matched && matched[0];

  return jiraTicket ?? null;
};

module.exports.writeJiraTicket = async function writeJiraTicket(jiraTicket, config) {
  debug("writeJiraTicket");

  const messageFilePath = getMsgFilePath(config.gitRoot);
  let message;

  // Read file with commit message
  try {
    message = await Bun.file(messageFilePath).text();
  } catch (ex) {
    console.error(ex);
    throw new Error(`Unable to read the file "${messageFilePath}".`);
  }

  const messageInfo = getMessageInfo(message, config);
  const messageWithJiraTicket = insertJiraTicketIntoMessage(messageInfo, jiraTicket, config);

  debug(messageWithJiraTicket);

  // Write message back to file
  try {
    await Bun.write(messageFilePath, messageWithJiraTicket);
  } catch (ex) {
    console.error(ex);
    throw new Error(`Unable to write the file "${messageFilePath}".`);
  }
};
