# Conteúdo dos templates disponíveis

Revisão de Botânico Clássico, Romance Contemporâneo e Minimalista Moderno.

| Informação exibida | Origem no editor |
| --- | --- |
| Nomes, data, horário, cidade e hashtag | Configurações do casal e dos locais |
| Foto de capa e frase do casal | Capa |
| Título, ano, capítulos e parágrafos da história | Nossa história |
| Fotos da história e detalhe | Nossa história, conforme o template |
| Fotografias, legendas e modelo da galeria | Galeria |
| Locais, endereços, mapas, horários e orientações | Configurações e Cerimônia e festa |
| Mensagens para locais únicos e separados | Textos de Cerimônia e festa |
| Tipo de traje, orientações, cores e imagem de fundo | Trajes, conforme o estilo escolhido |
| Cores e nomes dos desenhos de traje | Trajes, estilo Traços elegantes |
| Presentes, valores, descrições e link de pagamento | Lista de presentes |
| Títulos e descrições dos momentos do Romance | Programação do dia |
| Mensagens de confirmação e despedida | Confirmação de presença e Rodapé |
| Convidados, respostas e prazo de confirmação | Convites e configurações de RSVP |

As frases de conteúdo usam os campos registrados do editor (`config.copy`), com valores iniciais editáveis. Dados do casamento usam `WeddingConfig`. Datas formatadas, contagens regressivas e mapas são derivados desses dados.

Os botões, unidades de tempo, mensagens técnicas, ícones, cores do tema e demais elementos da interface permanecem definidos pelo produto. Não representam informações inventadas sobre o casamento.

As imagens padrão geradas e solicitadas são recursos de apresentação substituíveis no formulário. Fotos personalizadas têm prioridade; remoções explícitas são preservadas.

## Correções realizadas

- Removidas informações fixas sobre cerimônia e festa em locais separados.
- Expostos os títulos das orientações e da paleta de trajes.
- Expostas as cores dos desenhos de traje, preservando o estilo original do Botânico.
- Expostos os títulos de RSVP e mensagens ao chegar a data do casamento.
- Orientações de chegada exibidas também no Botânico e no Romance.
- Campos vazios preservados ao salvar e ao trocar templates.
- Fotos removidas não produzem imagens com endereço vazio; a festa não herda a foto da cerimônia.
- Removido o campo de foto de rodapé do Romance, que já usa o ícone decorativo.
- Removida a geração automática de histórias, endereços, presentes, fotos de galeria, dados de pagamento e outras informações de exemplo no cadastro e no editor.

Dados que já tinham sido salvos anteriormente não são apagados automaticamente.

## Verificação

- `node tests/template-content.mjs`: personalização e salvamento dos campos nos três templates e nos dois estilos de traje; preservação de textos vazios.
- `node tests/guests.mjs`: 66 verificações gerais, incluindo cadastro e carregamento sem dados inventados.
- Testes de galerias, imagens, estilos de traje e navegação do RSVP.
- TypeScript sem erros.
