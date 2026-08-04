# Finales de línea (LF)

HubForge normaliza el texto a **LF** en el repositorio y en el working tree.

## Política del repo

| Archivo                                            | Rol                                                           |
| -------------------------------------------------- | ------------------------------------------------------------- |
| [`.gitattributes`](../../.gitattributes)           | `text=auto eol=lf` (CRLF solo en `*.bat` / `*.cmd` / `*.ps1`) |
| [`.editorconfig`](../../.editorconfig)             | `end_of_line = lf` para editores                              |
| [`prettier.config.mjs`](../../prettier.config.mjs) | `endOfLine: "lf"` (alineado con CI)                           |

CI (`ubuntu-latest`) ejecuta `pnpm format:check` sobre LF. No mezcles renormalizaciones masivas con PRs de producto.

## Windows (recomendado)

1. En este clon: `git config --local core.autocrlf false`  
   (`.gitattributes` ya fuerza LF en checkout; desactivar `autocrlf` evita sorpresas en herramientas que leen el disco).
2. Opcional: `git config --local core.eol lf`.
3. No ejecutes `git add --renormalize .` sin autorización y sin revisar el impacto.
4. Si Prettier marca CRLF en el working tree tras un checkout antiguo:
   - confirma que `.gitattributes` está en la rama;
   - refresca archivos desde el índice (`git restore --source=HEAD --worktree -- .`) **solo** cuando no tengas cambios locales;
   - o vuelve a clonar la rama.

## Renormalización

Los blobs del índice de HubForge ya están en LF. Una renormalización masiva suele ser un no-op en el índice; el ruido histórico venía de `core.autocrlf=true` convirtiendo a CRLF en el disco. Si alguna vez hiciera falta renormalizar, hazlo en una rama `chore/` dedicada, con impacto revisado, y sin mezclar cambios funcionales.
