const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const configFilePath = './git-version.config.json';
const config = fs.existsSync(configFilePath)
  ? JSON.parse(fs.readFileSync(configFilePath, 'utf8'))
  : [];

const workingDirPath = process.argv.length > 2 ? process.argv[2] : '.';
if (!fs.existsSync(workingDirPath) || !fs.lstatSync(workingDirPath).isDirectory()) {
  console.error(`Invalid directory ${workingDirPath}`);
  process.exit(1);
}

const outFilePath = process.argv.length > 3 ? process.argv[3] : null;

const execGetOutput = async (command, cwd) => new Promise(resolve =>
  exec(command, { cwd }, (error, stdout) => {
    resolve(error ? null : (stdout || '').trim());
  }));

const execGetExitCode = async (command, cwd) => new Promise(resolve =>
  exec(command, { cwd }, (error) => {
    resolve(error ? error.code : 0);
  }));

async function getGitInfo(dirPath, versionTagPrefix) {
  const repository = await execGetOutput('git config --get remote.origin.url', dirPath);
  const branch = await execGetOutput('git rev-parse --abbrev-ref HEAD', dirPath);
  const sha1 = await execGetOutput('git rev-parse HEAD', dirPath);
  const date = await execGetOutput('git --no-pager log --pretty=format:"%aI" -n1', dirPath);
  const diffExitCode = await execGetExitCode('git diff-index --quiet HEAD --', dirPath);

  const version = versionTagPrefix && versionTagPrefix.length > 0
    ? await execGetOutput(`git describe --tags --match "${versionTagPrefix}" HEAD`, dirPath)
    : undefined;

  return {
    version,
    git: {
      repository,
      branch,
      sha1,
      date,
      clean: (diffExitCode === 0)
    }
  };
}

Promise.all(config.map(async item => (
  {
    id: item.id,
    name: item.name,
    ...await getGitInfo(path.join(workingDirPath, item.path || '.'), item.versionTagPrefix),
  }
))).then((versions) => {
  const appId = 'app';
  const app = versions.find(c => c.id === appId);
  if (!app) {
    console.error(`Expected an item with id '${appId}' in '${configFilePath}'`);
    process.exit(1);
  }

  let appVersion = app.version;
  if (!appVersion || appVersion.length < 1) {
    const appConfig = config.find(c => c.id === appId);
    appVersion = appConfig.version;
  }

  const components = versions.filter(c => c.id !== appId);

  const version = {
    name: app.name,
    version: appVersion,
    components,
  };

  const json = JSON.stringify(version, null, 2);

  if (outFilePath) {
    fs.writeFile(outFilePath, json, (err) => {
      if (err) { console.error(err); }
    });
  } else {
    console.log(json);
  }
});
