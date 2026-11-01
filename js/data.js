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
    { w: 'palavras', d: 3, q: 'Qual palavra está escrita corretamente?', a: ['Pesquisa', 'Pezquisa', 'Pesquiza', 'Pesquissa'], c: 0, e: 'A grafia correta é "pesquisa".' },
  ];

  window.MC_DATA = { WORLDS, FASES, POWERUPS, AVATARS, DAILY, QUESTIONS };
})();
