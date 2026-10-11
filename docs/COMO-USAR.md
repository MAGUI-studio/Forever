# Como configurar e usar a lista de convidados

## Ativação inicial (uma vez)

O código está preparado para Firebase Authentication e Cloud Firestore Standard no plano gratuito Spark. O projeto Firebase, as contas e as credenciais precisam ser criados na sua conta Google. Não habilite faturamento, Blaze, Cloud Functions nem App Hosting para este sistema. A aplicação usa o servidor Next.js da hospedagem existente.

1. Entre em https://console.firebase.google.com/ e crie um projeto. Google Analytics é opcional e desnecessário aqui. Mantenha o plano Spark, sem conta de faturamento.
2. Em Build > Firestore Database, crie um banco **Standard**, ID `(default)`, em modo de produção. Escolha uma região próxima dos convidados, preferencialmente São Paulo quando disponível. Não é necessário criar coleções ou índices manualmente.
3. Na aba Rules do Firestore, publique o conteúdo de `firestore.rules` na raiz deste projeto. As regras negam todo acesso direto: as rotas do servidor fazem o acesso autenticado. Não use modo de teste.
4. Em Build > Authentication > Sign-in method, habilite **Email/Password** (senha, sem link por e-mail). Em Users, adicione uma conta para Giovanna e outra para Edson, com senhas fortes e diferentes. Copie os dois **UIDs**. Não basta permitir o e-mail: o servidor confere exatamente esses identificadores.
5. Em Configurações do projeto > Geral > Seus apps, adicione um app Web (`</>`). Não precisa habilitar Firebase Hosting. Copie `apiKey`, `authDomain` e `projectId`.
6. Em Configurações do projeto > Contas de serviço > Firebase Admin SDK, gere uma chave privada. Do JSON, use apenas `project_id`, `client_email` e `private_key` para preencher as variáveis de servidor. O JSON é secreto: não coloque no Git, na pasta public, no chat nem em variáveis NEXT_PUBLIC.
7. Para rodar localmente, copie `.env.example` para `.env.local` e preencha todos os campos. Em FIREBASE_ADMIN_UIDS, coloque os dois UIDs separados por vírgula. Em FIREBASE_PRIVATE_KEY, copie o valor private_key do JSON entre aspas, preservando `\n` como no JSON. Os project IDs público e privado devem ser iguais.
8. Na hospedagem existente (por exemplo, Vercel), adicione as mesmas variáveis nas configurações de ambiente e faça uma nova implantação. As variáveis NEXT_PUBLIC são incorporadas no build, por isso é necessário recompilar. Não é preciso migrar o site para Firebase Hosting. Uma exportação estática não executa as APIs deste projeto.
9. Em Authentication > Settings > Authorized domains, confira o domínio publicado; acrescente o domínio e `localhost` caso necessário.
10. Abra `/admin`, entre com uma das contas autorizadas e faça o teste descrito abaixo antes de distribuir os links.

Se usar o Firebase CLI já instalado, também pode publicar as regras com `firebase deploy --only firestore:rules --project SEU_PROJECT_ID`. A publicação pela aba Rules evita instalar ferramentas extras.

## Uso de Giovanna e Edson

- Acesse `https://SEU-SITE/admin` pelo celular ou computador e entre com seu e-mail e senha.
- Clique **Adicionar convite / família**. Dê um nome ao convite e adicione todas as pessoas incluídas, inclusive crianças e acompanhantes já autorizados. Para uma pessoa sozinha, crie um convite com apenas ela.
- Salve e clique **Copiar link**. Envie esse link àquela família pelo WhatsApp. Quem recebe o link pode ver e responder pelas pessoas desse convite, portanto compartilhe apenas com os destinatários.
- O convidado abre o link, clica **Consultar convite**, escolhe a resposta de cada pessoa e salva. Nenhum cadastro é necessário. Também pode colar o código na seção de confirmação do site.
- Já respondeu? O mesmo link mostra as respostas anteriores e permite corrigir até o encerramento. Reenviar não cria novas pessoas nem duplica a lista.
- Use a busca e os filtros para acompanhar confirmados, pendentes e recusas. Os contadores consideram apenas convites ativos. Cada pessoa conta individualmente; crianças também contam.
- Em **Editar**, corrija nomes, adicione/remova pessoas ou registre respostas recebidas pessoalmente. Para preservar o histórico sem aceitar novas respostas, desmarque **Convite ativo**. Excluir apaga definitivamente o convite e as respostas.
- No dia, marque **Chegou** ao lado dos confirmados. Esse campo é separado da confirmação e só os administradores podem alterá-lo.
- Em **Prazo e abertura das confirmações**, defina uma data/hora ou feche o formulário. O prazo é digitado no horário do dispositivo, armazenado em UTC e exibido aos convidados no horário de Brasília. Sem data, não há prazo. Desmarcar **Aceitar respostas** fecha imediatamente. O painel continua permitindo ajustes manuais.
- Use **Atualizar lista** para carregar respostas recentes. O painel não mantém atualização contínua, economizando leituras gratuitas. Se duas pessoas editarem o mesmo convite, o sistema impede sobrescrever alterações: atualize e reabra a edição.
- Para trocar uma senha esquecida, o responsável pelo projeto pode enviar a redefinição pelo console Firebase Authentication. Para trocar um administrador, atualize FIREBASE_ADMIN_UIDS e faça nova implantação; desative a conta antiga no Authentication.

## Teste antes de enviar convites

1. Crie um convite de teste com duas pessoas e copie o link.
2. Abra em janela anônima: confirme uma pessoa e recuse a outra. Atualize o painel e confira os contadores.
3. Consulte novamente o mesmo código e altere a resposta. Confira que continuam existindo apenas duas pessoas.
4. Abra o convite em duas abas; salve numa delas e tente salvar a outra. A segunda deve solicitar nova consulta, preservando a resposta mais recente.
5. Desative o convite: o código deve deixar de funcionar. Reative e encerre o prazo: a consulta funciona, mas o envio é bloqueado.
6. Verifique chegada, edição, exportação e exclusão com esse convite de teste.
7. Sem login, a API administrativa deve negar acesso. Uma conta que não esteja nos UIDs autorizados também não pode acessar os dados.

## Gratuidade e funcionamento

O plano Spark não tem cobrança automática nem exige cartão. Firestore não tem a pausa por inatividade do Supabase Free. Existem cotas: ultrapassá-las pode interromper operações até a renovação. A aplicação não armazena fotos no Firebase, não usa SMS, não envia e-mails em massa e não depende de funções pagas. Confira periodicamente o uso no console. O domínio próprio e a hospedagem existente são serviços separados.

O sistema aceita apenas códigos aleatórios de 48 caracteres, não oferece busca pública por nome, valida a lista e o prazo no servidor e usa transações para impedir sobrescritas concorrentes. O código vai no fragmento `#` do link, que não é enviado como endereço de requisição ao servidor. Quem possui o código tem acesso ao convite. Em caso de compartilhamento indevido, desative o convite e crie outro.

## Verificação técnica

`npm run lint`, `npx tsc --noEmit`, `npm run build` e `npm run test:guests`.

Os testes automatizados de regras de negócio usam um banco simulado. O teste real de Authentication e Firestore exige configurar o projeto e seguir o roteiro acima.

Referências: https://firebase.google.com/pricing ; https://firebase.google.com/docs/firestore/quotas ; https://firebase.google.com/docs/admin/setup

## Modais do dashboard

Adicionar e editar convites, configurar confirmações e excluir convites abrem em modais. O Nuqs sincroniza a URL: `?action=new-invitation`, `?action=edit-invitation&invitation=ID`, `?action=settings` ou `?action=delete-invitation&invitation=ID`. A recarga reabre o modal para a conta autenticada; voltar e avançar acompanham a navegação. Apenas o tipo do modal e o ID do convite ficam na URL: nomes, mensagens, códigos secretos e campos do rascunho não são incluídos. Alterações do formulário só são gravadas ao salvar. Escape, fechar, cancelar ou clicar no fundo fecham o modal; durante uma gravação, esses controles ficam bloqueados.

### Acompanhar o envio dos convites

No dashboard, use **Copiar link** para copiar o link exclusivo da família. O botão mostra **Copiado** por três segundos. Depois de enviar pelo WhatsApp ou outro canal, clique em **Marcar enviado**. Essa marcação fica salva no Firebase; clique em **Enviado** para desfazê-la. Copiar o link não marca o convite como enviado automaticamente. O filtro permite ver os convites enviados ou ainda não enviados.

O link de confirmação abre o convite automaticamente. Cada pessoa escolhe sua presença e, ao final, salva as respostas. É possível revisar uma resposta enquanto as confirmações estiverem abertas.

### Baixar um convite em PDF

Clique em **Baixar convite** no cartão da família. O navegador baixa um PDF A5 com o nome da família, mensagem, local, data, horário e QR Code exclusivo. O QR Code e o texto abaixo dele são clicáveis e abrem a confirmação na URL configurada em `NEXT_PUBLIC_SITE_URL`. A fonte Cormorant Garamond fica incorporada no arquivo, junto com os ornamentos do site. A geração acontece no navegador, gratuitamente, sem salvar arquivos no Firebase. Baixar o PDF não marca o convite como enviado: use **Marcar enviado** depois de encaminhá-lo. Convites inativos não podem ser baixados.


### Convites individuais e de família/grupo

Ao criar um convite, escolha Individual para uma pessoa (o nome dela identifica o convite) ou Família ou grupo para organizar uma ou mais pessoas sob um nome como Família Oliveira, Amigos do Edson ou Pessoal do Fitdance.

No cartão, Copiar link do grupo e PDF do grupo permitem responder por todos. Ao lado de cada participante, Link pessoal e PDF pessoal permitem consultar e responder somente por aquela pessoa. Essa restrição é validada no servidor; remover a pessoa ou desativar o convite também bloqueia seu acesso pessoal. Recados e restrições alimentares pessoais ficam separados dos dados do grupo e aparecem no painel. Não envie o código do grupo a quem deve responder apenas por si.


A origem dos links e QR Codes é definida por `NEXT_PUBLIC_SITE_URL` no `.env`. No desenvolvimento local, use `http://localhost:3000`; em produção, configure `https://giovannaeedson.magui.studio` antes do build. Reinicie o servidor após alterar essa variável.
