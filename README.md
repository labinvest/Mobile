# Rota · App

App para conectar alunos a instrutores autônomos de direção e acompanhar o caminho até a CNH. Feito com Expo SDK 57, React Native, TypeScript e Expo Router. Os dados vêm da API do Rota, na pasta `Backend`.

## Executar

A API precisa estar rodando antes de abrir o app. Veja o `README.md` da pasta `Backend`.

```bash
npm install
npm run web      # no navegador
npm start        # QR code para o Expo Go
```

Também estão disponíveis `npm run android` e `npm run ios`.

Sem configuração, o app procura a API na porta 3333 da máquina que roda o Expo, o que funciona na web, no emulador e no celular na mesma rede Wi-Fi. Para usar uma API publicada, copie `.env.example` para `.env` e defina `EXPO_PUBLIC_API_URL`.

## Contas

O login usa contas reais da API. Depois de rodar o seed do backend, as contas de demonstração estão listadas no `README.md` da pasta `Backend`. Também é possível criar uma conta de aluno ou de instrutor pelo app. A conta de instrutor fica em análise até um admin aprovar os dados e o veículo.

## Áreas

- **Aluno:** progresso da habilitação, busca de instrutores, pedidos de aula, agenda e perfil.
- **Instrutor:** agenda, pedidos, disponibilidade, valor, horários da semana e alunos.
- **Administração:** indicadores, análise de instrutores e veículos, e aulas da plataforma.
- **Aula:** o instrutor aceita o pedido, os dois confirmam presença e a aula é iniciada no dia marcado. O app mede a duração e, ao final, cada um avalia o outro.
- **Cancelamento:** o aluno pode cancelar um pedido, e os dois podem cancelar uma aula agendada antes de ela começar. Pedidos e aulas cuja data passou sem a aula começar são encerrados automaticamente.

## Limites atuais

Os pagamentos são combinados diretamente com o instrutor, fora do app. Ainda não há notificações push (os avisos aparecem dentro do app) nem envio de fotos da CNH. O mapa do trajeto já funciona, mas depende do dispositivo GPS do veículo, que ainda não foi construído (o formato de envio está no `README.md` da pasta `Backend`). O mapa usa os servidores públicos do OpenStreetMap, adequados para testes e apresentações. Com uso real, será preciso um provedor de mapas próprio.

## Desenvolvimento

```bash
npx tsc --noEmit   # verificação de tipos
npm run lint       # lint
```

As telas ficam em `src/app` (Expo Router), os componentes em `src/components` e o acesso à API em `src/lib/api.ts` e `src/hooks/use-drive-app.tsx`.
