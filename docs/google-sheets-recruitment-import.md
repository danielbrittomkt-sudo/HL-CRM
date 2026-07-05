# Importacao Google Sheets - Recrutamento

Este documento explica como conectar uma planilha Google Sheets ao endpoint publico da Vercel do modulo Recrutamento.

Endpoint usado:

```text
POST https://hl-crm-eight.vercel.app/api/recruitment/import-sheet
```

O endpoint recebe uma linha da planilha e salva o candidato no Supabase. A planilha deve enviar o mesmo segredo configurado na Vercel em `SHEET_IMPORT_SECRET`.

## Colunas da planilha

Crie uma planilha Google Sheets com a primeira linha contendo exatamente estas colunas:

```text
nome
telefone
email
fonte
observacao
status_importacao
mensagem_retorno
data_importacao
```

Campos obrigatorios para envio:

- `nome`
- `telefone`
- `fonte`

O script ignora linhas sem qualquer um desses campos obrigatorios.

## Como configurar

1. Abra o Google Sheets.
2. Crie a planilha com as colunas listadas acima.
3. Clique em **Extensoes**.
4. Clique em **Apps Script**.
5. Apague qualquer codigo inicial.
6. Cole o codigo completo da secao abaixo.
7. No Apps Script, troque `SEU_SEGREDO_AQUI` pelo mesmo valor configurado na Vercel em `SHEET_IMPORT_SECRET`.
8. Salve o projeto.
9. Execute manualmente a funcao `importarCandidatosPendentes` para testar.

Nao coloque o segredo real no repositorio, em prints publicos ou em documentos versionados.

## Codigo Google Apps Script

```javascript
const API_URL = "https://hl-crm-eight.vercel.app/api/recruitment/import-sheet";
const IMPORT_SECRET = "SEU_SEGREDO_AQUI";
const MAX_ROWS_PER_RUN = 50;

const REQUIRED_COLUMNS = [
  "nome",
  "telefone",
  "email",
  "fonte",
  "observacao",
  "status_importacao",
  "mensagem_retorno",
  "data_importacao"
];

function importarCandidatosPendentes() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const values = sheet.getDataRange().getValues();

  if (values.length < 2) {
    return;
  }

  const headers = values[0].map(function (header) {
    return String(header).trim();
  });

  const columns = mapColumns(headers);
  validateColumns(columns);

  let processed = 0;

  for (let rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    if (processed >= MAX_ROWS_PER_RUN) {
      break;
    }

    const row = values[rowIndex];
    const currentStatus = getCell(row, columns.status_importacao);

    if (currentStatus) {
      continue;
    }

    const payload = {
      nome: getCell(row, columns.nome),
      telefone: getCell(row, columns.telefone),
      email: getCell(row, columns.email),
      fonte: getCell(row, columns.fonte),
      observacao: getCell(row, columns.observacao)
    };

    if (!payload.nome || !payload.telefone || !payload.fonte) {
      continue;
    }

    const result = enviarCandidato(payload);
    preencherResultado(sheet, rowIndex + 1, columns, result);
    processed += 1;
  }
}

function mapColumns(headers) {
  const columns = {};

  headers.forEach(function (header, index) {
    columns[header] = index;
  });

  return columns;
}

function validateColumns(columns) {
  const missing = REQUIRED_COLUMNS.filter(function (column) {
    return columns[column] === undefined;
  });

  if (missing.length > 0) {
    throw new Error("Colunas ausentes: " + missing.join(", "));
  }
}

function getCell(row, columnIndex) {
  return String(row[columnIndex] || "").trim();
}

function enviarCandidato(payload) {
  try {
    const response = UrlFetchApp.fetch(API_URL, {
      method: "post",
      contentType: "application/json",
      headers: {
        "x-import-secret": IMPORT_SECRET
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const statusCode = response.getResponseCode();
    const bodyText = response.getContentText();
    const body = bodyText ? JSON.parse(bodyText) : {};

    if (statusCode >= 200 && statusCode < 300 && body.success === true) {
      if (body.duplicated === true) {
        return {
          status: "DUPLICADO",
          message: "Candidato ja existe por telefone."
        };
      }

      return {
        status: "IMPORTADO",
        message: "Candidato importado com sucesso."
      };
    }

    return {
      status: "ERRO",
      message: body.error || "Erro HTTP " + statusCode
    };
  } catch (error) {
    return {
      status: "ERRO",
      message: error && error.message ? error.message : String(error)
    };
  }
}

function preencherResultado(sheet, rowNumber, columns, result) {
  sheet.getRange(rowNumber, columns.status_importacao + 1).setValue(result.status);
  sheet.getRange(rowNumber, columns.mensagem_retorno + 1).setValue(result.message);
  sheet.getRange(rowNumber, columns.data_importacao + 1).setValue(new Date());
}
```

## Como testar manualmente

1. Preencha uma linha da planilha com dados de teste:

```text
nome: Teste Planilha
telefone: 21999999999
email: teste.planilha@email.com
fonte: Planilha
observacao: Teste manual pelo Google Sheets
```

2. Deixe vazias estas colunas:

```text
status_importacao
mensagem_retorno
data_importacao
```

3. No Apps Script, selecione a funcao:

```text
importarCandidatosPendentes
```

4. Clique em **Executar**.
5. Autorize o script quando o Google solicitar.
6. Volte para a planilha e confira:
   - `status_importacao`
   - `mensagem_retorno`
   - `data_importacao`

Resultados esperados:

- `IMPORTADO`: candidato criado no Supabase.
- `DUPLICADO`: candidato ja existia pelo telefone.
- `ERRO`: endpoint recusou ou houve falha na requisicao.

## Como criar gatilho automatico

1. No Google Sheets, clique em **Extensoes**.
2. Clique em **Apps Script**.
3. No menu lateral do Apps Script, clique no icone de **Relogio / Triggers**.
4. Clique em **Adicionar trigger**.
5. Em funcao, escolha:

```text
importarCandidatosPendentes
```

6. Em origem do evento, escolha **Baseado em tempo**.
7. Escolha a frequencia **A cada 5 minutos**.
8. Salve o gatilho.

O script processa no maximo 50 linhas por execucao para evitar limites do Google Apps Script.

## Regras do script

- Le todas as linhas da planilha.
- Ignora linhas sem `nome`, `telefone` ou `fonte`.
- Ignora linhas que ja tenham `status_importacao` preenchido.
- Envia no maximo 50 linhas por execucao.
- Envia o header `x-import-secret`.
- Preenche `status_importacao`, `mensagem_retorno` e `data_importacao`.

## Variavel obrigatoria na Vercel

No projeto da Vercel, a variavel abaixo precisa existir:

```text
SHEET_IMPORT_SECRET=SEU_SEGREDO_AQUI
```

O valor usado em `IMPORT_SECRET` no Apps Script deve ser igual ao valor configurado na Vercel. Nunca coloque o segredo real neste arquivo.
