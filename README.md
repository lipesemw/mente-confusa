# 🧠 Mente Confusa

Quiz de pegadinhas, lógica, curiosidades e desafios, feito para jogar no celular e funcionar offline.

## Modos de jogo

- **Trilha:** 18 fases em 6 mundos (pegadinhas, lógica, mundo, curiosidades, matemática e palavras).
- **Desafio diário:** 10 perguntas novas por dia, com recompensa extra.
- **Com amigos no mesmo celular:** até 4 jogadores passando o aparelho.
- **Online:** cada um no seu celular, entrando na mesma sala por um código de 5 letras.

## Recursos

- PWA instalável com funcionamento offline.
- Ranking local, moedas, loja de ajudas, combos e estrelas.
- 155 perguntas com explicação.

## Rodar localmente

Basta servir a pasta com qualquer servidor HTTP, por exemplo:

```bash
npx serve .
```

Para o modo online é necessária internet (as salas usam um broker MQTT público).

## Tecnologia

HTML, CSS e JavaScript puro, sem build. Service worker em `sw.js` e manifesto em `manifest.webmanifest`.
