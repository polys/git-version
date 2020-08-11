#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const commander = require('commander');

commander
  .option('-w, --working-dir [path]', 'set working directory', process.cwd())
  .option('-o, --out-file [path]', 'write output to a file instead of stdout')
  .option('-c, --config-file [path]', 'override default config file name', '.git-version.config.json')
  .option('--app-id [id]', 'override default application id', 'app')
  .option('--version-tag-prefix [prefix]', 'override default version tag prefix', 'v[0-9]*')
  .option('--no-repository', 'omit repository from the output JSON')
  .option('--no-pretty', 'disable pretty printing the output JSON')
  .option('--version-only', 'return only the version without git information')
  .parse(process.argv);

const {
  workingDir,
  outFile,
  configFile,
  appId,
  versionTagPrefix,
  pretty,
  repository,
  versionOnly
} = commander;

if (!workingDir || !fs.existsSync(workingDir) || !fs.lstatSync(workingDir).isDirectory()) {
  console.error(`Invalid working directory '${workingDir || ''}'`);
  process.exit(1);
}

const getDefaultApp = () => {
  const packageJsonFilePath = path.join(workingDir, 'package.json');
  if (fs.existsSync(packageJsonFilePath)) {
    const pack = JSON.parse(fs.readFileSync(packageJsonFilePath, 'utf8'));
    return {
      id: appId,
      name: pack.name,
      version: pack.version,
      versionTagPrefix
    };
  }
  return {
    id: appId,
    name: path.basename(workingDir),
    versionTagPrefix
  };
};

const configFilePath = path.join(workingDir, configFile);
const config = fs.existsSync(configFilePath)
  ? JSON.parse(fs.readFileSync(configFilePath, 'utf8'))
  : [getDefaultApp()];

const outFilePath = outFile ? path.join(workingDir, outFile) : null;

const appConfig = config.find(c => c.id === appId);
if (!appConfig) {
  console.error(`Expected an item with id '${appId}' in '${configFilePath}'`);
  process.exit(1);
}

const execGetOutput = async (command, cwd) => new Promise(resolve =>
  exec(command, { cwd }, (error, stdout) => {
    resolve(error ? null : (stdout || '').trim());
  }));

const execGetExitCode = async (command, cwd) => new Promise(resolve =>
  exec(command, { cwd }, (error) => {
    resolve(error ? error.code : 0);
  }));

async function getGitInfo(dirPath, describeMatchPrefix) {
  const remoteUrl = repository ? await execGetOutput('git config --get remote.origin.url', dirPath) : undefined;
  const branch = await execGetOutput('git rev-parse --abbrev-ref HEAD', dirPath);
  const sha1 = await execGetOutput('git rev-parse HEAD', dirPath);
  const dateUnix = await execGetOutput('git --no-pager log --pretty=format:"%at" -n1', dirPath);
  const diffExitCode = await execGetExitCode('git diff-index --quiet HEAD --', dirPath);

  const version = describeMatchPrefix && describeMatchPrefix.length > 0
    ? await execGetOutput(`git describe --tags --match "${describeMatchPrefix}" HEAD`, dirPath)
    : undefined;

  return {
    version,
    git: {
      repository: remoteUrl,
      branch,
      sha1,
      date: dateUnix ? new Date(1000 * dateUnix) : undefined,
      clean: (diffExitCode === 0)
    }
  };
}

Promise.all(config.map(async item => (
  {
    id: item.id,
    name: item.name,
    ...await getGitInfo(path.join(workingDir, item.path || '.'), item.versionTagPrefix),
  }
))).then((versions) => {
  const app = versions.find(c => c.id === appId);
  const components = versions.filter(c => c.id !== appId);

  let version = {
    name: app.name,
    version: app.version || appConfig.version
  };

  if (!versionOnly) {
    version = Object.assign(version, {
      git: app.git,
      components: components.length ? components : undefined
    });
  }

  const json = JSON.stringify(version, undefined, pretty ? 2 : 0);

  if (outFilePath) {
    fs.writeFile(outFilePath, json, (err) => {
      if (err) { console.error(err); }
    });
  } else {
    console.log(json);
  }
});
