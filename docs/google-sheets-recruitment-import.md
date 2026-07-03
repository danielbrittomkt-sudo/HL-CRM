# Importacao Google Sheets - Recrutamento

Este guia conecta uma planilha Google Sheets ao endpoint interno do Home Life CRM:

```text
POST https://SEU-PROJETO.vercel.app/api/recruitment/import-sheet
```

O endpoint recebe uma linha da planilha e salva como candidato no Supabase.

## Variavel na Vercel

No ambiente da Vercel, configure:

```text
SHEET_IMPORT_SECRET=SEU_SEGREDO_AQUI
```

Use o mesmo valor no Apps Script em `IMPORT_SECRET`.

## Colunas da planilha

Crie uma planilha com a primeira linha contendo exatamente estas colunas:

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

Campos obrigatorios para importar:

- `nome`
- `telefone`
- `fonte`

Linhas sem um desses campos serao ignoradas pelo script.

## Como criar o Apps Script

1. Abra a planilha no Google Sheets.
2. Clique em **Extensoes > Apps Script**.
3. Apague qualquer codigo inicial.
4. Cole o codigo completo abaixo.
5. Altere:
   - `API_URL`
   - `IMPORT_SECRET`
6. Clique em **Salvar**.
7. Rode manualmente a funcao `importarCandidatosRecrutamento` para testar.
8. Autorize o script quando o Google pedir.

## Codigo Google Apps Script

```javascript
const API_URL = "https://SEU-PROJETO.vercel.app/api/recruitment/import-sheet";
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

function importarCandidatosRecrutamento() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const values = sheet.getDataRange().getValues();

  if (values.length < 2) {
    return;
  }

  const headers = values[0].map((header) => String(header).trim());
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

  headers.forEach((header, index) => {
    columns[header] = index;
  });

  return columns;
}

function validateColumns(columns) {
  const missing = REQUIRED_COLUMNS.filter((column) => columns[column] === undefined);

  if (missing.length) {
    throw new Error(`Colunas ausentes: ${missing.join(", ")}`);
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
          message: "Candidato ja existia por telefone."
        };
      }

      return {
        status: "IMPORTADO",
        message: "Candidato importado com sucesso."
      };
    }

    return {
      status: "ERRO",
      message: body.error || `Erro HTTP ${statusCode}`
    };
  } catch (error) {
    return {
      status: "ERRO",
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

function preencherResultado(sheet, rowNumber, columns, result) {
  const now = new Date();

  sheet.getRange(rowNumber, columns.status_importacao + 1).setValue(result.status);
  sheet.getRange(rowNumber, columns.mensagem_retorno + 1).setValue(result.message);
  sheet.getRange(rowNumber, columns.data_importacao + 1).setValue(now);
}
```

## Como testar

1. Preencha uma linha com:

```text
nome: Daniel Brito
telefone: 21999999999
email: daniel@email.com
fonte: Catho
observacao: Importado pela planilha
```

2. Deixe vazias as colunas:

```text
status_importacao
mensagem_retorno
data_importacao
```

3. No Apps Script, selecione a funcao:

```text
importarCandidatosRecrutamento
```

4. Clique em **Executar**.
5. Volte para a planilha e confira:
   - `status_importacao`
   - `mensagem_retorno`
   - `data_importacao`

## Gatilho automatico

Para rodar automaticamente:

1. No Apps Script, clique em **Gatilhos**.
2. Clique em **Adicionar gatilho**.
3. Escolha a funcao:

```text
importarCandidatosRecrutamento
```

4. Em origem do evento, escolha **Baseado em tempo**.
5. Escolha a frequencia desejada, por exemplo:
   - a cada 5 minutos;
   - a cada 15 minutos;
   - a cada hora.
6. Salve o gatilho.

O script processa no maximo 50 linhas por execucao para reduzir risco de limite do Google Apps Script.

## Cuidados

- Nao coloque o segredo real em repositorios publicos.
- Use `SHEET_IMPORT_SECRET` na Vercel com o mesmo valor de `IMPORT_SECRET`.
- A URL final deve apontar para o dominio publicado da Vercel.
- Linhas ja marcadas em `status_importacao` nao serao processadas novamente.
- Para reenviar uma linha, limpe `status_importacao`, `mensagem_retorno` e `data_importacao`.
