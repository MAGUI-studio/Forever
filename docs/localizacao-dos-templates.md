# Endereço e mapa dos templates

Botânico clássico e Romance contemporâneo compartilham o mapa Leaflet na seção da celebração. A foto do espaço é preservada. O mapa público só aparece quando existem coordenadas salvas; endereços anteriores continuam funcionando sem migração.

## Edição

1. Informe oito dígitos do CEP. O ViaCEP preenche logradouro, bairro, cidade e UF após 500 ms. Número e complemento têm campos separados e todos os dados continuam editáveis.
2. Informe o número. Após 1,2 segundo sem alterações, o Photon busca o endereço e posiciona o primeiro resultado compatível com rua e cidade. O botão **Buscar novamente no mapa** permite repetir a consulta. Complemento e bairro não entram na busca do número.
3. Confira a entrada do espaço. Clique no mapa ou arraste o marcador para ajustar. Também é possível marcar diretamente sem busca.
4. Salve o rascunho ou publique. O mapa segue o mesmo fluxo de salvamento do restante do site.

Alterar endereço, cidade ou CEP remove o marcador anterior. Consultas antigas não substituem edições recentes nem um ponto ajustado manualmente. A busca por CEP pode falhar ou retornar endereço sem logradouro; todos os campos continuam editáveis. A localização encontrada pode ser aproximada e deve ser conferida pelo casal.

Os dois templates abrem a localização no OpenStreetMap, usando o marcador selecionado. Sem coordenadas, a busca usa o endereço completo. Links de Google Maps e Waze não são mais solicitados no formulário nem usados nos botões públicos.

Configurações concentra os dados gerais. Um único seletor Forever controla data e horário de Brasília; o horário exibido é derivado dessa data. Cidade e UF vêm do endereço do local. Nome e Instagram do local aparecem lado a lado, acima do endereço.

Em Configurações, **Cerimônia e festa** permite escolher **No mesmo local** ou **Em locais diferentes**. A segunda opção abre Local da cerimônia e Local da festa, com nome, Instagram, endereço e marcador independentes. O horário da cerimônia continua derivado da data do casamento; a festa tem horário opcional próprio (sem preenchimento, o site exibe “Após a cerimônia”). As fotos dos dois espaços ficam em Cerimônia e festa.

Os dois templates exibem um ou dois blocos conforme a escolha, mantendo foto com mapa ao passar o mouse e rota própria para cada endereço. `sameVenue` ausente equivale a mesmo local para preservar os sites existentes; alternar a opção não apaga os dados de `party`.

## Serviços e configuração

- ViaCEP: consulta no navegador, somente com CEP válido, cancelável e sem consultas em lote. https://viacep.com.br/
- Photon: consulta pelo servidor em `/api/admin/geocode`, exige administrador com plano ativo e acesso ao editor. Payload validado, timeout de 25 segundos, cache de consulta por 24 horas e intervalo mínimo de dois segundos por usuário em cada instância do servidor. O limite anterior de 10 segundos interrompia consultas que, no teste real, responderam em 11–18 segundos. Resultados de outras ruas e cidades são descartados quando há endereço estruturado.
- `PHOTON_URL`: endpoint opcional de uma instância Photon; padrão `https://photon.komoot.io/api/`. O endpoint público é apropriado para uso moderado e não oferece garantia de disponibilidade. https://github.com/komoot/photon
- `NEXT_PUBLIC_MAP_TILES_URL`: URL opcional dos tiles; padrão `https://tile.openstreetmap.org/{z}/{x}/{y}.png`. A atribuição OpenStreetMap permanece visível. Se trocar de provedor, confira e adapte também a atribuição exigida por ele.
- O mapa não usa cache offline, pré-download de tiles nem geocodificação pública do Nominatim. Respeite a política dos tiles: https://operations.osmfoundation.org/policies/tiles/

Nenhuma chave de API é necessária para os serviços públicos padrão. Para tráfego maior, configure infraestrutura com capacidade e disponibilidade adequadas.
