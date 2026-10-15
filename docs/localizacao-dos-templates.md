# Endereço e mapa dos templates

Botânico clássico e Romance contemporâneo compartilham o mapa Leaflet na seção da celebração. A foto do espaço é preservada. O mapa público só aparece quando existem coordenadas salvas; endereços anteriores continuam funcionando sem migração.

## Edição

1. Informe oito dígitos do CEP. O ViaCEP preenche endereço e cidade/UF após 500 ms. Número e complemento devem ser acrescentados ao endereço completo.
2. Clique em **Localizar endereço no mapa**. O Photon oferece até cinco resultados brasileiros; selecione o correto.
3. Confira a entrada do espaço. Clique no mapa ou arraste o marcador para ajustar. Também é possível marcar diretamente sem busca.
4. Salve o rascunho ou publique. O mapa segue o mesmo fluxo de salvamento do restante do site.

Alterar endereço, cidade ou CEP remove o marcador anterior. Consultas antigas não substituem edições recentes nem um ponto ajustado manualmente. A busca por CEP pode falhar ou retornar endereço sem logradouro; todos os campos continuam editáveis. A localização encontrada pode ser aproximada e deve ser conferida pelo casal.

Selecionar um ponto gera links de rota para Google Maps e Waze, que continuam editáveis nos campos existentes. Remover o mapa mantém esses links de rota.

## Serviços e configuração

- ViaCEP: consulta no navegador, somente com CEP válido, cancelável e sem consultas em lote. https://viacep.com.br/
- Photon: consulta pelo servidor em `/api/admin/geocode`, exige administrador com plano ativo e acesso ao editor. Payload validado, timeout de 10 segundos, cache de consulta por 24 horas e intervalo mínimo de dois segundos por usuário em cada instância do servidor.
- `PHOTON_URL`: endpoint opcional de uma instância Photon; padrão `https://photon.komoot.io/api/`. O endpoint público é apropriado para uso moderado e não oferece garantia de disponibilidade. https://github.com/komoot/photon
- `NEXT_PUBLIC_MAP_TILES_URL`: URL opcional dos tiles; padrão `https://tile.openstreetmap.org/{z}/{x}/{y}.png`. A atribuição OpenStreetMap permanece visível. Se trocar de provedor, confira e adapte também a atribuição exigida por ele.
- O mapa não usa cache offline, pré-download de tiles nem geocodificação pública do Nominatim. Respeite a política dos tiles: https://operations.osmfoundation.org/policies/tiles/

Nenhuma chave de API é necessária para os serviços públicos padrão. Para tráfego maior, configure infraestrutura com capacidade e disponibilidade adequadas.
