<?php
// Mostra todos os erros para debug
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/config/database.php';

try {
    $pdo = Database::getInstance();
    
    // 1. Limpar os bloqueios de IP para permitir o login
    $pdo->query("TRUNCATE TABLE login_tentativas");
    echo "✅ Tabela de rate limit limpa!<br>";

    // 2. Gerar o hash usando o próprio PHP do seu servidor
    $senha = 'Admin@2026!';
    $hash = password_hash($senha, PASSWORD_BCRYPT);
    
    // 3. Atualizar o usuário Admin
    $stmt = $pdo->prepare("UPDATE usuarios SET senha_hash = :hash WHERE email = 'admin@splitflix.local'");
    $stmt->execute(['hash' => $hash]);
    
    // 4. Testar a verificação imediatamente
    $userQuery = $pdo->query("SELECT senha_hash FROM usuarios WHERE email = 'admin@splitflix.local'");
    $user = $userQuery->fetch(PDO::FETCH_ASSOC);
    
    if (password_verify($senha, $user['senha_hash'])) {
        echo "✅ Hash atualizado e verificado com sucesso pelo PHP! Você já pode fazer login.";
    } else {
        echo "❌ Erro crítico: O PHP gerou o hash, mas não conseguiu validá-lo.";
    }

} catch (PDOException $e) {
    echo "❌ Erro no Banco de Dados: " . $e->getMessage();
} catch (Exception $e) {
    echo "❌ Erro Geral: " . $e->getMessage();
}