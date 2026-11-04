# MuscleLib Docs

Documentação estática da API MuscleLib, publicada em inglês, português e espanhol.

## Para editar

- Frases da página inicial, documentação e erro 404: edite o valor em `docs/content/<idioma>/ui.json`. Mantenha a chave antes de `:`.
- Termos e privacidade: edite `terms.md` ou `privacy.md` na pasta do idioma.
- Estatísticas da página inicial: atualize `docs/content/stats.json` com a contagem verificada no repositório `MuscleLib/musclelib-api`, incluindo a data e o commit de origem. Conte arquivos JSON diretamente em `exercises/` e arquivos de imagem dentro das pastas de exercícios separadamente; não presuma duas imagens por exercício.
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

O site pronto fica em `dist/`. Esse diretório é gerado do zero a cada build e não deve ser versionado. A fonte oficial permanece em `docs/`.

O deploy da Vercel executa `npm run build` automaticamente e publica o conteúdo gerado em `dist/`.
