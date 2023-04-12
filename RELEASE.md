- To release a new version of widgyts on PyPI:

Update package.json and setup.cfg to update version and remove `dev`
`git add package.json setup.cfg`
`git commit -m "Bumping version"`
`python setup.py sdist upload`
`python setup.py bdist_wheel upload`
`git tag -a X.X.X -m 'comment'`
Update _version.py (add 'dev' and increment minor)
git add and git commit
git push
git push --tags

- To release a new version of yt-widgets on NPM:

```
# clean out the `dist` and `node_modules` directories
git clean -fdx
npm install
npm publish
```
