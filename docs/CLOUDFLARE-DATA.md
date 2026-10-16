# Dados no Cloudflare Workers

O servidor usa Firebase Authentication e a API REST do Firestore. Não importar
`firebase-admin/firestore` em runtime: o SDK carrega Protobuf e gera funções durante
consultas, o que não é permitido durante requisições do Worker. Imports de tipos
continuam permitidos.

`services().db` oferece as operações usadas pelas rotas: documentos, coleções,
consultas, máscaras de atualização, precondições e transações. As transações usam
`beginTransaction`, leituras com o mesmo token e `commit`; conflitos `ABORTED`
reexecutam o callback, e erros provocam rollback. Não realizar chamadas externas
ou outros efeitos irreversíveis dentro dos callbacks de transação.

Segredos e configurações de servidor são lidos dos bindings da requisição por
`runtimeEnv`, com fallback para `process.env` em desenvolvimento. Variáveis
`NEXT_PUBLIC_*` continuam sendo fornecidas no build. Imagens usam UploadThing.

O build executa `test:guests` e `test:firestore`. A primeira suíte verifica as
rotas com serviços simulados; a segunda verifica o transporte REST com respostas
simuladas, incluindo atomicidade, conflitos, idempotência e envio da autorização.
Esses testes não fazem cobranças nem alteram dados de produção.
