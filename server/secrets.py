MBTA_V3_API_KEY = ''
POSTGRES_DB = 'newtrains'
POSTGRES_USER = 'ian'  # No password; unix account auth
'''
If you put your api key here, you may want to run
`git update-index --assume-unchanged server/secrets.py`
so that it doesn't pollute your `git status`

To make that more convenient, you may want to add these aliases to ~/.gitconfig

[alias]
  hide = update-index --assume-unchanged
  unhide = update-index --no-assume-unchanged
  hidden = !git ls-files -v | grep "^[[:lower:]]"

Then run `git hide server/secrets.py`
'''
