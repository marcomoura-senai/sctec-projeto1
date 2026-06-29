# Desenvolvedor(a) Back End Node — Projeto Final Avaliativo
## Acervo CLI: Sistema de Gerenciamento de Biblioteca Acadêmica (PostgreSQL + Node.js)


## SUMÁRIO

0. [Ponto de Partida — Fork do Repositório Template](#0-ponto-de-partida--fork-do-repositório-template)
1. [Contextualização](#1-contextualização)
2. [Desafio](#2-desafio)
3. [Resultados Esperados (Entrega)](#3-resultados-esperados-entrega)
4. [Requisitos das Tarefas](#4-requisitos-das-tarefas)
   - [4.1 Organização Arquitetural](#41-organização-arquitetural)
   - [4.2 Modelagem do Banco de Dados](#42-modelagem-do-banco-de-dados)
   - [4.3 Requisitos Funcionais (RF)](#43-requisitos-funcionais-rf)
   - [4.4 Requisitos Não Funcionais (RNF)](#44-requisitos-não-funcionais-rnf)
   - [4.5 Versionamento (GitFlow)](#45-versionamento-gitflow)
   - [4.6 Registro de Execução no README](#46-registro-de-execução-no-readme)
   - [4.7 Roteiro de Aceitação (QA) — executado pelo avaliador](#47-roteiro-de-aceitação-qa--executado-pelo-avaliador)
5. [Critérios de Avaliação (base, deduções e bônus)](#5-critérios-de-avaliação)
6. [Checklist Final de Entrega](#6-checklist-final-de-entrega)
7. [Modelo de README.md (referência)](#7-modelo-de-readmemd-referência)
8. [Referências e Fundamentação](#8-referências-e-fundamentação)

---

## 0. Ponto de Partida — Fork do Repositório Template

Este projeto **não começa do zero**. Ele parte de um repositório template no GitHub que já contém este documento de requisitos e a estrutura inicial mínima.

**Como iniciar:**

1. Acesse o repositório template: [Acesse aqui](https://github.com/marcomoura-senai/sctec-projeto1).
2. Faça o **Fork** do template para a sua conta pessoal (não clone diretamente o original).
3. O seu fork passa a ser o **repositório de entrega** (público).
4. Clone o seu fork e desenvolva a partir dele, seguindo os requisitos deste documento.
5. Mantenha este documento de requisitos versionado no repositório.

**Por que começar de um fork de template?** Porque reproduz o fluxo real de trabalho: a documentação técnica vive versionada junto do código (como o README de uma biblioteca ou um card de requisitos), e partir de um template é o padrão em *bootstraps* de frameworks e em contribuições open-source. Aprender esse fluxo é uma habilidade transferível direta para o mercado.


### Código do template:

**OBS:** O código do template vem em src/@common e não é obrigatório, caso queira, pode substituí-lo por completo.

Se decidir usar, veja a documentação abaixo. Mais exemplos de código estão no repositório do [mini-projeto1](https://github.com/marcomoura-senai/sctec-backend-mini-projeto1)

**`@common/errors/base.exception.ts` — classe de erro base**

Exporta `BaseException` (estende `Error`). Use-a para criar hierarquias de erros de domínio em vez de lançar `Error` diretamente. Ela formata a causa (string, `Error` ou objeto JSON) em mensagem legível, preserva o stack trace original e expõe helpers estáticos.

```ts
// Criar erros de domínio específicos
export class LivroIndisponivelException extends BaseException {}
export class FuncionarioNaoEncontradoException extends BaseException {}

// Instanciar
throw new LivroIndisponivelException({ cause: 'sem exemplar disponível' })

// Verificar tipo em blocos catch
if (BaseException.isError(error)) { ... }
```

---

**`@common/utils/logger.util.ts` — logger de desenvolvimento**

`LoggerUtil.error(value)` imprime no stderr quando `LoggerUtil.DEBUG === true`. Use nos blocos `catch` da CLI para não vazar detalhes técnicos para o usuário final — o usuário vê uma mensagem amigável; o desenvolvedor vê o erro real no terminal.

---

**`@common/utils/readline-interface.util.ts` — instância compartilhada de readline**

Mantém um único `readline.Interface` para toda a aplicação. Isso evita o problema clássico de abrir múltiplas interfaces que ficam "penduradas" e impedem o processo de encerrar normalmente.

---

**`@common/utils/common.util.ts` — utilitários gerais**

- `parseJSON<T>(json, guard)` — parse JSON seguro com type guard; retorna `T | BaseException` sem lançar exceção.
- `defer(fn)` — cria um objeto `Disposable` (protocolo [using do ECMAScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/using)). Usado internamente em `ConsoleView` para fechar o readline automaticamente ao encerrar a view raiz.

---

**`@common/view/console.view.ts` — base de todas as telas da CLI**

Classe abstrata `ConsoleView`. Implementa o loop de renderização: enquanto a view está ativa (`isInView === true`), chama `update()` em loop. Você cria cada tela estendendo essa classe e implementando apenas o método abstrato `update()`.

```ts
export class ListarLivrosView extends ConsoleView {
  constructor(private readonly livroRepository: LivroRepository) {
    super()
  }

  protected async update(): Promise<void> {
    const livros = await this.livroRepository.findAll()
    livros.forEach(l => this.display(`${l.titulo} — ${l.isbn}`))
    await this.prompt('\nPressione ENTER para voltar:')
    this.exit()
  }
}
```

Métodos disponíveis na subclasse:

| Método | O que faz |
|--------|-----------|
| `prompt(message)` | Lê uma linha do terminal; trata Ctrl+C (SIGINT) sem crash |
| `display(message)` | Imprime no stdout |
| `reportTechnicalError(error, userMessage)` | Loga o erro técnico em stderr e exibe mensagem amigável ao usuário |
| `clear()` | Limpa a tela |
| `exit()` | Encerra o loop da view atual |
| `onEnter()` | Hook chamado uma vez antes do loop — sobrescreva para inicialização |
| `onExit()` | Hook chamado após o loop — sobrescreva para cleanup |

A `MainView` (view raiz instanciada em `main.ts`) deve chamar `super(true)` para que o readline seja fechado automaticamente ao encerrar a aplicação, evitando o processo "pendurado" (dedução D07).

---

**O que o template NÃO faz — seu trabalho começa aqui:**

- Pool de conexão (`pg.Pool`), schema SQL (`schema.sql`) e seed (`seed.sql`)
- Repositories: queries parametrizadas para cada entidade
- Services: regras de negócio (reserva, devolução, cadastro, autenticação)
- Views concretas: tela de login, menus, formulários de cadastro, listagens

<p align="right"><a href="#sumário">↑ Voltar ao índice</a></p>

---

## 1. Contextualização

O desenvolvimento back-end exige que a pessoa programadora saiba **persistir e recuperar dados de forma confiável**, traduzindo regras de negócio do mundo real em um modelo relacional consistente e em operações que não deixem o sistema em estado inválido.

Diferente de aplicações que apenas consomem APIs externas, um sistema com banco de dados próprio obriga o estudante a tomar decisões de **modelagem** (quais entidades existem, como se relacionam, quais regras proteger) e a manipular o banco **sem o auxílio de um ORM**. Trabalhar com o driver `pg` diretamente expõe, de forma deliberada, o que um ORM normalmente esconde: a escrita de SQL, o uso de *queries* parametrizadas, o gerenciamento de conexões e o mapeamento manual entre linhas de tabela e objetos da aplicação.

Essa escolha é intencional e tem fundamento. Ted Neward, no ensaio *The Vietnam of Computer Science* (2006), descreve o custo real do *impedance mismatch* entre objetos e tabelas relacionais, um custo que os ORMs absorvem ao preço de esconder comportamento. O desenvolvedor exposto ao SQL cru, nesta etapa, constrói a intuição que torna o uso futuro de um ORM uma decisão consciente, e não comodismo.

Neste projeto, você desenvolverá o **Acervo CLI**, uma aplicação de terminal que gerencia o acervo de uma biblioteca acadêmica: cadastro de autores e livros, e o controle do ciclo de **reserva** e **devolução** de exemplares.

O foco é praticar os conteúdos da etapa:

- Node.js no back-end;
- modelagem de banco de dados relacional;
- SQL (DDL e DML) escrito à mão;
- conexão com PostgreSQL via driver `pg`;
- *queries* parametrizadas e prevenção de SQL injection;
- variáveis de ambiente com `dotenv`;
- organização em camadas (sem código monolítico);
- tratamento de erros previsíveis;
- construção de uma interface de linha de comando (CLI);
- Git, GitFlow e Kanban.

<p align="right"><a href="#sumário">↑ Voltar ao índice</a></p>

---

## 2. Desafio

Você foi contratado(a) como pessoa desenvolvedora back-end júnior para construir uma ferramenta interna de gestão do acervo de uma biblioteca acadêmica. O sistema se chama:

**Acervo CLI**

A aplicação é executada inteiramente pelo terminal e persiste todos os dados em um banco **PostgreSQL**. Não há interface gráfica e não há servidor HTTP: o único ponto de entrada é a própria CLI, que é operada por um **funcionário autorizado e previamente cadastrado no sistema** — toda operação fica vinculada ao funcionário que a executou.

### Objetivo técnico

Criar uma aplicação back-end de terminal, com persistência em PostgreSQL, capaz de:

- modelar e criar o esquema do banco de forma reprodutível;
- cadastrar **funcionários** (operadores) e identificar quem está operando o sistema;
- cadastrar **autores**;
- cadastrar **livros** e associá-los a um ou mais autores;
- listar livros e autores;
- registrar a **reserva** de um livro, respeitando a disponibilidade de exemplares;
- registrar a **devolução** de um livro reservado;
- impedir estados inconsistentes (ex.: reservar um livro sem exemplar disponível);
- tratar erros previsíveis sem derrubar a aplicação;
- documentar instalação, modelagem, execução e exemplos de uso no README.

### Restrições obrigatórias da stack

| Item | Regra |
|---|---|
| Banco de dados | **PostgreSQL** (obrigatório) |
| Runtime | **Node.js** |
| Linguagem | **TypeScript** |
| Dependências de runtime permitidas | **apenas** `dotenv` e o driver `pg` |
| ORM (Prisma, TypeORM, Sequelize, Drizzle, Knex query-builder etc.) | **Explicitamente proibido** |
| Biblioteca de CLI (`inquirer`, `prompts`, `commander`, `@inquirer/*` etc.) | **Opcional** — pode ser usada e conta como **bônus** (ver seção 5.3) |

> O uso de qualquer ORM **zera o critério de arquitetura** e gera dedução adicional (seção 5.2). O ponto pedagógico do projeto é justamente escrever o acesso a dados à mão.

<p align="right"><a href="#sumário">↑ Voltar ao índice</a></p>

---

## 3. Resultados Esperados (Entrega)

Ao final, o estudante deverá entregar:

- **Fork público no GitHub** com todo o histórico de desenvolvimento;
- **Código-fonte organizado em camadas** (sem arquivos lixo, sem `node_modules` versionado);
- **Scripts de banco reprodutíveis**: criação do esquema (DDL) e carga inicial (*seed*), executáveis de forma idempotente;
- **Arquivo `.env.example`** documentando as variáveis necessárias (o `.env` real **não** deve ser versionado);
- **README.md completo** com modelagem, instalação, execução e exemplos;
- **Quadro Kanban** com as tarefas do projeto;
- **Histórico de commits semânticos** e uso de branches (GitFlow simplificado);
- **Exemplos de execução documentados no README** (substituem a gravação de vídeo).

### Entrega no AVA

- **Tarefa:** Projeto Avaliativo — `Modulo 01 - Projeto Avaliativo`
- **Prazo:** `20/07/2026, segunda-feira, até as 22h`
- **Peso:** `60% da nota do modulo 01, conforme calendário de aula (matriz curricular)`

### Links obrigatórios

- Link do fork público no GitHub;
- Link do quadro Kanban (Trello, GitHub Projects, Notion ou similar).

> Nesta versão não há gravação de vídeo. No lugar, registre no README exemplos reais de execução (entrada e saída do terminal).

<p align="right"><a href="#sumário">↑ Voltar ao índice</a></p>

---

## 4. Requisitos das Tarefas

### 4.1 Organização Arquitetural

A aplicação deve **rejeitar código monolítico**. As responsabilidades devem estar separadas em camadas, com a borda de I/O (banco e terminal) isolada do núcleo de regras de negócio.

Uma estrutura de referência (a nomenclatura **não** precisa ser idêntica; o aluno pode dividir em mais arquivos/pastas):

```
/raiz_do_projeto
├── src/
│   ├── main.ts              # Ponto de entrada: monta dependências e inicia a CLI
│   ├── cli/                 # Camada de interface: lê comandos/inputs e exibe saída
│   ├── services/            # Regras de negócio (reserva, devolução, cadastro)
│   ├── repositories/        # Acesso a dados: queries pg parametrizadas (sem ORM)
│   ├── db/                  # Pool de conexão + scripts schema.sql e seed.sql
│   ├── models/              # Tipos/interfaces e classes de erro customizadas
│   └── utils/               # Funções utilitárias puras e tipadas
├── .env.example             # Modelo das variáveis de ambiente
├── .gitignore               # Deve conter .env e node_modules
├── package.json
└── tsconfig.json            # Strict mode obrigatório
```

**Boas práticas valorizadas (não obrigatórias — contam como bônus).** A separação básica em camadas, acima, é o mínimo exigido (ver RNF02). As práticas a seguir não fazem parte do mínimo, mas elevam a qualidade e são reconhecidas na seção 5.3:

- **Injeção de dependência via parâmetro/construtor:** o `repository` recebe o pool de conexão; o `service` recebe o `repository`. Nada cria sua própria conexão internamente. *(→ bônus B08)*
- **Encapsulamento profundo no nível de módulo:** fronteiras nítidas, e.g a CLI não conhece SQL e o `repository` não conhece a regra de negócio.
- **Erros previsíveis como valor de retorno:** falhas esperadas (livro inexistente, sem exemplar disponível) sinalizadas de forma controlada. E.g retorno tipado ou erro customizado tratado, em vez de exceção que derruba o processo.

<p align="right"><a href="#sumário">↑ Voltar ao índice</a></p>

### 4.2 Modelagem do Banco de Dados

Este é um entregável central. O estudante deve **projetar** o modelo, não apenas implementá-lo. As entidades mínimas obrigatórias são:

- **funcionario** — operador autorizado que executa as ações no sistema;
- **autor** — pessoa que escreve livros;
- **livro** — obra do acervo, com controle de quantidade de exemplares/disponibilidade;
- **livro_autor** — relação **N:N** entre livro e autor (um livro pode ter vários autores e vice-versa);
- **reserva_acervo** — registro de que um exemplar de um livro foi reservado, vinculado ao funcionário que a registrou;

O modelo abaixo é conceitual e de exemplo. Não necessariamente cobre todos os requisitos. É a base para a construção do modelo necessário. O aluno não deve se restringir a essa estrutura, mas modificar e expandir conforme necessário.

```mermaid
erDiagram
    AUTOR ||--o{ LIVRO_AUTOR : escreve
    LIVRO ||--o{ LIVRO_AUTOR : possui
    LIVRO ||--o{ RESERVA_ACERVO : tem
    FUNCIONARIO ||--o{ RESERVA_ACERVO : insere_atualiza
    USUARIO ||--o{ RESERVA_ACERVO : solicita

    USUARIO {
        int id PK
        varchar nome
        varchar sobrenome
        varchar email
    }

    FUNCIONARIO {
        int id PK
        varchar nome
        varchar matricula UK
        boolean ativo
    }
    AUTOR {
        int id PK
        varchar nome
    }
    LIVRO {
        int id PK
        varchar titulo
        varchar isbn UK
        int total_exemplares
        int disponiveis
    }
    LIVRO_AUTOR {
        int livro_id FK
        int autor_id FK
    }

    RESERVA_ACERVO {
        int id PK
        int livro_id FK
        int funcionario_id FK
        int solicitante_id FK
        timestamp data_reserva
        timestamp data_devolucao
        varchar status
    }
```

**OBSERVAÇÃO (regra de negócio):** um livro só pode ser reservado se houver exemplar disponível; uma devolução deve encerrar uma reserva ativa e devolver o exemplar ao acervo. Garantir essa regra é o motivo central de existir uma camada de `service` separada da CLI.
.

> Os exemplos de código abaixo são **mínimos e ilustrativos**. A implementação completa, a modelagem fina e a forma da CLI fazem parte da avaliação — a criatividade da solução conta. **Não** copie os trechos como gabarito.

**Exemplo — query parametrizada (padrão obrigatório, anti SQL injection):**

```ts
// CORRETO: o valor vai como parâmetro ($1), nunca concatenado na string
const { rows } = await pool.query(
  'SELECT id, titulo FROM livro WHERE isbn = $1',
  [isbn]
);
```

**Exemplo — `.env.example` (referência das variáveis):**

```
DB_NAME=acervo
DB_USER=nodejs
DB_PASSWORD=password123
DB_HOST=localhost
DB_PORT=5432

#OU

#DATABASE_URL=postgres://nodejs:password123@localhost:5432/acervo
```

Nada além desses recortes deve ser tratado como modelo a ser reproduzido literalmente.
<p align="right"><a href="#sumário">↑ Voltar ao índice</a></p>

### 4.3 Requisitos Funcionais (RF)

O que o software precisa fazer para atender as necessidades do negócio:


#### RF01 - Logar no sistema

**Tipo:** História de Usuário | **Prioridade:** Alta

**Descrição**

> Como funcionário cadastrado, quero me identificar na aplicação com minha matrícula e senha, para que todas as operações fiquem vinculadas à minha identidade e apenas pessoal autorizado acesse o sistema.

**Critérios de Aceite**

- [ ] A CLI solicita matrícula e senha como primeira interação, antes de exibir qualquer menu
- [ ] Matrícula e senha corretas → sessão inicia; o nome do funcionário é exibido na tela de boas-vindas
- [ ] Matrícula inexistente → mensagem de recusa clara (ex.: "Funcionário não encontrado"), sem crash
- [ ] Senha incorreta → mensagem de recusa clara (ex.: "Credenciais inválidas"), sem crash
- [ ] Funcionário com flag `ativo = false` → acesso negado mesmo com credenciais corretas
- [ ] A identidade do operador logado fica disponível em memória durante toda a sessão e é vinculada a reservas e devoluções

**Notas Técnicas**

- A "sessão" é uma variável em memória, não é necessário JWT, cookie nem estado persistido entre execuções
- Senha deve ser armazenada como hash (ex.: bcrypt)
- Nenhuma operação de negócio deve ser possível sem sessão ativa

---

#### RF03 - Cadastrar autor

**Tipo:** História de Usuário | **Prioridade:** Alta

**Descrição**

> Como funcionário logado, quero cadastrar um autor no sistema, para que ele possa ser associado a livros do acervo.

**Critérios de Aceite**

- [ ] A CLI solicita, no mínimo, o nome do autor
- [ ] Nome vazio ou em branco → recusa com mensagem clara ("Nome é obrigatório"), sem crash
- [ ] Autor cadastrado com sucesso → confirmação exibida no terminal
- [ ] O autor é persistido no banco e aparece corretamente na listagem

**Notas Técnicas**

- O modelo mínimo da entidade `autor` exige apenas `nome`; o aluno pode estender (ex.: `sobrenome`, `nacionalidade`)
- A query de insert deve ser parametrizada

---

#### RF04 - Cadastrar livro e associá-lo a um ou mais autores

**Tipo:** História de Usuário | **Prioridade:** Alta

**Descrição**

> Como funcionário logado, quero cadastrar um livro com seu ISBN, título, quantidade de exemplares e autor(es), para que o acervo reflita o item disponível para reserva.

**Critérios de Aceite**

- [ ] A CLI solicita título, ISBN e número total de exemplares
- [ ] A CLI permite associar um ou mais autores já cadastrados ao livro (relação N:N via `livro_autor`)
- [ ] ISBN já existente → recusa com mensagem clara ("ISBN já cadastrado"), sem crash
- [ ] Campos obrigatórios vazios → recusa com mensagem clara, sem crash
- [ ] Livro cadastrado com sucesso → `disponiveis` começa igual a `total_exemplares`; confirmação exibida
- [ ] O livro aparece corretamente na listagem com seus autores

**Notas Técnicas**

- A inserção do livro e das associações de autores em `livro_autor` devem ser feitas em transação (`BEGIN`/`COMMIT`/`ROLLBACK`) — bônus B03
- `disponiveis` deve ser inicializado com o valor de `total_exemplares` no momento do cadastro
- Toda query com dados de entrada deve ser parametrizada

---

#### RF04b - Editar um livro

**Tipo:** História de Usuário | **Prioridade:** Média

**Descrição**

> Como funcionário logado, quero editar um livro existente, para que eu possa corrigir a quantidade de exemplares ou atualizar a lista de autores sem precisar recadastrar o livro.

**Critérios de Aceite**

- [ ] A CLI permite localizar o livro pelo ISBN ou ID
- [ ] Livro inexistente → recusa controlada ("Livro não encontrado"), sem crash
- [ ] A CLI permite alterar a quantidade total de exemplares
- [ ] A CLI permite adicionar ou remover autores da associação N:N
- [ ] Ao reduzir `total_exemplares` abaixo do número de reservas ativas, a operação é recusada com mensagem clara
- [ ] Alterações são persistidas no banco e refletidas na listagem

**Notas Técnicas**

- Regra de integridade ao reduzir `total_exemplares`: o valor não pode ser menor que `total_exemplares - disponiveis` (número de reservas ativas no momento)
- Inserções e remoções em `livro_autor` devem ser feitas de forma atômica (transação)

---

#### RF05 - Listar livros e autores

**Tipo:** Tarefa | **Prioridade:** Alta

**Descrição**

> Como funcionário logado, quero visualizar a lista completa de livros com seus autores e a lista de autores cadastrados, para que eu possa conferir o acervo e tomar decisões sobre reservas.

**Critérios de Aceite**

- [ ] A listagem de livros exibe: título, ISBN, total de exemplares, exemplares disponíveis e autor(es) de cada livro
- [ ] A listagem de autores exibe pelo menos o nome de cada autor
- [ ] Se não houver livros ou autores cadastrados, a mensagem "Nenhum item encontrado" (ou equivalente) é exibida — sem crash
- [ ] A saída no terminal é legível (formatada, não dump de JSON bruto)

**Notas Técnicas**

- A query de listagem de livros deve fazer `JOIN` com `livro_autor` e `autor` para trazer os autores de cada livro
- Livros com múltiplos autores devem ter todos listados (ex.: `STRING_AGG` no SQL ou agrupamento no código)

---

#### RF06 - Registrar reserva de um livro

**Tipo:** História de Usuário | **Prioridade:** Alta

**Descrição**

> Como funcionário logado, quero registrar a reserva de um exemplar de livro para um solicitante, para que o acervo reflita a saída do exemplar e o histórico fique registrado.

**Critérios de Aceite**

- [ ] A CLI solicita o livro a ser reservado e a identificação do solicitante
- [ ] `disponiveis > 0` → reserva registrada; `disponiveis` decrementado em 1; confirmação exibida
- [ ] `disponiveis = 0` → recusa controlada ("Sem exemplar disponível"), sem crash
- [ ] Livro inexistente → recusa controlada, sem crash
- [ ] A reserva é vinculada ao funcionário logado (operador) e ao solicitante
- [ ] O campo `status` da reserva é definido como ativo (ex.: `'ativa'`)
- [ ] O campo `data_reserva` é preenchido automaticamente com o timestamp atual; `data_devolucao` fica `NULL`

**Notas Técnicas**

- A regra de verificar disponibilidade e decrementar deve ficar no `service`, não na CLI nem no `repository`
- A operação de verificar + criar reserva + decrementar deve ser feita em transação para evitar condição de corrida — bônus B03

---

#### RF07 - Registrar devolução de um livro reservado

**Tipo:** História de Usuário | **Prioridade:** Alta

**Descrição**

> Como funcionário logado, quero registrar a devolução de um exemplar reservado, para que o livro volte a ficar disponível no acervo e a reserva seja encerrada.

**Critérios de Aceite**

- [ ] A CLI solicita a reserva a ser encerrada (por ID da reserva ou por livro + solicitante)
- [ ] Reserva ativa encontrada → `disponiveis` incrementado em 1; `status` atualizado para encerrado (ex.: `'devolvida'`); `data_devolucao` preenchida com timestamp atual; confirmação exibida
- [ ] Reserva inexistente ou já encerrada → recusa controlada ("Reserva não encontrada ou já encerrada"), sem crash
- [ ] Livro inexistente → recusa controlada, sem crash

**Notas Técnicas**

- A operação de encerrar reserva + incrementar `disponiveis` deve ser feita em transação — bônus B03
- A regra de negócio deve ficar no `service`

---

#### RF08 - Consultar reservas

**Tipo:** Tarefa | **Prioridade:** Média

**Descrição**

> Como funcionário logado, quero consultar as reservas do acervo (ativas e/ou histórico), para que eu possa verificar quais exemplares estão emprestados e o histórico de movimentações.

**Critérios de Aceite**

- [ ] A CLI exibe pelo menos as reservas ativas (status `'ativa'`)
- [ ] A listagem inclui: título do livro, identificação do solicitante, nome do operador que registrou, data da reserva e status
- [ ] Se nenhuma reserva for encontrada, a mensagem "Nenhuma reserva encontrada" (ou equivalente) é exibida — sem crash
- [ ] (Desejável) A CLI permite filtrar por status: ativas / histórico completo

**Notas Técnicas**

- A query deve fazer `JOIN` com `livro`, `funcionario` e a tabela de solicitante para exibir nomes em vez de IDs brutos

---
<p align="right"><a href="#sumário">↑ Voltar ao índice</a></p>

### 4.4 Requisitos Não Funcionais (RNF)

Como é esperado que o software se comporte e quais qualidades deve possuir:

| RNF | Descrição |
|---|---|
| **RNF01 — Segurança** | Toda query com dados de entrada deve ser **parametrizada**. Credenciais apenas em variáveis de ambiente (via `dotenv`). `.env` nunca versionado; entregar `.env.example`. |
| **RNF02 — Arquitetura** | Separação em camadas; ausência de código monolítico; CLI sem SQL embutido; regra de negócio fora da camada de dados. |
| **RNF03 — Confiabilidade** | A aplicação não deve travar diante de erros previsíveis; mensagens claras no terminal. |
| **RNF04 — Gerência de recursos** | Uso de **pool de conexões** (`pg.Pool`), configurado e encerrado adequadamente; sem vazamento de conexões. |
| **RNF05 — Reprodutibilidade** | Qualquer pessoa deve subir o banco e rodar o projeto seguindo apenas o README; scripts de DDL e *seed* devem ser reexecutáveis sem erros. |
| **RNF06 — Tipagem/contrato** | Funções, parâmetros e retornos tipados (TypeScript em *strict mode*). |
| **RNF07 — Qualidade de código** | Código formatado de forma consistente e sem avisos de lint (ver deduções na seção 5.2). |

#### RNF01 - Segurança

**Tipo:** Requisito Não Funcional | **Prioridade:** Crítica

**Descrição**

O sistema deve garantir que nenhuma entrada de usuário seja usada diretamente na construção de queries SQL e que credenciais de banco de dados nunca sejam expostas no código-fonte ou versionadas.

**Critérios de Aceite**

- [ ] Toda query que recebe parâmetros externos usa a sintaxe de query parametrizada do `pg` com `$1`, `$2`, etc.
- [ ] Nenhuma query constrói a instrução SQL por concatenação ou template literal com variáveis (ex.: `` `SELECT * FROM livro WHERE isbn = '${isbn}'` `` é proibido)
- [ ] Variáveis de ambiente são carregadas via `dotenv`; o arquivo `.env` está no `.gitignore` e não aparece no repositório
- [ ] O repositório contém `.env.example` com todas as variáveis necessárias documentadas (sem valores reais)
- [ ] Nenhuma credencial (senha, string de conexão) está hardcoded no código-fonte

**Notas Técnicas**

- Referência: OWASP — SQL Injection Prevention
- A violação deste RNF aciona as deduções D02 e D03

---

#### RNF02 - Arquitetura

**Tipo:** Requisito Não Funcional | **Prioridade:** Alta

**Descrição**

O sistema deve ser organizado em camadas com responsabilidades claramente separadas, sem código monolítico concentrando entrada/saída do terminal, regras de negócio e acesso a dados no mesmo arquivo.

**Critérios de Aceite**

- [ ] Existe ao menos uma camada de CLI (entrada/saída do terminal), uma de service (regras de negócio) e uma de repository (acesso a dados)
- [ ] A camada CLI não contém SQL embutido
- [ ] A camada repository não contém regras de negócio (ex.: validação de disponibilidade)
- [ ] A camada service não conhece detalhes de exibição no terminal (ex.: não chama `console.log` diretamente)
- [ ] O ponto de entrada (`main.ts`) apenas monta as dependências e inicia a CLI

**Notas Técnicas**

- A violação deste RNF impacta diretamente os critérios 2 e 6 da rubrica
- O uso de ORM aciona adicionalmente a dedução D01

---

#### RNF03 - Confiabilidade

**Tipo:** Requisito Não Funcional | **Prioridade:** Alta

**Descrição**

A aplicação deve tolerar entradas inválidas e erros previsíveis de domínio sem encerrar inesperadamente, apresentando mensagens claras ao usuário em português.

**Critérios de Aceite**

- [ ] Entrada de texto onde se espera número → mensagem clara; a aplicação continua de pé
- [ ] Livro inexistente, reserva não encontrada, ISBN duplicado → mensagem de negócio exibida; nenhum stack trace vaza para o terminal do usuário
- [ ] Erros técnicos inesperados (ex.: falha de conexão) → mensagem genérica amigável; o stack trace é logado em stderr para depuração
- [ ] Em nenhum cenário previsível a aplicação exibe um stack trace bruto para o usuário final

**Notas Técnicas**

- A separação entre "erro de domínio" (mensagem exibida ao usuário) e "erro técnico" (logado + mensagem genérica) é o ponto central deste RNF
- A violação deste RNF aciona a dedução D09

---

#### RNF04 - Gerência de recursos

**Tipo:** Requisito Não Funcional | **Prioridade:** Alta

**Descrição**

A aplicação deve usar pool de conexões com o banco de dados e garantir que as conexões sejam encerradas adequadamente ao término da execução.

**Critérios de Aceite**

- [ ] O acesso ao banco usa `pg.Pool` (não `pg.Client` avulso)
- [ ] Ao encerrar a CLI, o pool é fechado (`pool.end()`) antes de o processo terminar
- [ ] Ao encerrar a CLI, não há processo "pendurado" no terminal — o shell retorna ao prompt normalmente
- [ ] Nenhuma conexão é aberta e esquecida dentro de loops ou chamadas individuais

**Notas Técnicas**

- O pool deve ser criado uma única vez na inicialização e injetado nas camadas que precisam dele (ver bônus B08)
- A violação deste RNF aciona as deduções D07 e D08

---

#### RNF05 - Reprodutibilidade

**Tipo:** Requisito Não Funcional | **Prioridade:** Alta

**Descrição**

Qualquer pessoa deve conseguir clonar o repositório, seguir o README e ter o projeto rodando sem passos manuais não documentados, incluindo a criação do esquema do banco e a carga de dados inicial.

**Critérios de Aceite**

- [ ] Existe um script SQL de DDL executável (ex.: `npm run db:schema`); rodar o script duas vezes não gera erro (uso de `CREATE TABLE IF NOT EXISTS` ou equivalente)
- [ ] Existe um script de seed com dados iniciais (funcionários, autores, livros de exemplo); reexecutável sem erro (ex.: `INSERT ... ON CONFLICT DO NOTHING`)
- [ ] O README descreve exatamente os passos para: instalar dependências, configurar o `.env`, executar o schema, executar o seed e iniciar a CLI
- [ ] Um avaliador consegue reproduzir o ambiente seguindo apenas o README, sem contato adicional com o autor

**Notas Técnicas**

- Scripts idempotentes são executáveis N vezes com o mesmo resultado final — esse é o comportamento exigido
- A violação deste RNF aciona a dedução D10

---

#### RNF06 - Tipagem / Contrato

**Tipo:** Requisito Não Funcional | **Prioridade:** Alta

**Descrição**

O código TypeScript deve estar em strict mode e todas as funções, parâmetros e retornos devem ser explicitamente tipados.

**Critérios de Aceite**

- [ ] O `tsconfig.json` tem `"strict": true` habilitado
- [ ] Nenhuma função usa `any` implícito; `as any` só é aceito com justificativa em fronteiras externas
- [ ] Os retornos de funções de repository e service são tipados (ex.: `Promise<Livro | null>`, `Promise<Reserva>`)
- [ ] Tipos e interfaces de domínio estão definidos em arquivos dedicados (ex.: `models/`)
- [ ] O projeto compila sem erros de TypeScript (`tsc --noEmit` passa)

**Notas Técnicas**

- `any` explícito é aceitável na fronteira imediata do resultado bruto de query do `pg`, desde que seja convertido para um tipo tipado logo na sequência

---

#### RNF07 - Qualidade de código

**Tipo:** Requisito Não Funcional | **Prioridade:** Média

**Descrição**

O código deve ser formatado de forma consistente em todos os arquivos e não deve ter avisos de lint não tratados.

**Critérios de Aceite**

- [ ] O projeto possui configuração de ESLint (`.eslintrc.*` ou `eslint.config.*`)
- [ ] O projeto possui configuração de Prettier (`.prettierrc` ou equivalente)
- [ ] `npm run lint` (ou equivalente) executa sem erros nem warnings não suprimidos
- [ ] A formatação é consistente em todos os arquivos (indentação, aspas, ponto-e-vírgula)

**Notas Técnicas**

- A violação deste RNF aciona as deduções D04 (lint) e D05 (formatação)

---
<p align="right"><a href="#sumário">↑ Voltar ao índice</a></p>

### 4.5 Versionamento (GitFlow)

Projeto **individual**.

**Branches mínimas:** `main`, `develop`, ao menos uma `feat/...`, `docs/readme`.

**Commits mínimos:** ≥ 5, com mensagens semânticas, por exemplo:

```
feat: cria esquema de funcionarios autores e livros
feat: implementa camada de repository com pg
feat: adiciona regra de reserva com checagem de disponibilidade
fix: trata reserva de livro indisponivel
docs: documenta modelagem e execucao no readme
```

### 4.6 Registro de Execução no README

Como não há vídeo, o README deve conter exemplos reais de terminal (entrada e saída) cobrindo, no mínimo:

- identificação do operador;
- cadastro de autor e de livro;
- reserva bem-sucedida;
- tentativa de reserva sem exemplar disponível (caso de erro tratado);
- devolução de um livro reservado.

### 4.7 Roteiro de Aceitação (QA) — executado pelo avaliador

Além dos exemplos que o próprio aluno registra no README (seção 4.6), **o avaliador executará o roteiro padronizado abaixo em todos os projetos**, no estilo de um documento de aceitação de feature. Cada caso tem uma ação e um resultado esperado; o projeto é considerado conforme quando reproduz os resultados sem travar.

| Nº | Ação do avaliador | Resultado esperado |
|---|---|---|
| **A01** | Fork, clone e `npm install` | Instala sem erro; apenas `pg` e `dotenv` em `dependencies` |
| **A02** | Copiar `.env.example` → `.env`, configurar e rodar o script de schema **duas vezes** | Tabelas criadas; reexecução não quebra (idempotente) |
| **A03** | Rodar o *seed* | Funcionário, autores e livros iniciais presentes no banco |
| **A04** | Iniciar a CLI e identificar o operador com matrícula válida | Sessão inicia vinculada ao funcionário |
| **A05** | Iniciar a CLI com matrícula inexistente | Recusa controlada, sem crash |
| **A06** | Cadastrar um autor | Mensagem de sucesso; registro persistido |
| **A07** | Cadastrar um livro associado a esse autor | Sucesso; associação N:N criada |
| **A08** | Cadastrar um livro com ISBN já existente | Recusa controlada (regra de unicidade), sem crash |
| **A09** | Listar livros | Exibe o livro com seu(s) autor(es) |
| **A10** | Reservar um livro com exemplar disponível | Sucesso; `disponiveis` decrementa; reserva vinculada ao operador |
| **A11** | Reservar até esgotar e tentar novamente | Recusa controlada: "sem exemplar disponível" |
| **A12** | Devolver um livro com reserva ativa | Sucesso; `disponiveis` incrementa |
| **A13** | Devolver um livro sem reserva ativa | Recusa controlada |
| **A14** | Fornecer entrada inválida (texto onde se espera número) | Mensagem clara; a aplicação continua de pé |
| **A15** | Encerrar a aplicação | Conexões encerradas; sem processo pendurado |

<p align="right"><a href="#sumário">↑ Voltar ao índice</a></p>

### 4.8 Exemplo de fluxo esperado da aplicação

```mermaid
flowchart TD
    A([Funcionário acessa CLI]) --> B[Insere login e senha]
    B --> C{Credenciais válidas?}
    C -- Não --> D[Exibe erro] --> B
    C -- Sim --> E[Exibe menu de interações]
    E --> F[Funcionário seleciona ação]
    F --> G[Exibe formulário de dados]
    G --> H[Funcionário preenche e envia]
    H --> I[Parse dos dados]
    I --> J{Dados válidos?}
    J -- Não --> G
    J -- Sim --> K[Executa ação]
    K --> L([Volta ao menu])
    L --> E
```
---

## 5. Critérios de Avaliação

A nota varia de **0 a 10**. A composição tem três camadas, desenhadas para serem **auditáveis** (todo ponto somado ou retirado deve ter justificativa registrada na devolutiva) e ao mesmo tempo **flexíveis** (o tutor pode reconhecer inovação que a rubrica não previu):

> **Fórmula:** `nota_final = limitar( nota_base − Σ deduções + Σ bônus , mínimo 0 , máximo 10 )`
>
> Ou seja: a nota base é construída pela rubrica padrão; deduções penalizam falhas concretas de qualidade/segurança; bônus recompensam iniciativa. O teto permanece **10**, então bônus servem tanto para recuperar pontos perdidos em deduções quanto para reconhecer mérito.

**Integridade acadêmica:** projetos com plágio (de colegas ou de soluções da internet) recebem **nota 0**, independentemente da rubrica. Consultar documentação e exemplos é permitido, desde que o aluno compreenda, adapte e consiga explicar o próprio código.

### 5.1 Nota Base — Rubrica (10,00 pontos)

**Apresentação e Processo — 3,50 pontos**

| Nº | Critério | Zero | Parcial | Máximo |
|---|---|---|---|---|
| 1 | README completo (modelagem, instalação, execução, exemplos, link do Kanban) | 0 | 0,75 | 1,50 |
| 2 | Organização do repositório (estrutura em camadas, sem lixo, código legível) | 0 | 0,50 | 1,00 |
| 3 | Versionamento: commits semânticos, branches e histórico coerente (GitFlow) | 0 | 0,50 | 1,00 |

**Desenvolvimento — 6,50 pontos**

| Nº | Critério | Zero | Parcial | Máximo |
|---|---|---|---|---|
| 4 | Modelagem do banco: entidades, relação N:N, chaves e restrições de integridade coerentes | 0 | 0,75 | 1,50 |
| 5 | Conexão com PostgreSQL via `pg` + uso correto de `dotenv`, projeto executa sem erro | 0 | 0,50 | 1,00 |
| 6 | Camada de acesso a dados com **queries parametrizadas** (sem ORM, sem concatenação) | 0 | 0,75 | 1,50 |
| 7 | Cadastro de funcionários, autores e livros (com associação de autores) funcionando | 0 | 0,50 | 1,00 |
| 8 | Reserva e devolução respeitando a regra de disponibilidade | 0 | 0,75 | 1,50 |

**Subtotal base: 10,00 pontos.**

### 5.2 Deduções — O que RETIRA nota

Penalidades aplicadas sobre a nota base. Cada dedução aplicada deve ser **registrada por código** na devolutiva (ex.: "−1,0 por D02").

| Cód. | Falha | Penalidade |
|---|---|---|
| **D01** | Uso de ORM ou query-builder (proibido) | Zera o critério 6 **e** −1,50 |
| **D02** | SQL montado por concatenação de input (vulnerável a SQL injection) | −1,50 a −2,50 |
| **D03** | Credenciais hardcoded no código ou `.env` versionado no repositório | −1,00 a −1,50 |
| **D04** | Código com erros/avisos de lint (ESLint) não tratados | −0,50 |
| **D05** | Formatação inconsistente / ausência de Prettier (ou equivalente) | −0,25 |
| **D06** | `node_modules`, dumps ou arquivos lixo versionados | −0,25 |
| **D07** | Pool de conexão não encerrado / vazamento de conexões | −0,50 |
| **D08** | Utilização de conexão simples ao invés de Pool de conexão | −0,50 |
| **D09** | Aplicação trava (crash) diante de erro previsível (entrada inválida, livro inexistente) | −0,75 |
| **D10** | Esquema não reprodutível (sem script de criação, depende de passos manuais não documentados) | −0,50 |
| **D11** | README sem exemplos reais de execução | −0,50 |
| **D12** | Dependência de runtime fora do permitido (além de `pg` e `dotenv`; CLI é exceção, ver B01) | −0,50 por dependência indevida |

### 5.3 Bônus — O que AUMENTA a nota

Acréscimos sobre a nota base, sempre **justificados por escrito** na devolutiva. O total final permanece limitado a 10,00.

| Cód. | Mérito | Bônus |
|---|---|---|
| **B01** | Biblioteca de CLI bem aplicada (`inquirer`/`prompts`/`commander`), com menu navegável e UX clara | +1,50 |
| **B02** | Migrations versionadas e *seed* reprodutível por comando | +1,00 |
| **B03** | Transações (`BEGIN`/`COMMIT`/`ROLLBACK`) garantindo atomicidade em reserva/devolução | +0,75 |
| **B04** | Modelo rico em restrições (`CHECK`, `UNIQUE`, `ON DELETE` coerente) com justificativa | +0,50 |
| **B05** | Tratamento de erro como valor (padrão `Result`/`Either`) ou hierarquia de erros customizados bem usada | +1,50 |
| **B06** | Testes automatizados cobrindo a regra de reserva/devolução | +0,75 |
| **B07** | Validação de entrada de dados robusta | +0,50 |
| **B08** | **Metodologia própria / inovação** não prevista nesta rubrica (avaliação discricionária do tutor, com justificativa registrada). Exemplo: aplicação orientada a objetos com injeção de dependência; aplicação de princípios de programação funcional (imutabilidade, composição...). | +0,25 a +1,00 |

---
<p align="right"><a href="#sumário">↑ Voltar ao índice</a></p>

## 6. Checklist Final de Entrega

Antes de enviar no AVA, confira:

```
[ ] Fiz o fork do repositório template para a minha conta
[ ] Fork público criado no GitHub
[ ] Projeto Node.js configurado, executa sem erro
[ ] Apenas pg e dotenv como dependências de runtime (CLI opcional à parte)
[ ] .env no .gitignore e .env.example entregue
[ ] Esquema do banco criado por script reprodutível (DDL)
[ ] Seed inicial disponível
[ ] Entidades modeladas: funcionario, autor, livro, livro_autor (N:N), reserva, devolucao
[ ] Camada de repository com queries parametrizadas (sem ORM)
[ ] Cadastro de funcionário e identificação do operador funcionando
[ ] Cadastro de autor funcionando
[ ] Cadastro de livro com associação de autores funcionando
[ ] Listagem de livros e autores
[ ] Reserva recusada quando não há exemplar disponível
[ ] Devolução atualizando a disponibilidade
[ ] Erros previsíveis tratados (sem crash)
[ ] CLI orquestrando o fluxo
[ ] Código sem erros de lint e formatado (Prettier ou equivalente)
[ ] Commits semânticos e branches mínimas (GitFlow)
[ ] Quadro Kanban com tarefas do projeto
[ ] README com modelagem, instalação, execução e exemplos reais
[ ] Links do fork e do Kanban enviados no AVA
```

---

## 7. Modelo de README.md (referência)

```markdown
# Acervo CLI — Biblioteca Acadêmica

## Sobre o projeto
Aplicação de terminal em Node.js (TypeScript) que gerencia o acervo de uma
biblioteca acadêmica, persistindo os dados em PostgreSQL sem uso de ORM.
O sistema é operado por funcionários cadastrados.

## Objetivo
Praticar modelagem relacional, acesso a dados com o driver pg,
queries parametrizadas, variáveis de ambiente e construção de CLI.

## Tecnologias
- Node.js
- TypeScript
- PostgreSQL
- pg
- dotenv
- (opcional) biblioteca de CLI

## Modelagem do banco
Descreva aqui as tabelas, relacionamentos e as decisões de modelagem
(disponibilidade, restrições de integridade, comportamento de ON DELETE).
Inclua o diagrama (DER) se possível.

## Pré-requisitos
- Node.js
- PostgreSQL em execução
- Git

## Como instalar
1. Faça o fork e clone o seu repositório
2. `npm install`
3. Copie `.env.example` para `.env` e preencha as credenciais
4. Execute o script de criação do esquema
5. (opcional) Execute o seed

## Como executar
Descreva o comando de inicialização da CLI, como identificar o operador
e como usar cada operação.

## Funcionalidades
- Cadastro de funcionários (operadores)
- Cadastro de autores e livros
- Listagem de acervo
- Reserva com checagem de disponibilidade
- Devolução

## Exemplos de execução
Cole aqui entradas e saídas reais do terminal para:
- identificação do operador
- cadastro
- reserva válida
- reserva recusada (sem exemplar)
- devolução

## Decisões de arquitetura
Explique as camadas e por que o acesso a dados foi isolado.

## Kanban
Link: COLE_AQUI_O_LINK

## Branches utilizadas
- main
- develop
- feat/...
- docs/readme

## Melhorias futuras
- Cadastro de membros/usuários
- Histórico de reservas por membro
- Filtros e busca por título/autor
```

---
<p align="right"><a href="#sumário">↑ Voltar ao índice</a></p>

## 8. Referências e Fundamentação

- **Ted Neward**, *The Vietnam of Computer Science* (2006): o custo real do *impedance mismatch* objeto-relacional, que motiva expor o SQL antes de abstraí-lo.
- **Martin Fowler**, *Patterns of Enterprise Application Architecture* (2002): padrões Repository e Data Mapper, base da separação entre domínio e persistência.
- **John Ousterhout**, *A Philosophy of Software Design* (2018): módulos profundos — interface estreita escondendo a complexidade de acesso a dados.
- **Alexis King**, *Parse, Don't Validate* (2019): validação na fronteira de entrada (fundamenta o bônus B07).
- **OWASP**: *queries* parametrizadas como defesa canônica contra SQL injection (fundamenta RNF01 e a dedução D02).
- **Documentação oficial do PostgreSQL** e do **node-postgres (`pg`)**: referência técnica para conexão, *pooling* e *prepared statements*.