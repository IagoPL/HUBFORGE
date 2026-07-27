# SSH commit signing (optional)

If an SSH key is already registered on GitHub for `IagoPL`:

```bash
git config --local gpg.format ssh
git config --local user.signingkey ~/.ssh/<your-key>.pub
git config --local commit.gpgsign true
```

Do not generate or publish private keys from automation.

Bootstrap continues without signing when author name/email are correctly set.
