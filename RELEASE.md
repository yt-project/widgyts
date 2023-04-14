Some of this is covered by the Github action, but for posterity, to release a
new version of widgyts on PyPI:

1. Update package.json and setup.cfg to update version and remove `dev`
2. `git add package.json setup.cfg`
3. `git commit -m "Bumping version"`
4. `python setup.py sdist upload # Covered by the GHA`
5. `python setup.py bdist_wheel upload # Covered by the GHA`
6. `git tag -a vX.X.X -m 'comment'`
7. `git push --tags`
8. `jlpm install # Covered by the GHA`
9. `jlpm publish # Covered by the GHA`
