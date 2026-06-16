<?php
/**
 * Splitflix — AuthController
 */



require_once BASE_PATH . '/models/UsuarioModel.php';
use Helpers\Response;
use Helpers\JWT;
use Helpers\Sanitizer;
use Middleware\AuthMiddleware;
use Middleware\RateLimitMiddleware;

class AuthController
{
    // ── POST /auth/register ───────────────────────────────────────
    public static function register(
    {
        $body = Sanitizer::jsonBody();

        $nome  = Sanitizer::string($body['nome'] ?? '', 120);
        $email = Sanitizer::email($body['email'] ?? '');
        $senha = $body['senha'] ?? '';

        $errors = [];
        if (strlen($nome) < 2)    $errors['nome']  = 'Nome deve ter pelo menos 2 caracteres.';
        if (!$email)               $errors['email'] = 'E-mail inválido.';
        if (strlen($senha) < 8)   $errors['senha'] = 'Senha deve ter pelo menos 8 caracteres.';
        if (!preg_match('/[A-Z]/', $senha)) $errors['senha'] = 'Senha deve ter ao menos uma letra maiúscula.';
        if (!preg_match('/[0-9]/', $senha)) $errors['senha'] = 'Senha deve ter ao menos um número.';

        if ($errors) Response::validationError($errors);

        $model = new UsuarioModel();
        if ($model->findByEmail($email)) {
            Response::error('Este e-mail já está cadastrado.', 409);
        }

        $ip = RateLimitMiddleware::getClientIp();
        $id = $model->create([
            'nome'  => $nome,
            'email' => $email,
            'senha' => $senha,
            'ip'    => $ip,
        ]);

        $user = $model->findById($id);
        [$access, $refresh] = self::issueTokens($model, $user);

        Response::success([
            'access_token'  => $access,
            'refresh_token' => $refresh,
            'user'          => $model->publicProfile($user),
        ], 'Cadastro realizado com sucesso!', 201);
    }

    // ── POST /auth/login ──────────────────────────────────────────
    public static function login(
    {
        $body  = Sanitizer::jsonBody();
        $email = Sanitizer::email($body['email'] ?? '');
        $senha = $body['senha'] ?? '';
        $ip    = RateLimitMiddleware::getClientIp();

        if (!$email || !$senha) Response::validationError(['credenciais' => 'E-mail e senha são obrigatórios.']);

        // Rate limiting por e-mail + IP
        RateLimitMiddleware::checkLoginAttempts($email, $ip);

        $model = new UsuarioModel();
        $user  = $model->findByEmail($email);

        if (!$user || !password_verify($senha, $user['senha_hash'])) {
            RateLimitMiddleware::incrementLoginAttempts($email, $ip);
            Response::error('Credenciais inválidas.', 401);
        }

        if ($user['status'] !== 'ativo') {
            Response::error('Conta inativa ou banida. Entre em contato com o suporte.', 403);
        }

        RateLimitMiddleware::clearLoginAttempts($email, $ip);

        // Re-hash se necessário (ex: cost upgrade)
        if (password_needs_rehash($user['senha_hash'], PASSWORD_BCRYPT, ['cost' => 12])) {
            $newHash = password_hash($senha, PASSWORD_BCRYPT, ['cost' => 12]);
            Database::pdo()->prepare("UPDATE usuarios SET senha_hash=? WHERE id=?")->execute([$newHash, $user['id']]);
        }

        [$access, $refresh] = self::issueTokens($model, $user);

        Response::success([
            'access_token'  => $access,
            'refresh_token' => $refresh,
            'user'          => $model->publicProfile($user),
        ], 'Login realizado com sucesso!');
    }

    // ── POST /auth/logout ─────────────────────────────────────────
    public static function logout(
    {
        $user = AuthMiddleware::attempt();
        if ($user) {
            $model = new UsuarioModel();
            $model->updateRefreshToken((int)$user['sub'], null, null);
        }
        Response::success(null, 'Logout realizado.');
    }

    // ── POST /auth/refresh ────────────────────────────────────────
    public static function refresh(
    {
        $body  = Sanitizer::jsonBody();
        $token = $body['refresh_token'] ?? '';

        if (!$token) Response::unauthorized('Refresh token ausente.');

        $hashed = JWT::hashRefreshToken($token);
        $model  = new UsuarioModel();
        $user   = $model->findByRefreshToken($hashed);

        if (!$user) Response::unauthorized('Refresh token inválido ou expirado.');

        [$access, $refresh] = self::issueTokens($model, $user);

        Response::success([
            'access_token'  => $access,
            'refresh_token' => $refresh,
        ]);
    }

    // ── GET /auth/me ──────────────────────────────────────────────
    public static function me(
    {
        $payload = AuthMiddleware::require();
        $model   = new UsuarioModel();
        $user    = $model->findById((int)$payload['sub']);
        if (!$user) Response::notFound('Usuário não encontrado.');
        Response::success($model->publicProfile($user));
    }

    // ── Helper: gera e salva tokens ───────────────────────────────
    private static function issueTokens(UsuarioModel $model, array $user): array
    {
        $access = JWT::generate([
            'sub'   => $user['id'],
            'nome'  => $user['nome'],
            'email' => $user['email'],
            'papel' => $user['papel'],
        ]);

        $refresh       = JWT::generateRefreshToken();
        $refreshHashed = JWT::hashRefreshToken($refresh);
        $expiry        = date('Y-m-d H:i:s', strtotime('+' . JWT_REFRESH_DAYS . ' days'));

        $model->updateRefreshToken((int)$user['id'], $refreshHashed, $expiry);

        return [$access, $refresh];
    }
}
