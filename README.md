# Rota

App para conectar alunos a instrutores autônomos de direção e acompanhar o caminho até a CNH. Feito com Expo SDK 57, React Native, TypeScript e Expo Router, com base na estrutura do repositório de referência.

## Executar

```bash
npm install
npm run web
```

Para usar o Expo Go, execute `npm start` e leia o QR code. Também estão disponíveis `npm run android` e `npm run ios`.

## Acesso demonstrativo

Na abertura, toque em **Começar agora** para chegar ao login. A partir dele, é possível entrar ou criar uma conta de aluno ou profissional. O cadastro de aluno é direto; o profissional tem etapas para dados pessoais, CNH, experiência e veículo.

Para experimentar os painéis sem preencher cadastro, escolha Aluno, Instrutor ou Admin no login. O protótipo aceita qualquer e-mail e senha não vazios.

## Áreas

- Aluno: progresso da habilitação, busca e filtros de instrutores, pedidos de aula, agenda e perfil.
- Instrutor: agenda diária, disponibilidade, alunos, veículo cadastrado e perfil profissional.
- Administração: indicadores, revisão de instrutores e veículos, usuários e operação de aulas.
- Aula: aluno e instrutor confirmam presença antes de iniciar; a tela mede a duração e mostra um relatório demonstrativo ao finalizar.

## Limites do protótipo

Não há autenticação real, API, banco de dados, pagamentos, notificações ou GPS conectado. Distância, percurso e velocidades do relatório são ilustrativos; a integração IoT/GPS e as confirmações em sessões separadas serão necessárias antes do uso em produção. As ações demonstrativas reiniciam ao recarregar o app.

