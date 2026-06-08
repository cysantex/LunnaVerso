# Especificação de Segurança — LunnaVerso

Esta especificação define os limites de segurança da base de dados do Portal LunnaVerso, garantindo que o portal seja extremamente robusto, seguro contra injeções de dados e de fácil manutenção para o autor.

## 1. Invariantes do Banco de Dados
- **Configurações Globais**: O documento deve conter exatamente 5 campos de texto obrigatórios, impedindo qualquer injeção de campos nulos ou extras não autorizados.
- **Estrutura dos Capítulos**: Cada capítulo precisa conter o número de índice (`number`), a URL da ilustração (`imageUrl`), e todos os campos poéticos sem risco de conteúdo malicioso que rompa o limite de visualização.
- **Deleção**: Configurações de sistema jamais podem ser excluídas por usuários ou visitantes normais.

## 2. Casos de Teste "Dirty Dozen" (Payloads Inválidos)
1. **Injeção de Campos Fantasmas no PortalSettings**: Tentar salvar uma configuração de portal com um campo extra (ex: `"isAdmin": true`).
2. **Estouro de Limite de Caracteres no Título**: Enviar um título de livro com mais de 150 caracteres.
3. **Mensagem de Boas-vindas Gigante**: Enviar uma mensagem excedendo o limite de 2000 caracteres.
4. **ID de Documento Malformado**: Mandar um ID utilizando caracteres não permitidos como `%`, `$` ou `/`.
5. **Tipo Incorreto para o Número de Capítulo**: Enviar `"number": "um"` como string em vez de inteiro.
6. **Capítulo sem URL de Imagem**: Enviar um capítulo onde a URL é nula ou vazia.
7. **Estouro de Tamanho da URL da Imagem**: Tentar injetar uma string de 10KB no campo `imageUrl`.
8. **Dedicatória Gigante**: Enviar uma frase no rodapé com mais de 500 caracteres.
9. **Exclusão Indevida da Configuração**: Tentar executar a operação de deleção (`delete`) no documento `global` da coleção `/portalSettings`.
10. **Formato Errado de ID do Capítulo**: Tentar criar um capítulo cujo ID viola a regex de segurança `^[a-zA-Z0-9_\-]+$`.
11. **Falta de Campos Obrigatórios em Capítulo**: Criar um capítulo omitindo a citação romântica (`romanticQuote`).
12. **Sobrecarga de Chaves (Keys Shadowing)**: Enviar 10 chaves estranhas sem valor definido para forçar sobrecarga e custos de escrita no banco.
