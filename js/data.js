/* Mente Confusa — base de conteúdo do jogo.
   Tudo é local: nenhuma pergunta depende de internet. */
(function () {
  'use strict';

  const WORLDS = [
    { id: 'pegadinhas',  name: 'Pegadinhas',   emoji: '🎭', color: '#ff5ca8', desc: 'A resposta óbvia costuma estar errada.' },
    { id: 'logica',      name: 'Lógica',       emoji: '🧩', color: '#39d9ff', desc: 'Padrões, dedução e um pouco de paciência.' },
    { id: 'geral',       name: 'Mundo',        emoji: '🌍', color: '#5cffb1', desc: 'Geografia, capitais e culturas.' },
    { id: 'curiosidades', name: 'Curiosidades', emoji: '🔬', color: '#ffd166', desc: 'Fatos estranhos, mas verdadeiros.' },
    { id: 'matematica',  name: 'Matemática',   emoji: '➗', color: '#9b5cff', desc: 'Contas rápidas sem calculadora.' },
    { id: 'palavras',    name: 'Palavras',     emoji: '📚', color: '#ff9f5c', desc: 'Português sem decoreba.' },
  ];

  /* Cada mundo tem 3 fases: dificuldade 1, 2 e 3. */
  const FASES = [
    { name: 'Aquecimento', difficulty: 1, seconds: 15, count: 5 },
    { name: 'Pressão',     difficulty: 2, seconds: 13, count: 5 },
    { name: 'Mestre',      difficulty: 3, seconds: 11, count: 5 },
  ];

  const POWERUPS = {
    fifty: { id: 'fifty', name: 'Eliminar 2', emoji: '✂️', price: 60, desc: 'Apaga duas alternativas erradas.' },
    time:  { id: 'time',  name: '+10 segundos', emoji: '⏱️', price: 40, desc: 'Ganha tempo na pergunta atual.' },
    skip:  { id: 'skip',  name: 'Pular', emoji: '⏭️', price: 30, desc: 'Passa a pergunta sem perder vida.' },
  };

  const AVATARS = ['🦊', '🐼', '🐙', '🦉', '🐸', '🦁', '🐯', '👾', '🤖', '🐺', '🦄', '🐨'];

  const DAILY = { count: 10, seconds: 12, lives: 3 };

  /* q: pergunta | a: alternativas | c: índice correto | e: explicação
     w: mundo | d: dificuldade (1 fácil, 2 média, 3 difícil) */
  const QUESTIONS = [

    /* ---------------- PEGADINHAS ---------------- */
    { w: 'pegadinhas', d: 1, q: 'Quantos meses do ano têm 28 dias?', a: ['1', '2', '6', 'Todos'], c: 3,
      e: 'Todos os meses têm pelo menos 28 dias — alguns têm exatamente 28.' },
    { w: 'pegadinhas', d: 1, q: 'O que pesa mais: 1 kg de algodão ou 1 kg de ferro?', a: ['Algodão', 'Ferro', 'Pesam igual', 'Depende do tamanho'], c: 2,
      e: 'Os dois pesam exatamente 1 kg.' },
    { w: 'pegadinhas', d: 1, q: 'Você tem 3 maçãs e pega 2. Com quantas maçãs você fica?', a: ['1', '2', '3', '5'], c: 1,
      e: 'Você fica com as 2 maçãs que pegou.' },
    { w: 'pegadinhas', d: 1, q: 'Se você ultrapassa a pessoa em 2º lugar, em que posição fica?', a: ['1º', '2º', '3º', '4º'], c: 1,
      e: 'Você assume o lugar dela: o 2º.' },
    { w: 'pegadinhas', d: 1, q: 'Quantos animais de cada espécie Moisés colocou na arca?', a: ['Um casal', 'Dois casais', 'Sete pares', 'Nenhum'], c: 3,
      e: 'Quem construiu a arca foi Noé, não Moisés.' },

    { w: 'pegadinhas', d: 2, q: 'Um avião cai exatamente na fronteira entre Brasil e Argentina. Onde enterram os sobreviventes?', a: ['No Brasil', 'Na Argentina', 'Na fronteira', 'Em lugar nenhum: não se enterram sobreviventes'], c: 3,
      e: 'Sobreviventes não são enterrados.' },
    { w: 'pegadinhas', d: 2, q: 'Uma família tem 6 filhos homens e cada um tem uma irmã. Quantas pessoas há na família?', a: ['7', '8', '9', '12'], c: 2,
      e: '6 filhos + 1 irmã (a mesma para todos) + 2 pais = 9 pessoas.' },
    { w: 'pegadinhas', d: 2, q: 'Se um tijolo pesa 1 kg mais meio tijolo, quanto pesa um tijolo?', a: ['1 kg', '1,5 kg', '2 kg', '2,5 kg'], c: 2,
      e: 'x = 1 + x/2, então x = 2 kg.' },
    { w: 'pegadinhas', d: 2, q: 'Você está correndo e ultrapassa o último colocado. Em que posição você fica?', a: ['Último', 'Penúltimo', 'Primeiro', 'É impossível ultrapassar o último'], c: 3,
      e: 'Não existe ninguém atrás do último para ultrapassar.' },
    { w: 'pegadinhas', d: 2, q: 'Um casal tem 4 filhas, e cada filha tem um irmão. Quantos filhos o casal tem?', a: ['4', '5', '8', '9'], c: 1,
      e: 'São 4 filhas e 1 único irmão: 5 filhos.' },

    { w: 'pegadinhas', d: 3, q: 'Você entra num quarto escuro com um fósforo. Há uma vela, uma lamparina e uma lareira. O que você acende primeiro?', a: ['A vela', 'A lamparina', 'A lareira', 'O fósforo'], c: 3,
      e: 'Sem acender o fósforo, nada mais acende.' },
    { w: 'pegadinhas', d: 3, q: 'Dois pais e dois filhos pescaram 3 peixes e cada um ficou com um. Como isso é possível?', a: ['Eram três pessoas: avô, pai e filho', 'Um deles não pescou', 'Os peixes eram pequenos', 'Um deles dividiu o peixe'], c: 0,
      e: 'Avô e pai são os dois pais; pai e filho são os dois filhos. Três pessoas.' },
    { w: 'pegadinhas', d: 3, q: 'Um trem elétrico viaja a 100 km/h para o norte. O vento sopra a 30 km/h para o sul. Para onde vai a fumaça?', a: ['Norte', 'Sul', 'Para cima', 'Não há fumaça'], c: 3,
      e: 'Trem elétrico não solta fumaça.' },
    { w: 'pegadinhas', d: 3, q: 'O médico receita 3 comprimidos, para tomar um a cada meia hora. Em quanto tempo você termina?', a: ['30 minutos', '1 hora', '1 hora e meia', '2 horas'], c: 1,
      e: 'Você toma no minuto 0, no 30 e no 60: uma hora no total.' },
    { w: 'pegadinhas', d: 3, q: 'Quantas vezes o algarismo 9 aparece de 1 a 100?', a: ['10', '11', '18', '19'], c: 3,
      e: 'Dez vezes nas unidades, dez nas dezenas, menos o 99 contado duas vezes: 19.' },

    /* ---------------- PEGADINHAS (novas) ---------------- */
    { w: 'pegadinhas', d: 1, q: 'Um galo está em cima de um telhado e canta. Para que lado cai o ovo?', a: ['Para a esquerda', 'Para a direita', 'Para o telhado', 'Galos não põem ovos'], c: 3,
      e: 'Quem põe ovos é a galinha. O galo só canta.' },
    { w: 'pegadinhas', d: 1, q: 'O pai de Maria tem 5 filhas: Nana, Nene, Nini, Nono e... qual é a quinta?', a: ['Nona', 'Maria', 'Nunu', 'Nene'], c: 1,
      e: 'A quinta filha é Maria, como diz o começo da pergunta.' },
    { w: 'pegadinhas', d: 1, q: 'Um fazendeiro tem 15 ovelhas e todas menos 8 morrem. Quantas sobram?', a: ['7', '8', '15', '0'], c: 1,
      e: '"Todas menos 8" significa que exatamente 8 continuam vivas.' },
    { w: 'pegadinhas', d: 1, q: 'Um homem pode se casar com a irmã da sua viúva?', a: ['Sim, é permitido', 'Não, ele já morreu', 'Só com autorização judicial', 'Sim, se ela concordar'], c: 1,
      e: 'Se ele tem uma viúva, ele morreu. Um morto não se casa.' },
    { w: 'pegadinhas', d: 1, q: 'Quantas vezes você pode subtrair 5 de 25?', a: ['Uma vez', 'Quatro vezes', 'Cinco vezes', 'Infinitas vezes'], c: 0,
      e: 'Só uma vez: depois de subtrair, você passa a subtrair de 20, não de 25.' },

    { w: 'pegadinhas', d: 2, q: 'Uma pessoa mora no 10º andar. Desce sempre de elevador até o térreo, mas na volta só vai até o 5º e sobe de escada. Por quê?', a: ['O elevador só chega ao 5º', 'Ela é baixa e não alcança o botão do 10º', 'Ela quer fazer exercício', 'O prédio tem apenas 5 andares'], c: 1,
      e: 'É o clássico enigma da pessoa baixa: ela alcança o botão do 5º, mas não o do 10º.' },
    { w: 'pegadinhas', d: 2, q: 'Uma garrafa e uma rolha custam R$ 1,10. A garrafa custa R$ 1,00 a mais que a rolha. Quanto custa a rolha?', a: ['R$ 0,05', 'R$ 0,10', 'R$ 0,55', 'R$ 1,00'], c: 0,
      e: 'Rolha + garrafa = 1,10 e garrafa = rolha + 1,00. Logo 2 × rolha = 0,10: a rolha custa R$ 0,05.' },
    { w: 'pegadinhas', d: 2, q: 'Um homem empurra o carro até um hotel e diz: "Estou falido!". O que aconteceu?', a: ['O carro quebrou na viagem', 'Ele está jogando Banco Imobiliário', 'O hotel cobrou pedágio', 'Ele perdeu a carteira'], c: 1,
      e: 'No Banco Imobiliário, cair no hotel de outro jogador pode falir você.' },
    { w: 'pegadinhas', d: 2, q: 'O que é seu, mas as outras pessoas usam mais do que você?', a: ['Seu celular', 'Seu nome', 'Sua casa', 'Seu tempo'], c: 1,
      e: 'Todo mundo fala o seu nome; você quase nunca o pronuncia.' },
    { w: 'pegadinhas', d: 2, q: 'Quanto mais você tira, maior ele fica. O que é?', a: ['Um buraco', 'Uma dívida', 'A saudade', 'Uma pilha'], c: 0,
      e: 'Cada pá de terra retirada aumenta o buraco.' },

    { w: 'pegadinhas', d: 3, q: 'Três caixas estão rotuladas "maçãs", "laranjas" e "mistas", mas todos os rótulos estão errados. Quantas frutas você precisa tirar para saber o conteúdo das três?', a: ['1', '2', '3', 'Nenhuma: é impossível'], c: 0,
      e: 'Tire da caixa "mistas": como o rótulo está errado, ela tem só um tipo. Isso revela as outras duas por eliminação.' },
    { w: 'pegadinhas', d: 3, q: 'Pai e filho sofrem um acidente. O pai morre. Na cirurgia, o médico diz: "Não posso operar, este é meu filho". Quem é o médico?', a: ['O pai, que sobreviveu', 'A mãe do menino', 'O irmão mais velho', 'Um impostor'], c: 1,
      e: 'O médico é a mãe. O enigma engana quem assume que todo médico é homem.' },
    { w: 'pegadinhas', d: 3, q: 'Uma mulher tem dois filhos que nasceram no mesmo dia, na mesma hora e no mesmo ano, mas não são gêmeos. Como?', a: ['São gêmeos, só que idênticos', 'São dois de trigêmeos', 'É impossível', 'Um deles foi adotado'], c: 1,
      e: 'Eles são dois de três irmãos trigêmeos: mesmo parto, mas não são um casal de gêmeos.' },
    { w: 'pegadinhas', d: 3, q: 'Um homem entra no bar e pede um copo de água. O barman saca uma arma. O homem agradece e vai embora. Por quê?', a: ['O barman impediu um assalto', 'Ele estava com soluço e levou um susto', 'A arma era de brinquedo', 'Ele queria ser expulso'], c: 1,
      e: 'O susto curou o soluço. O copo de água era para isso.' },
    { w: 'pegadinhas', d: 3, q: 'Duas moedas somam 30 centavos e uma delas não é de 10 centavos. Quais são as moedas?', a: ['10 e 20 centavos', '5 e 25 centavos', '15 e 15 centavos', 'Não é possível'], c: 0,
      e: 'Uma é de 10 e a outra de 20. A que "não é de 10" é justamente a de 20.' },

    /* ---------------- LÓGICA ---------------- */
    { w: 'logica', d: 1, q: 'Complete a sequência: 2, 4, 6, 8, ...', a: ['9', '10', '11', '12'], c: 1,
      e: 'A sequência soma 2 a cada termo.' },
    { w: 'logica', d: 1, q: 'Se A é maior que B e B é maior que C, quem é o menor?', a: ['A', 'B', 'C', 'Todos são iguais'], c: 2,
      e: 'A > B > C, então C é o menor.' },
    { w: 'logica', d: 1, q: 'Todos os gatos são animais. Alguns animais são pretos. Então...', a: ['Todo gato é preto', 'Nenhum gato é preto', 'Não se pode concluir que gatos sejam pretos', 'Gatos não são animais'], c: 2,
      e: 'Os animais pretos podem não ser gatos. A conclusão não é garantida.' },
    { w: 'logica', d: 1, q: 'Qual número vem depois: 1, 1, 2, 3, 5, 8, ...?', a: ['11', '12', '13', '15'], c: 2,
      e: 'Cada termo é a soma dos dois anteriores: 5 + 8 = 13.' },
    { w: 'logica', d: 1, q: 'Ana é mais velha que Bia, e Bia é mais velha que Carla. Quem é a mais nova?', a: ['Ana', 'Bia', 'Carla', 'Não dá para saber'], c: 2,
      e: 'A ordem é Ana > Bia > Carla.' },

    { w: 'logica', d: 2, q: 'Qual palavra não pertence ao grupo?', a: ['Maçã', 'Banana', 'Cenoura', 'Uva'], c: 2,
      e: 'Cenoura é legume; as outras são frutas.' },
    { w: 'logica', d: 2, q: 'Quantas faces, arestas e vértices tem um cubo?', a: ['6 faces, 8 arestas, 12 vértices', '6 faces, 12 arestas, 8 vértices', '8 faces, 12 arestas, 6 vértices', '12 faces, 6 arestas, 8 vértices'], c: 1,
      e: 'Um cubo tem 6 faces, 12 arestas e 8 vértices.' },
    { w: 'logica', d: 2, q: 'Hoje é quarta-feira. Que dia da semana será daqui a 100 dias?', a: ['Quinta', 'Sexta', 'Sábado', 'Domingo'], c: 1,
      e: '100 dividido por 7 deixa resto 2: quarta + 2 = sexta.' },
    { w: 'logica', d: 2, q: 'Na prateleira, o livro azul está à esquerda do vermelho e o verde à direita do vermelho. Qual está no meio?', a: ['Azul', 'Vermelho', 'Verde', 'Não dá para saber'], c: 1,
      e: 'A ordem é azul, vermelho, verde.' },
    { w: 'logica', d: 2, q: 'Quantos quadrados existem em uma grade 2 × 2 de quadradinhos?', a: ['4', '5', '6', '8'], c: 1,
      e: 'São 4 quadradinhos pequenos e 1 grande formado pelos quatro: 5.' },
    { w: 'logica', d: 2, q: 'Qual é o próximo termo: 1, 4, 9, 16, 25, ...?', a: ['30', '36', '42', '49'], c: 1,
      e: 'São os quadrados: 1², 2², 3², 4², 5² e 6² = 36.' },

    { w: 'logica', d: 3, q: 'Um caracol sobe 3 m por dia e escorrega 2 m à noite. O muro tem 10 m. Em quantos dias ele chega ao topo?', a: ['8', '9', '10', '12'], c: 0,
      e: 'Após 7 dias ele está a 7 m. No 8º dia sobe 3 m e chega aos 10 m antes de escorregar.' },
    { w: 'logica', d: 3, q: 'Se 5 máquinas fazem 5 peças em 5 minutos, em quanto tempo 100 máquinas fazem 100 peças?', a: ['1 minuto', '5 minutos', '20 minutos', '100 minutos'], c: 1,
      e: 'Cada máquina faz uma peça em 5 minutos. Cem máquinas fazem cem peças em 5 minutos.' },
    { w: 'logica', d: 3, q: 'Em uma sala, 5 pessoas se cumprimentam uma única vez. Quantos cumprimentos acontecem?', a: ['10', '15', '20', '25'], c: 0,
      e: '4 + 3 + 2 + 1 = 10 cumprimentos.' },
    { w: 'logica', d: 3, q: 'Duas cordas queimam em 60 min cada, mas em ritmo irregular. Como medir 45 min?', a: ['Acender as duas nas duas pontas', 'Acender uma nas duas pontas e a outra em uma ponta; ao terminar a primeira, acender a outra ponta da segunda', 'Cortar uma corda ao meio e acender', 'Acender uma ponta de cada corda'], c: 1,
      e: 'A primeira queima em 30 min. A segunda já queimou 30 min; acendendo a outra ponta, seus 30 min restantes viram 15. Total: 45.' },
    { w: 'logica', d: 3, q: 'Se 3 gatos pegam 3 ratos em 3 minutos, quantos gatos pegam 100 ratos em 100 minutos?', a: ['3', '33', '34', '100'], c: 0,
      e: 'Cada gato pega 1 rato a cada 3 minutos. Em 100 minutos, 3 gatos pegam mais de 100.' },

    /* ---------------- LÓGICA (novas) ---------------- */
    { w: 'logica', d: 1, q: 'Qual letra completa a sequência: A, C, E, G, ...?', a: ['H', 'I', 'J', 'K'], c: 1,
      e: 'A sequência avança duas letras: A, C, E, G, I.' },
    { w: 'logica', d: 1, q: 'Quantas patas têm 3 cachorros?', a: ['6', '9', '12', '15'], c: 2,
      e: 'Cada cachorro tem 4 patas: 3 × 4 = 12.' },
    { w: 'logica', d: 1, q: 'Qual não pertence ao grupo: quadrado, círculo, triângulo, retângulo?', a: ['Quadrado', 'Círculo', 'Triângulo', 'Retângulo'], c: 1,
      e: 'O círculo não tem lados retos; os outros são polígonos.' },

    { w: 'logica', d: 2, q: 'Quantos quadrados existem em uma grade 3 × 3 de quadradinhos?', a: ['9', '10', '12', '14'], c: 3,
      e: 'São 9 pequenos + 4 médios (2 × 2) + 1 grande (3 × 3) = 14.' },
    { w: 'logica', d: 2, q: 'Complete a sequência: 2, 6, 12, 20, 30, ...', a: ['36', '40', '42', '46'], c: 2,
      e: 'As diferenças crescem de 2 em 2: +4, +6, +8, +10, +12. 30 + 12 = 42.' },
    { w: 'logica', d: 2, q: 'Quatro pessoas se cumprimentam uma única vez. Quantos cumprimentos acontecem?', a: ['4', '6', '8', '12'], c: 1,
      e: '3 + 2 + 1 = 6 cumprimentos.' },

    { w: 'logica', d: 3, q: 'Um relógio de ponteiros marca exatamente 3h15. Qual é o menor ângulo entre os ponteiros?', a: ['0°', '7,5°', '15°', '30°'], c: 1,
      e: 'O ponteiro das horas também se move: está em 97,5°. O dos minutos está em 90°. A diferença é 7,5°.' },
    { w: 'logica', d: 3, q: 'Um cubo 3 × 3 × 3 é pintado por fora e cortado em 27 cubinhos. Quantos têm exatamente 2 faces pintadas?', a: ['6', '8', '12', '18'], c: 2,
      e: 'São os cubinhos do meio de cada aresta: 12 arestas, 1 em cada.' },
    { w: 'logica', d: 3, q: 'Se A = 1, B = 2, C = 3 e assim por diante, quanto vale a soma de C + A + S + A?', a: ['22', '24', '26', '28'], c: 1,
      e: 'C = 3, A = 1, S = 19 e A = 1. Total: 24.' },

    /* ---------------- MUNDO / GERAL ---------------- */
    { w: 'geral', d: 1, q: 'Qual é a capital do Canadá?', a: ['Toronto', 'Vancouver', 'Ottawa', 'Montreal'], c: 2,
      e: 'Ottawa é a capital, apesar de Toronto ser a maior cidade.' },
    { w: 'geral', d: 1, q: 'Qual planeta é conhecido como Planeta Vermelho?', a: ['Vênus', 'Marte', 'Júpiter', 'Mercúrio'], c: 1,
      e: 'Marte é avermelhado por causa do óxido de ferro no solo.' },
    { w: 'geral', d: 1, q: 'Qual é o maior oceano da Terra?', a: ['Atlântico', 'Índico', 'Ártico', 'Pacífico'], c: 3,
      e: 'O Pacífico é o maior e o mais profundo.' },
    { w: 'geral', d: 1, q: 'Qual país tem o formato que lembra uma bota?', a: ['Itália', 'Espanha', 'Grécia', 'Portugal'], c: 0,
      e: 'A península itálica desenha a famosa bota.' },
    { w: 'geral', d: 1, q: 'No modelo mais usado nas escolas do Brasil, quantos continentes existem?', a: ['4', '5', '6', '7'], c: 2,
      e: 'América, Europa, Ásia, África, Oceania e Antártida: 6.' },

    { w: 'geral', d: 2, q: 'Qual é a capital da Austrália?', a: ['Sydney', 'Melbourne', 'Camberra', 'Perth'], c: 2,
      e: 'Camberra foi planejada para ser a capital, para evitar a disputa entre Sydney e Melbourne.' },
    { w: 'geral', d: 2, q: 'Qual é o rio com maior volume de água do mundo?', a: ['Nilo', 'Amazonas', 'Mississippi', 'Ganges'], c: 1,
      e: 'O Amazonas tem o maior volume de água, mesmo quando o Nilo é citado como mais extenso.' },
    { w: 'geral', d: 2, q: 'Em qual continente fica o deserto do Saara?', a: ['Ásia', 'África', 'Oceania', 'América do Sul'], c: 1,
      e: 'O Saara ocupa o norte da África.' },
    { w: 'geral', d: 2, q: 'Qual é a moeda oficial do Japão?', a: ['Won', 'Yuan', 'Iene', 'Dólar'], c: 2,
      e: 'O iene (yen) é a moeda japonesa.' },
    { w: 'geral', d: 2, q: 'Quantos estados tem o Brasil?', a: ['25', '26', '27', '28'], c: 1,
      e: 'São 26 estados mais o Distrito Federal.' },
    { w: 'geral', d: 2, q: 'Qual é o menor país do mundo em área?', a: ['Mônaco', 'Vaticano', 'San Marino', 'Nauru'], c: 1,
      e: 'O Vaticano tem cerca de 0,44 km².' },

    { w: 'geral', d: 3, q: 'Qual é a capital do Cazaquistão?', a: ['Almaty', 'Astana', 'Bishkek', 'Tashkent'], c: 1,
      e: 'Astana voltou a ser o nome oficial em 2022.' },
    { w: 'geral', d: 3, q: 'Qual país tem o maior número de fusos horários, contando territórios?', a: ['Rússia', 'Estados Unidos', 'China', 'França'], c: 3,
      e: 'Somando os territórios ultramarinos, a França passa de 12 fusos.' },
    { w: 'geral', d: 3, q: 'Qual é o deserto não polar mais seco do mundo?', a: ['Saara', 'Atacama', 'Gobi', 'Arábico'], c: 1,
      e: 'Algumas regiões do Atacama não recebem chuva há décadas.' },
    { w: 'geral', d: 3, q: 'Qual é o maior arquipélago do mundo?', a: ['Indonésia', 'Filipinas', 'Japão', 'Maldivas'], c: 0,
      e: 'A Indonésia reúne mais de 17 mil ilhas.' },
    { w: 'geral', d: 3, q: 'Qual montanha é a mais alta quando medida da base ao topo?', a: ['Everest', 'K2', 'Mauna Kea', 'Kilimanjaro'], c: 2,
      e: 'O Mauna Kea tem cerca de 10 mil metros da base no oceano até o topo.' },

    /* ---------------- MUNDO / GERAL (novas) ---------------- */
    { w: 'geral', d: 1, q: 'Qual é a capital do Brasil?', a: ['Rio de Janeiro', 'São Paulo', 'Brasília', 'Salvador'], c: 2,
      e: 'Brasília é a capital desde 1960.' },
    { w: 'geral', d: 1, q: 'Qual é o maior país da América do Sul em área?', a: ['Argentina', 'Brasil', 'Peru', 'Colômbia'], c: 1,
      e: 'O Brasil ocupa quase metade da América do Sul.' },
    { w: 'geral', d: 1, q: 'Em qual continente fica o Egito?', a: ['Ásia', 'Europa', 'África', 'Oceania'], c: 2,
      e: 'O Egito fica no nordeste da África (a península do Sinai já é Ásia).' },

    { w: 'geral', d: 2, q: 'Qual é a capital da Argentina?', a: ['Córdoba', 'Rosário', 'Buenos Aires', 'Mendoza'], c: 2,
      e: 'Buenos Aires é a capital e a maior cidade do país.' },
    { w: 'geral', d: 2, q: 'Qual país tem a maior população do mundo atualmente?', a: ['China', 'Índia', 'Estados Unidos', 'Indonésia'], c: 1,
      e: 'A Índia ultrapassou a China em 2023 e segue na liderança.' },
    { w: 'geral', d: 2, q: 'Qual é a capital do México?', a: ['Guadalajara', 'Monterrey', 'Cidade do México', 'Cancún'], c: 2,
      e: 'A Cidade do México é a capital e uma das maiores cidades do mundo.' },

    { w: 'geral', d: 3, q: 'Qual é a capital da Nova Zelândia?', a: ['Auckland', 'Wellington', 'Christchurch', 'Queenstown'], c: 1,
      e: 'Wellington é a capital; Auckland é a maior cidade.' },
    { w: 'geral', d: 3, q: 'Qual é o maior país do mundo em área?', a: ['Canadá', 'China', 'Rússia', 'Estados Unidos'], c: 2,
      e: 'A Rússia tem cerca de 17 milhões de km².' },
    { w: 'geral', d: 3, q: 'Qual é o lago mais profundo do mundo?', a: ['Titicaca', 'Baikal', 'Vitória', 'Cáspio'], c: 1,
      e: 'O Baikal, na Sibéria, passa de 1.600 metros de profundidade.' },

    /* ---------------- CURIOSIDADES ---------------- */
    { w: 'curiosidades', d: 1, q: 'Qual animal tem três corações?', a: ['Polvo', 'Golfinho', 'Tartaruga', 'Pinguim'], c: 0,
      e: 'O polvo tem dois corações para as brânquias e um para o resto do corpo.' },
    { w: 'curiosidades', d: 1, q: 'Qual destes é um mamífero que põe ovos?', a: ['Morcego', 'Ornitorrinco', 'Coala', 'Lontra'], c: 1,
      e: 'O ornitorrinco é um monotremado: mamífero e ovíparo.' },
    { w: 'curiosidades', d: 1, q: 'Qual é o animal terrestre mais rápido?', a: ['Leão', 'Guepardo', 'Cavalo', 'Antílope'], c: 1,
      e: 'O guepardo passa dos 100 km/h em corridas curtas.' },
    { w: 'curiosidades', d: 1, q: 'O vidro comum é feito principalmente de...', a: ['Areia', 'Plástico', 'Metal', 'Argila'], c: 0,
      e: 'A sílica da areia é a matéria-prima principal do vidro.' },
    { w: 'curiosidades', d: 1, q: 'Quantos ossos tem o esqueleto de um adulto?', a: ['106', '206', '306', '256'], c: 1,
      e: 'Bebês nascem com mais ossos, que se fundem até chegar a 206.' },

    { w: 'curiosidades', d: 2, q: 'Qual é o maior animal do mundo?', a: ['Elefante africano', 'Baleia-azul', 'Tubarão-baleia', 'Girafa'], c: 1,
      e: 'A baleia-azul pode passar de 30 metros e 150 toneladas.' },
    { w: 'curiosidades', d: 2, q: 'Na fotossíntese, as plantas absorvem principalmente...', a: ['Oxigênio', 'Nitrogênio', 'Gás carbônico', 'Hidrogênio'], c: 2,
      e: 'Elas usam gás carbônico e liberam oxigênio.' },
    { w: 'curiosidades', d: 2, q: 'Qual é o planeta mais quente do Sistema Solar?', a: ['Mercúrio', 'Vênus', 'Marte', 'Júpiter'], c: 1,
      e: 'A atmosfera densa de Vênus cria um efeito estufa extremo.' },
    { w: 'curiosidades', d: 2, q: 'Qual animal é famoso pelo som parecido com uma risada?', a: ['Hiena', 'Cavalo', 'Golfinho', 'Coruja'], c: 0,
      e: 'A vocalização da hiena-manchada lembra uma risada.' },
    { w: 'curiosidades', d: 2, q: 'Qual metal é líquido à temperatura ambiente?', a: ['Chumbo', 'Mercúrio', 'Alumínio', 'Zinco'], c: 1,
      e: 'O mercúrio é líquido em temperatura ambiente.' },
    { w: 'curiosidades', d: 2, q: 'Quantas patas tem uma aranha?', a: ['6', '8', '10', '12'], c: 1,
      e: 'Aranhas são aracnídeos: 8 patas. Insetos têm 6.' },

    { w: 'curiosidades', d: 3, q: 'Qual é o único mamífero capaz de voar de verdade?', a: ['Morcego', 'Esquilo-voador', 'Pinguim', 'Colugo'], c: 0,
      e: 'Os outros planam; só o morcego voa.' },
    { w: 'curiosidades', d: 3, q: 'Qual elemento é o mais abundante no corpo humano em massa?', a: ['Carbono', 'Oxigênio', 'Hidrogênio', 'Cálcio'], c: 1,
      e: 'Cerca de 65% da massa do corpo é oxigênio.' },
    { w: 'curiosidades', d: 3, q: 'Qual planeta gira praticamente "deitado", com o eixo muito inclinado?', a: ['Urano', 'Netuno', 'Saturno', 'Vênus'], c: 0,
      e: 'Urano tem inclinação de quase 98 graus.' },
    { w: 'curiosidades', d: 3, q: 'Qual é o animal mais venenoso do mundo?', a: ['Cobra-taipan', 'Água-viva-caixa', 'Escorpião', 'Aranha-armadeira'], c: 1,
      e: 'Algumas espécies de água-viva-caixa matam em minutos.' },
    { w: 'curiosidades', d: 3, q: 'Quantas câmaras tem o coração de um crocodilo?', a: ['2', '3', '4', '5'], c: 2,
      e: 'Crocodilos têm quatro câmaras, como aves e mamíferos.' },

    /* ---------------- CURIOSIDADES (novas) ---------------- */
    { w: 'curiosidades', d: 1, q: 'Qual é o maior órgão do corpo humano?', a: ['Fígado', 'Pele', 'Pulmão', 'Cérebro'], c: 1,
      e: 'A pele é o maior órgão: protege e regula a temperatura.' },
    { w: 'curiosidades', d: 1, q: 'Qual é a cor do sangue de uma lula?', a: ['Vermelho', 'Verde', 'Azul', 'Incolor'], c: 2,
      e: 'A lula usa hemocianina, com cobre, e o sangue fica azulado.' },
    { w: 'curiosidades', d: 1, q: 'Qual é o metal mais leve?', a: ['Alumínio', 'Lítio', 'Ferro', 'Chumbo'], c: 1,
      e: 'O lítio é o metal mais leve e flutua na água.' },

    { w: 'curiosidades', d: 2, q: 'Qual é o osso mais longo do corpo humano?', a: ['Úmero', 'Fêmur', 'Tíbia', 'Costela'], c: 1,
      e: 'O fêmur, na coxa, é o osso mais longo e resistente.' },
    { w: 'curiosidades', d: 2, q: 'Qual órgão produz a insulina?', a: ['Fígado', 'Rim', 'Pâncreas', 'Estômago'], c: 2,
      e: 'O pâncreas produz insulina para controlar o açúcar no sangue.' },
    { w: 'curiosidades', d: 2, q: 'Quanto tempo a luz do Sol leva, em média, para chegar à Terra?', a: ['8 segundos', '8 minutos', '8 horas', '8 dias'], c: 1,
      e: 'São cerca de 8 minutos e 20 segundos.' },

    { w: 'curiosidades', d: 3, q: 'Qual é o elemento químico mais abundante no universo?', a: ['Oxigênio', 'Hidrogênio', 'Carbono', 'Hélio'], c: 1,
      e: 'O hidrogênio é o mais abundante, principalmente nas estrelas.' },
    { w: 'curiosidades', d: 3, q: 'Qual planeta tem o dia (rotação) mais longo do Sistema Solar?', a: ['Mercúrio', 'Vênus', 'Júpiter', 'Netuno'], c: 1,
      e: 'Vênus leva cerca de 243 dias terrestres para girar uma vez.' },
    { w: 'curiosidades', d: 3, q: 'Qual metal conduz eletricidade melhor?', a: ['Cobre', 'Prata', 'Ouro', 'Alumínio'], c: 1,
      e: 'A prata é a melhor condutora, mas o cobre é mais usado por ser barato.' },

    /* ---------------- MATEMÁTICA ---------------- */
    { w: 'matematica', d: 1, q: 'Quanto é 7 + 8?', a: ['13', '14', '15', '16'], c: 2, e: '7 + 8 = 15.' },
    { w: 'matematica', d: 1, q: 'Quanto é 9 × 6?', a: ['45', '54', '56', '63'], c: 1, e: '9 × 6 = 54.' },
    { w: 'matematica', d: 1, q: 'Quanto é metade de 50 mais 10?', a: ['25', '30', '35', '45'], c: 2, e: '25 + 10 = 35.' },
    { w: 'matematica', d: 1, q: 'Quantos lados tem um hexágono?', a: ['5', '6', '7', '8'], c: 1, e: 'Hexa significa seis.' },
    { w: 'matematica', d: 1, q: 'Quanto é 100 − 37?', a: ['63', '67', '73', '77'], c: 0, e: '100 − 37 = 63.' },

    { w: 'matematica', d: 2, q: 'Quanto é 15% de 200?', a: ['15', '20', '30', '35'], c: 2, e: '10% de 200 = 20; 5% = 10. Total 30.' },
    { w: 'matematica', d: 2, q: 'Se 3 cadernos custam R$ 12, quanto custam 5 cadernos iguais?', a: ['R$ 18', 'R$ 20', 'R$ 24', 'R$ 25'], c: 1, e: 'Cada caderno custa R$ 4. 5 × 4 = R$ 20.' },
    { w: 'matematica', d: 2, q: 'Complete a sequência: 3, 6, 12, 24, ...', a: ['36', '42', '48', '54'], c: 2, e: 'Cada termo dobra: 24 × 2 = 48.' },
    { w: 'matematica', d: 2, q: 'Quanto é 2³ + 4?', a: ['8', '10', '12', '16'], c: 2, e: '2³ = 8. 8 + 4 = 12.' },
    { w: 'matematica', d: 2, q: 'Quanto mede cada ângulo de um triângulo equilátero?', a: ['45°', '60°', '90°', '120°'], c: 1, e: '180° dividido por 3 = 60°.' },

    { w: 'matematica', d: 3, q: 'Um carro percorre 240 km em 3 horas. Qual é a velocidade média?', a: ['60 km/h', '70 km/h', '80 km/h', '90 km/h'], c: 2, e: '240 ÷ 3 = 80 km/h.' },
    { w: 'matematica', d: 3, q: 'Quanto é 25% de 25% de 400?', a: ['10', '20', '25', '50'], c: 2, e: '0,25 × 0,25 × 400 = 25.' },
    { w: 'matematica', d: 3, q: 'Dois descontos seguidos, de 20% e 10%, equivalem a um desconto de...', a: ['25%', '28%', '30%', '32%'], c: 1, e: '0,8 × 0,9 = 0,72, ou seja, 28% de desconto.' },
    { w: 'matematica', d: 3, q: 'Quanto é √169?', a: ['11', '12', '13', '14'], c: 2, e: '13 × 13 = 169.' },
    { w: 'matematica', d: 3, q: 'Se x + 3 = 10 e y = 2x, quanto vale y?', a: ['7', '10', '14', '20'], c: 2, e: 'x = 7, então y = 14.' },
    { w: 'matematica', d: 3, q: 'Quanto é 2 + 2 × 2²?', a: ['8', '10', '12', '16'], c: 1, e: 'Primeiro a potência (4), depois a multiplicação (8) e a soma: 10.' },

    /* ---------------- MATEMÁTICA (novas) ---------------- */
    { w: 'matematica', d: 1, q: 'Quanto é 6 × 7?', a: ['36', '42', '48', '56'], c: 1, e: '6 × 7 = 42.' },
    { w: 'matematica', d: 1, q: 'Quanto é 5²?', a: ['10', '15', '25', '55'], c: 2, e: '5² = 5 × 5 = 25.' },
    { w: 'matematica', d: 1, q: 'Quantos minutos há em 2 horas?', a: ['60', '90', '120', '180'], c: 2, e: '2 × 60 = 120 minutos.' },

    { w: 'matematica', d: 2, q: 'Quanto é 20% de 150?', a: ['15', '20', '30', '45'], c: 2, e: '10% de 150 = 15. O dobro: 30.' },
    { w: 'matematica', d: 2, q: 'Quanto é 144 ÷ 12?', a: ['10', '11', '12', '14'], c: 2, e: '12 × 12 = 144.' },
    { w: 'matematica', d: 2, q: 'Quanto é 3/4 de 80?', a: ['40', '50', '60', '75'], c: 2, e: '80 ÷ 4 = 20; 3 × 20 = 60.' },

    { w: 'matematica', d: 3, q: 'Quanto é 15²?', a: ['125', '215', '225', '250'], c: 2, e: '15 × 15 = 225.' },
    { w: 'matematica', d: 3, q: 'Se x ÷ 4 + 2 = 7, quanto vale x?', a: ['16', '20', '24', '28'], c: 1, e: 'x ÷ 4 = 5, então x = 20.' },
    { w: 'matematica', d: 3, q: 'Quanto é 7! ÷ 5!?', a: ['12', '21', '42', '56'], c: 2, e: '7! ÷ 5! = 7 × 6 = 42.' },

    /* ---------------- PALAVRAS ---------------- */
    { w: 'palavras', d: 1, q: 'Qual palavra está escrita corretamente?', a: ['Excessão', 'Exceção', 'Exeção', 'Excessao'], c: 1, e: 'A forma correta é "exceção".' },
    { w: 'palavras', d: 1, q: 'Qual é o plural de "cidadão"?', a: ['Cidadãos', 'Cidadães', 'Cidadões', 'Cidadans'], c: 0, e: 'O plural é "cidadãos".' },
    { w: 'palavras', d: 1, q: 'Qual é um sinônimo de "rápido"?', a: ['Lento', 'Veloz', 'Pesado', 'Calmo'], c: 1, e: 'Veloz e rápido têm o mesmo sentido.' },
    { w: 'palavras', d: 1, q: 'Quantas sílabas tem "computador"?', a: ['3', '4', '5', '6'], c: 1, e: 'Com-pu-ta-dor: 4 sílabas.' },
    { w: 'palavras', d: 1, q: 'Qual é o antônimo de "generoso"?', a: ['Bondoso', 'Egoísta', 'Simpático', 'Educado'], c: 1, e: 'Egoísta é o oposto de generoso.' },

    { w: 'palavras', d: 2, q: 'Qual frase está de acordo com a norma padrão?', a: ['Fazem dois anos que ele saiu', 'Faz dois anos que ele saiu', 'Fazem dois ano que ele saiu', 'Faz dois anos atrás que ele saiu'], c: 1, e: 'O verbo "fazer" indicando tempo é impessoal: "faz dois anos".' },
    { w: 'palavras', d: 2, q: 'Qual palavra é proparoxítona?', a: ['Médico', 'Caderno', 'Feliz', 'Papel'], c: 0, e: 'Mé-di-co: a antepenúltima sílaba é a tônica.' },
    { w: 'palavras', d: 2, q: 'Complete: "Ele passou ___ na prova."', a: ['mal', 'mau', 'mão', 'más'], c: 0, e: '"Mal" é o oposto de "bem".' },
    { w: 'palavras', d: 2, q: 'Qual é o coletivo de lobos?', a: ['Alcateia', 'Cardume', 'Revoada', 'Enxame'], c: 0, e: 'Alcateia é o grupo de lobos.' },
    { w: 'palavras', d: 2, q: 'Quantas letras tem a palavra "arroz"?', a: ['4', '5', '6', '7'], c: 1, e: 'A-R-R-O-Z: 5 letras.' },
    { w: 'palavras', d: 2, q: 'Qual é o feminino de "ator"?', a: ['Atora', 'Atriz', 'Atores', 'Atrizes'], c: 1, e: 'O feminino é "atriz".' },

    { w: 'palavras', d: 3, q: 'Qual palavra tem um hiato?', a: ['Saída', 'Céu', 'Pão', 'Fui'], c: 0, e: 'Em "sa-í-da", as vogais i e a ficam em sílabas separadas.' },
    { w: 'palavras', d: 3, q: 'Em "Seus olhos são duas estrelas", há...', a: ['Metáfora', 'Metonímia', 'Hipérbole', 'Ironia'], c: 0, e: 'É uma comparação implícita: metáfora.' },
    { w: 'palavras', d: 3, q: 'Em "Espero que você venha", o "que" é...', a: ['Pronome relativo', 'Conjunção integrante', 'Preposição', 'Advérbio'], c: 1, e: 'Ele introduz uma oração que completa o sentido do verbo: conjunção integrante.' },
    { w: 'palavras', d: 3, q: 'Em "Vendi o carro que era do meu pai", o "que" é...', a: ['Conjunção integrante', 'Pronome relativo', 'Preposição', 'Interjeição'], c: 1, e: 'Ele retoma "o carro": pronome relativo.' },
    { w: 'palavras', d: 3, q: 'Como se escreve corretamente o nome do ato de buscar informação?', a: ['Pesquisa', 'Pezquisa', 'Pesquiza', 'Pesquissa'], c: 0, e: 'A grafia correta é "pesquisa".' },

    /* ---------------- PALAVRAS (novas) ---------------- */
    { w: 'palavras', d: 1, q: 'Qual é o plural de "pão"?', a: ['Pãos', 'Pães', 'Pãens', 'Pãoes'], c: 1, e: 'O plural é "pães".' },
    { w: 'palavras', d: 1, q: 'Qual é um sinônimo de "feliz"?', a: ['Triste', 'Contente', 'Bravo', 'Cansado'], c: 1, e: 'Contente e feliz têm o mesmo sentido.' },
    { w: 'palavras', d: 1, q: 'Quantas vogais há na palavra "escola"?', a: ['2', '3', '4', '5'], c: 1, e: 'E, O e A: 3 vogais.' },

    { w: 'palavras', d: 2, q: 'Qual destas palavras é oxítona?', a: ['Mesa', 'Café', 'Lápis', 'Úmido'], c: 1, e: 'Ca-fé: a última sílaba é a tônica.' },
    { w: 'palavras', d: 2, q: 'Qual é o coletivo de peixes?', a: ['Alcateia', 'Cardume', 'Enxame', 'Revoada'], c: 1, e: 'Cardume é o grupo de peixes.' },
    { w: 'palavras', d: 2, q: 'Qual palavra tem um dígrafo?', a: ['Casa', 'Carro', 'Bola', 'Dedo'], c: 1, e: 'Em "carro", o "rr" representa um único som.' },

    { w: 'palavras', d: 3, q: 'Em "Se eu fosse rico, viajaria", o verbo "fosse" está no...', a: ['Presente do subjuntivo', 'Pretérito perfeito', 'Pretérito imperfeito do subjuntivo', 'Futuro do pretérito'], c: 2, e: 'É o pretérito imperfeito do subjuntivo.' },
    { w: 'palavras', d: 3, q: 'Em "Morri de rir", há qual figura de linguagem?', a: ['Metáfora', 'Hipérbole', 'Eufemismo', 'Antítese'], c: 1, e: 'É um exagero: hipérbole.' },
    { w: 'palavras', d: 3, q: 'Em "Vende-se casa", o "se" é...', a: ['Índice de indeterminação do sujeito', 'Partícula apassivadora', 'Pronome reflexivo', 'Conjunção'], c: 1, e: 'Com verbo transitivo direto, o "se" forma a voz passiva sintética.' },
  ];

  window.MC_DATA = { WORLDS, FASES, POWERUPS, AVATARS, DAILY, QUESTIONS };
})();
