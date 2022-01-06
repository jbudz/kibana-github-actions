"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = void 0;
const axios_1 = require("axios");
const core = require("@actions/core");
const exec_1 = require("@actions/exec");
const github_1 = require("@actions/github");
const backport_1 = require("backport");
const getConfig = async (repoOwner, repoName, branch, accessToken) => {
    const url = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${branch}/.backportrc.json`;
    const config = {
        method: 'get',
        url: url,
        headers: { Authorization: `token ${accessToken}` },
    };
    const resp = await (0, axios_1.default)(config);
    return resp.data;
};
exports.getConfig = getConfig;
async function init() {
    var _a;
    const { payload, repo } = github_1.context;
    if (!payload.pull_request) {
        throw Error('Only pull_request events are supported.');
    }
    const pullRequest = payload.pull_request;
    const owner = pullRequest.user.login;
    const branch = (_a = pullRequest === null || pullRequest === void 0 ? void 0 : pullRequest.base) === null || _a === void 0 ? void 0 : _a.ref;
    if (!branch) {
        throw Error("Can't determine PR base branch.");
    }
    const accessToken = core.getInput('github_token', { required: true });
    const commitUser = core.getInput('commit_user', { required: true });
    const commitEmail = core.getInput('commit_email', { required: true });
    const autoMerge = core.getInput('auto_merge', { required: true }) === 'true';
    const autoMergeMethod = core.getInput('auto_merge_method', { required: true });
    const targetPRLabels = core
        .getInput('target_pr_labels', { required: true })
        .split(',')
        .map((label) => label.trim());
    await (0, exec_1.exec)(`git config --global user.name "${commitUser}"`);
    await (0, exec_1.exec)(`git config --global user.email "${commitEmail}"`);
    const config = await (0, exports.getConfig)(repo.owner, repo.repo, branch, accessToken);
    await (0, backport_1.backportRun)({
        ...config,
        accessToken,
        fork: true,
        ci: true,
        pullNumber: pullRequest.number,
        targetPRLabels: targetPRLabels,
        assignees: [owner],
        autoMerge: autoMerge,
        autoMergeMethod: autoMergeMethod,
    });
}
init().catch((error) => {
    console.error('An error occurred', error);
    core.setFailed(error.message);
});
//# sourceMappingURL=index.js.map