# Emblemas (badges)

Coloque os PNGs dos emblemas nesta pasta, nomeados pelo código do emblema
(ex.: `1.png`, `2.png`, `100.png`).

Depois, em `src/lib/badges-catalog.ts`, ache a entrada com o `code`
correspondente e mude `iconUrl: null` para `iconUrl: "/badges/1.png"`.

O catálogo é sincronizado automaticamente com o banco toda vez que a página
de Emblemas é aberta - não precisa rodar nenhum script.

Para criar um novo emblema:
1. Adicione um PNG aqui.
2. Adicione uma entrada no array `BADGES_CATALOG` com `code` único.
3. Se for um emblema secreto, defina `secretWord`.
