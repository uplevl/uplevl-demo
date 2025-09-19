#!/usr/bin/env node
import { loadConfig } from "./config.js";
import { getBranchName, getJiraTicket, getRoot, writeJiraTicket } from "./git.js";
import { error, log } from "./log.js";

(async () => {
  log("start");

  try {
    const config = await loadConfig();
    const gitRoot = getRoot(config.gitRoot);
    const branch = getBranchName(gitRoot);

    const ignored = new RegExp(config.ignoredBranchesPattern || "^$", "i");

    if (ignored.test(branch)) {
      log("The branch is ignored by the configuration rule");
      return;
    }

    const ticket = getJiraTicket(branch, config);

    if (ticket === null) {
      if (config.ignoreBranchesMissingTickets) {
        log("The branch does not contain a JIRA ticket and is ignored by the configuration rule");
      } else {
        error("The JIRA ticket ID not found");
      }

      return;
    }

    log(`The JIRA ticket ID is: ${ticket}`);

    await writeJiraTicket(ticket, config);
  } catch (err) {
    if (typeof err === "string") {
      error(err);
    } else {
      error(String(err));
    }
  }

  log("done");
})();
