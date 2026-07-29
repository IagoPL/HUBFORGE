# Firma de commits por SSH (opcional)

Si ya hay una clave SSH registrada en GitHub para `IagoPL`:

```bash
git config --local gpg.format ssh
git config --local user.signingkey ~/.ssh/<your-key>.pub
git config --local commit.gpgsign true
```

No generes ni publiques claves privadas desde automatización.

El bootstrap continúa sin firma cuando el nombre y el email del autor están bien configurados.
