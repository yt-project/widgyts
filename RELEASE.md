Some of this is covered by the GitHub action, but for posterity, to release a
new version of widgyts on PyPI and npm:

1. Update the version in `package.json` (the Python package version is read
   from it by `hatch-nodejs-version`). Equivalently, `pip install hatch` and run
   `hatch version <new_version>`.
2. `git add package.json`
3. `git commit -m "Bumping version"`
4. `git tag -a vX.X.X -m 'comment'`
5. `git push --tags`

Pushing a `v*` tag triggers `.github/workflows/publish-to-pypi.yml`, which:

- checks that the tag matches the version in `package.json`
- builds the sdist and wheel with `python -m build` and uploads them to PyPI
- builds the extension with `jlpm build:prod` and runs `npm publish`

Both uploads use trusted publishing, so no PyPI or npm tokens are stored in
the repository. The one-time setup (a trusted publisher entry on pypi.org for
`widgyts` and on npmjs.com for `@yt-project/yt-widgets`) is described at the
top of the workflow file. The tag must be pushed to `yt-project/widgyts`, not
a fork, for the publishers to accept it.

To build the distributions locally: `pip install build && python -m build`.
