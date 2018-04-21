# get-git-version

Gets Git version and commit information for one or more repositories. This is useful for applications that span multiple repositories or use submodules.

## Prerequisites
[Git](https://git-scm.com/) is expected to be preinstalled (and in `PATH`).

The script simply runs shell commands similar to:

  - repository: `git config --get remote.origin.url`
  - branch: `git rev-parse --abbrev-ref HEAD`
  - sha1: `git rev-parse HEAD`
  - date: `git --no-pager log --pretty=format:"%aI" -n1`
  - clean: `git diff-index --quiet HEAD --`
  - version: `git describe --tags --match "v[0-9]*" HEAD`

## Usage

To get information about the current directory, run:
```
node version.js
```

If the working directory contains a `package.json` file, it will be used to set the `name` and default `version`.

Otherwise, the name of the current folder is used as the `name` and `version` is not set.

## Sample Output

```json
{
  "name": "get-git-version",
  "version": "0.0.4",
  "git": {
    "repository": "https://github.com/polys/git-version.git",
    "branch": "master",
    "sha1": "dccb48950fa60511c3b235404209f17610aab67e",
    "date": "2018-04-21T17:31:35+01:00",
    "clean": false
  },
  "components": []
}
```

## Command-line Options

* `-w [path]` or `--working-dir [path]` overrides the working directory (defaults to the current directory)
* `-o [path]` or `--out-file [path]` writes the output to a file instead of `stdout`
* `-c [path]` or `--config-file [path]` overrides the config file name (defaults to `.git-version.config.json`)
* `--app-id [id]` overrides the application `id` (defaults to `app`)
* `--no-pretty` disables pretty printing the output JSON
* `-h` or `--help` outputs usage information

## Configuration file example

Create a `.git-version.config.json` file with a simple array, similar to:

```json
[
  {
    "id": "app",
    "name": "Test App",
    "path": ".",
    "versionTagPrefix": "v[0-9]*",
    "version": "0.1"
  },
  {
    "id": "dummy",
    "name": "Dummy Component",
    "path": ".",
    "versionTagPrefix": "v[0-9]*"
  }
]
```

All entries are expected to have an `id`.

If `name` is specified, it's simply copied to the output.

If `path` is specified, it's joined to the working directory path; otherwise, defaults to the working directory.

An item whose `id` is `app` (can be overridden using the `--app-id` command-line option) is required and treated as the main application. All other items are considered components of that application.

If `versionTagPrefix` is specified, a `version` is computed for the component, based on the most recent git tag that starts with this prefix. If not specified, or a matching tag is not found, no `version` is computed.
