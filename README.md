# Desenvolvedor(a) Back End Node — Projeto Final Avaliativo
## Acervo CLI: Sistema de Gerenciamento de Biblioteca Acadêmica (PostgreSQL + Node.js)


## SUMÁRIO

0. [Ponto de Partida — Fork do Repositório Template](#0-ponto-de-partida--fork-do-repositório-template)
1. [Requisitos das Tarefas](#1-requisitos-das-tarefas)
   - [1.1 Organização Arquitetural](#11-organização-arquitetural)
   - [1.2 Modelagem do Banco de Dados](#12-modelagem-do-banco-de-dados)
2. [Critérios de Avaliação (base, deduções e bônus)](#2-critérios-de-avaliação)
3. [Referências e Fundamentação](#3-referências-e-fundamentação)

---

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

## 1. Requisitos das Tarefas

### 1.1 Organização Arquitetural

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

### 1.2 Modelagem do Banco de Dados

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

### 1.8 Exemplo de fluxo esperado da aplicação

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

## 2. Critérios de Avaliação

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

## 3. Referências e Fundamentação

- **Ted Neward**, *The Vietnam of Computer Science* (2006): o custo real do *impedance mismatch* objeto-relacional, que motiva expor o SQL antes de abstraí-lo.
- **Martin Fowler**, *Patterns of Enterprise Application Architecture* (2002): padrões Repository e Data Mapper, base da separação entre domínio e persistência.
- **John Ousterhout**, *A Philosophy of Software Design* (2018): módulos profundos — interface estreita escondendo a complexidade de acesso a dados.
- **Alexis King**, *Parse, Don't Validate* (2019): validação na fronteira de entrada (fundamenta o bônus B07).
- **OWASP**: *queries* parametrizadas como defesa canônica contra SQL injection (fundamenta RNF01 e a dedução D02).
- **Documentação oficial do PostgreSQL** e do **node-postgres (`pg`)**: referência técnica para conexão, *pooling* e *prepared statements*.