# get-git-version

Gets Git version and commit information for one or more repositories. This is useful for applications that span multiple repositories or use submodules.

## Prerequisites
[Git](https://git-scm.com/)

## Usage

- Create a `git-version.config.json` file which exports a simple array, similar to the example below:
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
    All entries are expected to have an `id`, a `name` and a `path`.
    
    An item whose `id` is `app` is required and treated as the main application. All other items are considered components of that application.

    If `versionTagPrefix` is specified, a `version` is computed for the component, based on the most recent git tag that starts with this prefix. If not specified, or a matching tag is not found, no `version` is computed.

- Run `npm start` or `yarn start` or `node version.js`

    The output for the example above will be similar to:
    ```json
    {
      "name": "Test App",
      "version": "0.1",
      "components": [
        {
          "id": "dummy",
          "name": "Dummy Component",
          "version": null,
          "git": {
            "repository": "https://github.com/polys/git-version.git",
            "branch": "master",
            "sha1": "fb6e2c4d7c6306c739b44d5fe549a6d018835232",
            "date": "2018-04-21T08:53:32+01:00",
            "clean": false
          }
        }
      ]
    }
    ```