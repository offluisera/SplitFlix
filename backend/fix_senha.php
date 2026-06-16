<?php
// Carrega sua conexão com o banco
require_once __DIR__ . '/config/database.php';

$senhaReal = 'Admin@2026!';
$emailAdmin = 'admin@splitflix.local';

// Gera o hash Bcrypt
$hash = password_hash($senhaReal, PASSWORD_BCRYPT);

try {
    $pdo = Database::getInstance();
    
    // Atualiza a senha no banco de dados
    $stmt = $pdo->prepare("UPDATE users SET password = :hash WHERE email = :email");
    $stmt->execute([
        'hash' => $hash,
        'email' => $emailAdmin
    ]);

    echo "<h3>✅ Senha atualizada com sucesso!</h3>";
    echo "<p><strong>Nova Senha:</strong> " . $senhaReal . "</p>";
    echo "<p><strong>Hash Gerado e Inserido no BD:</strong> " . $hash . "</p>";
    
} catch (Exception $e) {
    echo "Erro ao atualizar: " . $e->getMessage();
}