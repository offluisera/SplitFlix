<?php
/**
 * Splitflix — Conexão PDO com MySQL (XAMPP)
 */

class Database
{
    private static $instance = null;

    private static $config = [
        'host'   => 'localhost',
        'port'   => '3306',
        'dbname' => 'splitflix',
        'user'   => 'root',
        'pass'   => '',          // XAMPP padrão: sem senha
        'charset'=> 'utf8mb4',
    ];

    private function __construct() {}
    private function __clone() {}

    public static function getInstance()
    {
        if (self::$instance === null) {
            $cfg = self::$config;
            $dsn = "mysql:host={$cfg['host']};port={$cfg['port']};dbname={$cfg['dbname']};charset={$cfg['charset']}";

            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
            ];

            try {
                self::$instance = new PDO($dsn, $cfg['user'], $cfg['pass'], $options);
            } catch (PDOException $e) {
                header('Content-Type: application/json');
                http_response_code(503);
                echo json_encode([
                    'success' => false,
                    'message' => APP_DEBUG
                        ? 'Erro de conexão: ' . $e->getMessage()
                        : 'Serviço temporariamente indisponível.'
                ]);
                exit;
            }
        }
        return self::$instance;
    }

    public static function pdo()
    {
        return self::getInstance();
    }
}
