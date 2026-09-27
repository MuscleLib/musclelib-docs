# MuscleLib Docs

Documentação estática da API MuscleLib, publicada em inglês, português e espanhol.

## Para editar

- Frases da página inicial, documentação e erro 404: edite o valor em `docs/content/<idioma>/ui.json`. Mantenha a chave antes de `:`.
- Termos e privacidade: edite `terms.md` ou `privacy.md` na pasta do idioma.
- Exemplos de respostas da API: edite `docs/content/examples.js`.
- Layout e estrutura HTML: edite os arquivos em `docs/templates/`.
- CSS, imagens e JavaScript: edite `docs/page/`.

Idiomas disponíveis: `en`, `pt` e `es`.

## Editar e visualizar

Inicie a prévia uma vez:

```bash
npm run dev
```

Abra <http://localhost:4173>. Ao salvar mudanças em `docs/`, o site é atualizado e o navegador recarrega sozinho. Edite os arquivos em `docs/`, não os arquivos gerados em `dist/`.

## Gerar para publicação

```bash
npm run build
```

O site pronto fica em `dist/`. O deploy da Vercel executa esse build automaticamente.