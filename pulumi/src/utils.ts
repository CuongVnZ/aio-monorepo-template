export const getCommitHash = () => {
  const commitHash = require("child_process")
    .execSync("git rev-parse --short=8 HEAD")
    .toString()
    .trim();
  return commitHash;
};

export const getPackageVersion = () => {
  const packageJson = require("../../package.json");
  return packageJson.version;
};
