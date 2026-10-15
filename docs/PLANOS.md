# Planos Forever — referência de recursos e regras

Atualizado em 15/10/2026. Este documento descreve a oferta comercial e o comportamento atual do código. Quando houver diferença entre os dois, ela está explicitada na seção de pendências. Não substitui as configurações do Stripe nem representa uma verificação do ambiente publicado.

## Preços e capacidade

| Regra | Forever Essencial | Forever PRO |
| --- | --- | --- |
| Valor do plano | R$ 497,00 | R$ 997,00 |
| Forma de contratação | Pagamento único | Pagamento único |
| Mensalidade / renovação automática | Não | Não |
| Capacidade de pessoas | 50 no evento | Ilimitada pela regra do plano |
| Limite de pessoas por convite | Sem limite independente; respeita as 50 do evento | Sem limite por convite |
| Quantidade de convites | Sem cota independente; limitada pela capacidade de pessoas | Sem cota de plano |
| Upgrade do Essencial | R$ 500,00 para o PRO | Não se aplica |

“Ilimitado” significa ausência de uma cota comercial de convidados. Validações, limites de tamanho de requisição e limites da infraestrutura continuam existindo.

### Como as 50 pessoas são contadas

- O limite soma as pessoas dos convites ativos do casamento, independentemente da quantidade de convites.
- Crianças também são pessoas cadastradas e entram na contagem.
- Confirmados, pendentes e recusados entram na contagem enquanto pertencem a convites ativos. O limite não é de confirmações.
- Convites inativos não entram na soma usada pela API para editar/reativar convites.
- Não existe mais a antiga regra de 40 pessoas por convite.
- Ao atingir 50, a interface bloqueia a criação de convites e o formulário de criação, mostrando a opção de conhecer o PRO.
- A API também verifica capacidade na criação e edição/reativação: alterar a URL não permite ultrapassar o limite.
- Na criação, a API soma as pessoas do novo convite mesmo se o envio tentar criá-lo inativo. Não usar convites inativos como caminho alternativo de criação acima do limite.

## Recursos compartilhados

| Recurso | Essencial | PRO |
| --- | --- | --- |
| Site do casamento e endereço público | Sim | Sim |
| Editor de fotos, textos e informações | Sim | Sim |
| Rascunho, prévia e publicação | Sim | Sim |
| Galeria do casal | Sim | Sim |
| Cadastro e edição de convites individuais e de família/grupo | Sim | Sim |
| Lista de convidados em tabela | Sim | Sim |
| Código do convite e links pessoais | Sim | Sim |
| Convites em PDF com QR Code | Sim | Sim |
| RSVP individual por pessoa | Sim | Sim |
| Prazo e abertura/fechamento das confirmações | Sim | Sim |
| Marcação de envio e acompanhamento de abertura/respostas | Sim | Sim |
| Coleta de restrições alimentares no RSVP | **Sim** | **Sim** |
| Visualização das restrições na lista e no convite expandido | **Sim** | **Sim** |
| Recados aos noivos e mural de recados | Sim | Sim |
| Lista de presentes com link de pagamento próprio | Sim | Sim |
| Comissão Forever sobre presentes | 0% | 0% |
| Busca, filtros, ordenação e expansão compartilháveis pela URL | Sim, nas telas disponíveis | Sim, nas telas disponíveis |
| Feedback com toasts e tooltips de ações por ícone | Sim | Sim |

A galeria possui limite compartilhado de **6 fotos**; o PRO não remove esse limite. Outras imagens editáveis do template são campos separados.

As taxas do provedor usado no link de presentes não são uma comissão Forever. O recebimento depende do serviço escolhido pelo casal; o checkout Stripe dos planos é uma integração distinta.

**Restrição alimentar individual não é o relatório do buffet.** O Essencial coleta e mostra a restrição da Mayla, por exemplo. O PRO acrescenta a página que reúne as necessidades dos convidados confirmados para organizar a alimentação.

## Exclusivos do PRO

| Recurso | O que permite |
| --- | --- |
| Organização | Acesso ao conjunto de ferramentas de organização do evento |
| Mesas e lugares | Criar/editar mesas, definir capacidade e distribuir convidados confirmados por mesa e lugar |
| Controle de chegada | Consultar confirmados, registrar chegadas individuais/em grupo e desfazer registros |
| Equipe da recepção | Criar e gerenciar acessos dedicados, revogar/reativar acesso e remover pessoas da equipe |
| Resumo para o buffet | Consultar confirmados, crianças e restrições; buscar e filtrar por mesa e necessidade alimentar |
| Histórico | Consultar alterações registradas, responsáveis, datas e detalhes disponíveis |

A equipe recebe apenas os dados necessários à recepção: nomes, mesas e chegadas. Não recebe acesso administrativo aos convites, configurações nem aos recados privados. O responsável pelo casamento mantém o acesso administrativo conforme o plano.

## Páginas e acesso

Substituir `/{casamento}` pelo slug, por exemplo `/giovanna-e-edson`.

| Rota | Essencial | PRO |
| --- | --- | --- |
| `/{casamento}` — site público publicado | Sim | Sim |
| `/{casamento}/painel` | Sim | Sim |
| `/{casamento}/convidados` | Sim | Sim |
| `/{casamento}/convidados/novo` | Se houver capacidade | Sim |
| `/{casamento}/convidados/{id}/editar` | Respeitando capacidade | Sim |
| `/{casamento}/editar-site` | Sim | Sim |
| `/{casamento}/recepcao` | Não | Sim |
| `/{casamento}/mesas` | Não | Sim |
| `/{casamento}/buffet` | Não | Sim |
| `/{casamento}/historico` | Não | Sim |
| `/{casamento}/equipe` | Não | Sim |

As páginas protegidas e APIs usam os módulos efetivos do plano. Parâmetros de URL, incluindo filtros e convites expandidos, não concedem permissões. Uma URL compartilhada de painel exige uma conta autorizada.

## Validade de acesso

O Essencial vale até o fim do dia do evento. O PRO acrescenta três meses de calendário, limitando o dia ao último dia do mês de destino quando necessário. O cálculo usa São Paulo. A expiração é verificada nas requisições, sem apagar dados ou alterar o plano no banco. O login permanece disponível, redirecionando para `/{casamento}/acesso-expirado`; as páginas de gestão e alterações ficam bloqueadas. O site público e seu RSVP ficam indisponíveis, e o casamento sai do sitemap. O superadministrador mantém acesso de gestão. Datas ausentes ou inválidas não geram uma expiração automática.

## Upgrade e pagamento

1. “Conhecer Forever PRO” abre uma modal com benefícios, crédito do Essencial e valor final.
2. O responsável escolhe continuar para pagamento; só então o checkout Stripe é criado.
3. O valor base do upgrade é calculado como **R$ 997 − R$ 497 = R$ 500**. É crédito fixo do plano, não um cálculo de tempo restante ou consulta ao histórico individual de pagamentos.
4. Se `STRIPE_PRICE_UPGRADE` estiver configurado, a API valida que é um preço ativo, em BRL, de pagamento único e de R$ 500. Sem esse ID, cria o item com o valor configurado no código.
5. A API exige responsável autenticado, casamento correspondente e plano atual Essencial para iniciar o upgrade.
6. **Somente o webhook oficial com assinatura válida efetiva o PRO.** A URL de retorno do checkout não prova pagamento.
7. A rotina processa `checkout.session.completed` e `checkout.session.async_payment_succeeded`, exigindo sessão concluída e pagamento `paid` ou `no_payment_required`. Pagamentos pendentes não liberam acesso.
8. O plano e o registro do pedido são persistidos em transação. Eventos repetidos da mesma sessão não reaplicam o upgrade nem duplicam o registro de ativação.
9. Ao retornar, a interface consulta o plano salvo e só anuncia sucesso quando o PRO estiver efetivado. Até lá, mostra confirmação pendente.

O checkout permite códigos promocionais; quando aplicados, o total final pode diferir do valor base. Convites, confirmações e demais dados existentes são preservados no upgrade.

### Teste e produção

- O modo é definido pelas chaves Stripe, independentemente de a Vercel chamar o deploy de “Production”.
- Teste e produção têm preços, eventos e segredos separados.
- O endpoint hospedado é `/api/webhooks/stripe` e precisa estar acessível ao Stripe.
- Configurar também `checkout.session.async_payment_failed` para registrar falhas de pagamentos assíncronos.
- `STRIPE_WEBHOOK_SECRET` deve pertencer ao endpoint daquele ambiente. O segredo de `stripe listen` é para o encaminhamento local.
- No desenvolvimento local, `npm run stripe:listen` encaminha eventos oficiais para a porta 3001.
- Chaves secretas não devem ser publicadas em documentos, código ou conversas. Este documento não contém credenciais.

## Administração manual no Studio

- O superadministrador pode atribuir Essencial, PRO ou **Sem plano**, sem cobrança e sem alteração no Stripe.
- Alterar o plano altera automaticamente os recursos efetivos. Não existe mais controle individual de módulos no Studio; `/studio/modules` redireciona para `/studio`.
- Flags antigas de módulos armazenadas no banco não substituem as regras do plano.
- Atribuir PRO manualmente libera os mesmos módulos, sem exigir uma compra anterior.
- Remover o plano preserva os dados, bloqueia o painel do cliente e torna o site público indisponível: funciona como uma pausa.
- Atribuir novamente um plano restaura o acesso correspondente. Estados de suspensão/arquivamento continuam sendo proteções separadas.
- O superadministrador mantém acesso de gestão; isso não libera módulos PRO para o cliente Essencial.
- Um casamento legado sem o campo `plan` é tratado como PRO por compatibilidade. `plan: null` significa explicitamente Sem plano e bloqueia acesso.

### Redução de PRO para Essencial

Os dados de organização são preservados, mas os recursos exclusivos deixam de estar disponíveis. Não há exclusão automática de convidados excedentes: se o casamento já tiver mais de 50 pessoas, novas inclusões e edições sujeitas à capacidade precisam respeitar o limite, ou o casamento deve voltar ao PRO. Trocar o plano manualmente não cancela, reembolsa ou cria cobranças no Stripe.

## Situação da oferta comercial

Situação da oferta anunciada e das proteções implementadas:

| Oferta anunciada | Situação observada no código |
| --- | --- |
| Essencial: 2 templates base; PRO: 4 templates, incluindo Minimalista e Brisa | Hoje, Botânico clássico e Romance contemporâneo são os dois templates implementados. Minimalista moderno e Brisa estão marcados como em breve, desabilitados no seletor e fora dos IDs aceitos pelo editor. O catálogo declara esses futuros templates como PRO, mas ainda será necessário aplicar a exclusividade por plano quando forem disponibilizados. |
| Essencial até a data do evento; PRO até o evento + 3 meses | Implementado: Essencial até o fim do dia do evento; PRO até o fim do dia três meses depois, no horário de São Paulo. Login continua funcionando e redireciona para a página de acesso expirado. Gestão, alterações e site público ficam bloqueados; dados preservados. Sem data válida cadastrada, não há expiração calculada. |
| Essencial: até 50 convites em PDF | Texto corrigido na página inicial para até 50 convidados. Não há cota independente de arquivos gerados, downloads ou reemissões de PDF. |
| PRO: suporte prioritário via WhatsApp | Atalho implementado no painel e nos menus desktop/mobile para clientes PRO: WhatsApp +55 12 98184-7553. O atendimento em si é operacional. |

## Fontes e manutenção

Consultar e atualizar este documento quando as regras mudarem:

- `src/config/pricing.ts`: preços, crédito do upgrade e descrições comerciais.
- `src/config/forever.ts`: nomes dos planos, capacidade e tratamento de Sem plano.
- `src/config/modules.ts`: módulos compartilhados/exclusivos, dependências e remoção de campos da resposta.
- `src/components/forever/ForeverLandingPage.tsx`: comparação comercial de planos.
- `src/config/templates/registry.ts`: catálogo e plano declarado dos templates.
- `src/app/api/admin/invites/route.ts`: verificação de capacidade na criação e edição.
- `src/lib/guest-server.ts`: autenticação, acesso e validação de módulos.
- `src/app/api/platform/weddings/route.ts`: alteração manual de planos.
- `src/app/api/checkout/route.ts`: checkout e validação do preço de upgrade.
- `src/app/api/webhooks/stripe/route.ts` e `src/lib/stripe-fulfillment.ts`: confirmação oficial e ativação idempotente.
- `tests/guests.mjs`: verificações de limites, permissões, alterações manuais e pagamentos.

Regra de consulta rápida: **os dois planos têm site, convites, RSVP, restrições e recados; o PRO acrescenta capacidade ilimitada e ferramentas de organização/recepção.**
