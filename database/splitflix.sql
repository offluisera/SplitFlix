-- ============================================================
--  SPLITFLIX — Script SQL Completo
--  Banco: MySQL 8.0+  |  Charset: utf8mb4  |  Engine: InnoDB
--  Gerado para: XAMPP local / PHP 8.2+
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "-03:00";
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ----------------------------------------------------------------
-- Cria e seleciona o banco
-- ----------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS `splitflix`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `splitflix`;

-- ================================================================
-- 1. USUÁRIOS
--    Armazena todos os dados de autenticação e perfil.
--    Senhas com password_hash(PASSWORD_BCRYPT).
--    refresh_token para renovação segura de JWT sem re-login.
-- ================================================================
CREATE TABLE `usuarios` (
  `id`               INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `nome`             VARCHAR(120)    NOT NULL,
  `email`            VARCHAR(255)    NOT NULL,
  `senha_hash`       VARCHAR(255)    NOT NULL                           COMMENT 'bcrypt hash',
  `avatar`           VARCHAR(500)        NULL DEFAULT NULL,
  `papel`            ENUM('admin','moderador','usuario')
                                     NOT NULL DEFAULT 'usuario',
  `status`           ENUM('ativo','inativo','banido')
                                     NOT NULL DEFAULT 'ativo',
  `email_verificado` TINYINT(1)      NOT NULL DEFAULT 0,
  `token_verificacao` VARCHAR(128)       NULL DEFAULT NULL              COMMENT 'UUID para confirmar e-mail',
  `refresh_token`    VARCHAR(255)        NULL DEFAULT NULL              COMMENT 'Hashed refresh token JWT',
  `refresh_token_expira_em` DATETIME     NULL DEFAULT NULL,
  `ultimo_login`     DATETIME             NULL DEFAULT NULL,
  `ip_cadastro`      VARCHAR(45)          NULL DEFAULT NULL             COMMENT 'IPv4 ou IPv6',
  `criado_em`        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                             ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_email` (`email`),
  INDEX `idx_papel`  (`papel`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ================================================================
-- 2. TENTATIVAS DE LOGIN (rate-limiting / brute-force)
--    Registra cada tentativa; bloqueia após N falhas por IP/email.
-- ================================================================
CREATE TABLE `login_tentativas` (
  `id`         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `email`      VARCHAR(255)  NOT NULL,
  `ip`         VARCHAR(45)   NOT NULL,
  `sucesso`    TINYINT(1)    NOT NULL DEFAULT 0,
  `criado_em`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_email_ip` (`email`, `ip`),
  INDEX `idx_criado_em` (`criado_em`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ================================================================
-- 3. TOKENS CSRF
--    Um token por sessão/requisição; invalidado após uso.
-- ================================================================
CREATE TABLE `csrf_tokens` (
  `id`         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `token`      VARCHAR(128)  NOT NULL,
  `usuario_id` INT UNSIGNED      NULL DEFAULT NULL,
  `ip`         VARCHAR(45)   NOT NULL,
  `usado`      TINYINT(1)    NOT NULL DEFAULT 0,
  `expira_em`  DATETIME      NOT NULL,
  `criado_em`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_token` (`token`),
  INDEX `idx_expira` (`expira_em`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ================================================================
-- 4. GÊNEROS
--    Tabela normalizada de gêneros (Ação, Drama, etc.)
-- ================================================================
CREATE TABLE `generos` (
  `id`        SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nome`      VARCHAR(80)       NOT NULL,
  `slug`      VARCHAR(80)       NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `generos` (`nome`, `slug`) VALUES
  ('Ação',         'acao'),
  ('Aventura',     'aventura'),
  ('Animação',     'animacao'),
  ('Comédia',      'comedia'),
  ('Crime',        'crime'),
  ('Documentário', 'documentario'),
  ('Drama',        'drama'),
  ('Fantasia',     'fantasia'),
  ('Ficção Científica', 'ficcao-cientifica'),
  ('Horror',       'horror'),
  ('Mistério',     'misterio'),
  ('Romance',      'romance'),
  ('Suspense',     'suspense'),
  ('Terror',       'terror'),
  ('Thriller',     'thriller');


-- ================================================================
-- 5. FILMES
--    Dados principais enriquecidos via IMDb (scraping/API).
--    Campos de embed/player reservados para link Dailymotion.
-- ================================================================
CREATE TABLE `filmes` (
  `id`               INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `imdb_id`          VARCHAR(20)         NULL DEFAULT NULL              COMMENT 'ex: tt0111161',
  `titulo`           VARCHAR(255)    NOT NULL,
  `titulo_original`  VARCHAR(255)        NULL DEFAULT NULL,
  `slug`             VARCHAR(280)    NOT NULL                           COMMENT 'URL amigável única',
  `sinopse`          TEXT                NULL DEFAULT NULL              COMMENT 'Traduzida para PT-BR',
  `sinopse_original` TEXT                NULL DEFAULT NULL,
  `ano`              SMALLINT UNSIGNED   NULL DEFAULT NULL,
  `duracao_min`      SMALLINT UNSIGNED   NULL DEFAULT NULL              COMMENT 'Minutos',
  `classificacao`    VARCHAR(10)         NULL DEFAULT NULL              COMMENT 'Ex: 14, 16, 18, Livre',
  `nota_imdb`        DECIMAL(3,1)        NULL DEFAULT NULL              COMMENT '0.0 – 10.0',
  `nota_usuarios`    DECIMAL(4,2)        NULL DEFAULT NULL              COMMENT 'Média calculada das avaliações',
  `total_avaliacoes` INT UNSIGNED    NOT NULL DEFAULT 0,
  `diretor`          VARCHAR(200)        NULL DEFAULT NULL,
  `elenco`           JSON                NULL DEFAULT NULL              COMMENT '[{"nome":"...", "personagem":"..."}]',
  `poster_url`       VARCHAR(500)        NULL DEFAULT NULL              COMMENT 'Caminho local ou URL externa',
  `backdrop_url`     VARCHAR(500)        NULL DEFAULT NULL,
  `trailer_youtube`  VARCHAR(50)         NULL DEFAULT NULL              COMMENT 'YouTube video ID',
  `embed_dailymotion` VARCHAR(500)       NULL DEFAULT NULL              COMMENT 'Link embed do player',
  `tipo`             ENUM('filme')   NOT NULL DEFAULT 'filme',
  `destaque`         TINYINT(1)      NOT NULL DEFAULT 0                 COMMENT 'Aparece no hero banner',
  `em_alta`          TINYINT(1)      NOT NULL DEFAULT 0,
  `status`           ENUM('publicado','rascunho','arquivado')
                                     NOT NULL DEFAULT 'rascunho',
  `visualizacoes`    BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `criado_por`       INT UNSIGNED        NULL DEFAULT NULL,
  `criado_em`        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                             ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_slug` (`slug`),
  UNIQUE KEY `uq_imdb` (`imdb_id`),
  INDEX `idx_status_destaque` (`status`, `destaque`),
  INDEX `idx_ano`             (`ano`),
  INDEX `idx_nota`            (`nota_imdb`),
  FULLTEXT KEY `ft_busca`     (`titulo`, `sinopse`),
  CONSTRAINT `fk_filme_criado_por`
    FOREIGN KEY (`criado_por`) REFERENCES `usuarios` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ================================================================
-- 6. FILMES ↔ GÊNEROS  (N:N)
-- ================================================================
CREATE TABLE `filme_generos` (
  `filme_id`  INT UNSIGNED     NOT NULL,
  `genero_id` SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (`filme_id`, `genero_id`),
  CONSTRAINT `fk_fg_filme`  FOREIGN KEY (`filme_id`)  REFERENCES `filmes`  (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_fg_genero` FOREIGN KEY (`genero_id`) REFERENCES `generos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ================================================================
-- 7. SÉRIES
--    Mesma estrutura base de filmes, sem embed direto (usa episódios).
-- ================================================================
CREATE TABLE `series` (
  `id`               INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `imdb_id`          VARCHAR(20)         NULL DEFAULT NULL,
  `titulo`           VARCHAR(255)    NOT NULL,
  `titulo_original`  VARCHAR(255)        NULL DEFAULT NULL,
  `slug`             VARCHAR(280)    NOT NULL,
  `sinopse`          TEXT                NULL DEFAULT NULL,
  `sinopse_original` TEXT                NULL DEFAULT NULL,
  `ano_inicio`       SMALLINT UNSIGNED   NULL DEFAULT NULL,
  `ano_fim`          SMALLINT UNSIGNED   NULL DEFAULT NULL              COMMENT 'NULL = em exibição',
  `classificacao`    VARCHAR(10)         NULL DEFAULT NULL,
  `nota_imdb`        DECIMAL(3,1)        NULL DEFAULT NULL,
  `nota_usuarios`    DECIMAL(4,2)        NULL DEFAULT NULL,
  `total_avaliacoes` INT UNSIGNED    NOT NULL DEFAULT 0,
  `criadores`        VARCHAR(300)        NULL DEFAULT NULL,
  `elenco`           JSON                NULL DEFAULT NULL,
  `poster_url`       VARCHAR(500)        NULL DEFAULT NULL,
  `backdrop_url`     VARCHAR(500)        NULL DEFAULT NULL,
  `trailer_youtube`  VARCHAR(50)         NULL DEFAULT NULL,
  `tipo`             ENUM('serie')   NOT NULL DEFAULT 'serie',
  `destaque`         TINYINT(1)      NOT NULL DEFAULT 0,
  `em_alta`          TINYINT(1)      NOT NULL DEFAULT 0,
  `status`           ENUM('publicado','rascunho','arquivado')
                                     NOT NULL DEFAULT 'rascunho',
  `visualizacoes`    BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `criado_por`       INT UNSIGNED        NULL DEFAULT NULL,
  `criado_em`        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                             ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_slug`  (`slug`),
  UNIQUE KEY `uq_imdb`  (`imdb_id`),
  INDEX `idx_status`    (`status`),
  INDEX `idx_destaque`  (`destaque`),
  FULLTEXT KEY `ft_busca` (`titulo`, `sinopse`),
  CONSTRAINT `fk_serie_criado_por`
    FOREIGN KEY (`criado_por`) REFERENCES `usuarios` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ================================================================
-- 8. SÉRIES ↔ GÊNEROS  (N:N)
-- ================================================================
CREATE TABLE `serie_generos` (
  `serie_id`  INT UNSIGNED      NOT NULL,
  `genero_id` SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (`serie_id`, `genero_id`),
  CONSTRAINT `fk_sg_serie`  FOREIGN KEY (`serie_id`)  REFERENCES `series`  (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sg_genero` FOREIGN KEY (`genero_id`) REFERENCES `generos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ================================================================
-- 9. ANIMES
--    Igual a séries; separado para filtros/categorias independentes.
-- ================================================================
CREATE TABLE `animes` (
  `id`               INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `imdb_id`          VARCHAR(20)         NULL DEFAULT NULL,
  `titulo`           VARCHAR(255)    NOT NULL,
  `titulo_original`  VARCHAR(255)        NULL DEFAULT NULL              COMMENT 'Japonês/romaji',
  `slug`             VARCHAR(280)    NOT NULL,
  `sinopse`          TEXT                NULL DEFAULT NULL,
  `sinopse_original` TEXT                NULL DEFAULT NULL,
  `ano_inicio`       SMALLINT UNSIGNED   NULL DEFAULT NULL,
  `ano_fim`          SMALLINT UNSIGNED   NULL DEFAULT NULL,
  `classificacao`    VARCHAR(10)         NULL DEFAULT NULL,
  `nota_imdb`        DECIMAL(3,1)        NULL DEFAULT NULL,
  `nota_usuarios`    DECIMAL(4,2)        NULL DEFAULT NULL,
  `total_avaliacoes` INT UNSIGNED    NOT NULL DEFAULT 0,
  `estudio`          VARCHAR(150)        NULL DEFAULT NULL,
  `elenco`           JSON                NULL DEFAULT NULL,
  `poster_url`       VARCHAR(500)        NULL DEFAULT NULL,
  `backdrop_url`     VARCHAR(500)        NULL DEFAULT NULL,
  `trailer_youtube`  VARCHAR(50)         NULL DEFAULT NULL,
  `tipo`             ENUM('anime')   NOT NULL DEFAULT 'anime',
  `destaque`         TINYINT(1)      NOT NULL DEFAULT 0,
  `em_alta`          TINYINT(1)      NOT NULL DEFAULT 0,
  `status`           ENUM('publicado','rascunho','arquivado')
                                     NOT NULL DEFAULT 'rascunho',
  `visualizacoes`    BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `criado_por`       INT UNSIGNED        NULL DEFAULT NULL,
  `criado_em`        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                             ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_slug`    (`slug`),
  UNIQUE KEY `uq_imdb`    (`imdb_id`),
  INDEX `idx_status`      (`status`),
  INDEX `idx_destaque`    (`destaque`),
  FULLTEXT KEY `ft_busca` (`titulo`, `sinopse`),
  CONSTRAINT `fk_anime_criado_por`
    FOREIGN KEY (`criado_por`) REFERENCES `usuarios` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ================================================================
-- 10. ANIMES ↔ GÊNEROS  (N:N)
-- ================================================================
CREATE TABLE `anime_generos` (
  `anime_id`  INT UNSIGNED      NOT NULL,
  `genero_id` SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (`anime_id`, `genero_id`),
  CONSTRAINT `fk_ag_anime`  FOREIGN KEY (`anime_id`)  REFERENCES `animes`  (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ag_genero` FOREIGN KEY (`genero_id`) REFERENCES `generos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ================================================================
-- 11. TEMPORADAS
--    Vinculada a série OU anime via FK polimórfica + tipo.
-- ================================================================
CREATE TABLE `temporadas` (
  `id`              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `conteudo_id`     INT UNSIGNED  NOT NULL                              COMMENT 'ID de series ou animes',
  `conteudo_tipo`   ENUM('serie','anime') NOT NULL,
  `numero`          TINYINT UNSIGNED NOT NULL                           COMMENT '1, 2, 3…',
  `titulo`          VARCHAR(255)      NULL DEFAULT NULL,
  `sinopse`         TEXT              NULL DEFAULT NULL,
  `ano`             SMALLINT UNSIGNED NULL DEFAULT NULL,
  `poster_url`      VARCHAR(500)      NULL DEFAULT NULL,
  `total_episodios` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `criado_em`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                           ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_conteudo_numero` (`conteudo_id`, `conteudo_tipo`, `numero`),
  INDEX `idx_conteudo` (`conteudo_id`, `conteudo_tipo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ================================================================
-- 12. EPISÓDIOS
--    Cada episódio tem um link embed Dailymotion obrigatório.
--    imdb_episode_id permite enriquecer automaticamente via scraping.
-- ================================================================
CREATE TABLE `episodios` (
  `id`                  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `temporada_id`        INT UNSIGNED  NOT NULL,
  `numero`              SMALLINT UNSIGNED NOT NULL                      COMMENT 'Número do episódio na temporada',
  `imdb_episode_id`     VARCHAR(20)       NULL DEFAULT NULL             COMMENT 'ex: tt1234567',
  `titulo`              VARCHAR(255)  NOT NULL,
  `sinopse`             TEXT              NULL DEFAULT NULL             COMMENT 'PT-BR via scraping',
  `duracao_min`         SMALLINT UNSIGNED NULL DEFAULT NULL,
  `thumbnail_url`       VARCHAR(500)      NULL DEFAULT NULL,
  `embed_dailymotion`   VARCHAR(500)  NOT NULL                          COMMENT 'URL ou ID do vídeo no Dailymotion',
  `dailymotion_video_id` VARCHAR(50)      NULL DEFAULT NULL             COMMENT 'ID extraído do embed para API',
  `status`              ENUM('publicado','rascunho') NOT NULL DEFAULT 'rascunho',
  `visualizacoes`       BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `criado_em`           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                               ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_temp_num` (`temporada_id`, `numero`),
  INDEX `idx_status`    (`status`),
  CONSTRAINT `fk_ep_temporada`
    FOREIGN KEY (`temporada_id`) REFERENCES `temporadas` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ================================================================
-- 13. AVALIAÇÕES (RATINGS)
--    1 avaliação por usuário por conteúdo.
--    conteudo_tipo + conteudo_id = FK polimórfica.
-- ================================================================
CREATE TABLE `avaliacoes` (
  `id`             INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  `usuario_id`     INT UNSIGNED   NOT NULL,
  `conteudo_tipo`  ENUM('filme','serie','anime') NOT NULL,
  `conteudo_id`    INT UNSIGNED   NOT NULL,
  `nota`           TINYINT UNSIGNED NOT NULL                            COMMENT '1 a 10',
  `criado_em`      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em`  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                           ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_conteudo` (`usuario_id`, `conteudo_tipo`, `conteudo_id`),
  INDEX `idx_conteudo` (`conteudo_tipo`, `conteudo_id`),
  CONSTRAINT `fk_av_usuario`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `chk_nota` CHECK (`nota` BETWEEN 1 AND 10)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ================================================================
-- 14. COMENTÁRIOS
--    Suportam aninhamento simples (parent_id).
--    Moderação: status 'pendente' por padrão para novos usuários.
-- ================================================================
CREATE TABLE `comentarios` (
  `id`             INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  `usuario_id`     INT UNSIGNED   NOT NULL,
  `conteudo_tipo`  ENUM('filme','serie','anime','episodio') NOT NULL,
  `conteudo_id`    INT UNSIGNED   NOT NULL,
  `parent_id`      INT UNSIGNED       NULL DEFAULT NULL                 COMMENT 'Resposta a outro comentário',
  `texto`          TEXT           NOT NULL,
  `status`         ENUM('pendente','aprovado','spam','excluido')
                                  NOT NULL DEFAULT 'pendente',
  `ip`             VARCHAR(45)        NULL DEFAULT NULL,
  `user_agent`     VARCHAR(500)       NULL DEFAULT NULL,
  `criado_em`      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em`  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                           ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_conteudo` (`conteudo_tipo`, `conteudo_id`),
  INDEX `idx_status`   (`status`),
  INDEX `idx_usuario`  (`usuario_id`),
  CONSTRAINT `fk_com_usuario`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_com_parent`
    FOREIGN KEY (`parent_id`) REFERENCES `comentarios` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ================================================================
-- 15. PROGRESSO DE VISUALIZAÇÃO
--    Salva posição atual (segundos) por usuário/episódio ou filme.
-- ================================================================
CREATE TABLE `progresso` (
  `id`             INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  `usuario_id`     INT UNSIGNED   NOT NULL,
  `conteudo_tipo`  ENUM('filme','episodio') NOT NULL,
  `conteudo_id`    INT UNSIGNED   NOT NULL,
  `posicao_seg`    INT UNSIGNED   NOT NULL DEFAULT 0                    COMMENT 'Segundos assistidos',
  `duracao_seg`    INT UNSIGNED       NULL DEFAULT NULL,
  `concluido`      TINYINT(1)     NOT NULL DEFAULT 0,
  `atualizado_em`  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                           ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_conteudo` (`usuario_id`, `conteudo_tipo`, `conteudo_id`),
  INDEX `idx_usuario` (`usuario_id`),
  CONSTRAINT `fk_prog_usuario`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ================================================================
-- 16. ANÚNCIOS ADSENSE
--    CRUD completo para gerenciar blocos de anúncio por posição.
-- ================================================================
CREATE TABLE `anuncios` (
  `id`             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `nome`           VARCHAR(150)  NOT NULL                               COMMENT 'Nome interno do anúncio',
  `codigo_html`    MEDIUMTEXT    NOT NULL                               COMMENT 'Script/HTML do AdSense',
  `posicao`        ENUM(
                     'header',
                     'home_topo',
                     'home_meio',
                     'home_rodape',
                     'sidebar',
                     'pre_player',
                     'pos_player',
                     'entre_episodios',
                     'pagina_conteudo',
                     'footer'
                   )             NOT NULL,
  `tipo_conteudo`  SET('filme','serie','anime','todos')
                                 NOT NULL DEFAULT 'todos'               COMMENT 'Em quais tipos exibir',
  `status`         TINYINT(1)    NOT NULL DEFAULT 1                     COMMENT '1=ativo 0=inativo',
  `prioridade`     TINYINT UNSIGNED NOT NULL DEFAULT 5                  COMMENT '1 (maior) a 10 (menor)',
  `data_inicio`    DATE              NULL DEFAULT NULL                  COMMENT 'NULL = sempre',
  `data_fim`       DATE              NULL DEFAULT NULL,
  `impressoes`     BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `cliques`        BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `criado_por`     INT UNSIGNED      NULL DEFAULT NULL,
  `criado_em`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                          ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_posicao_status` (`posicao`, `status`),
  INDEX `idx_prioridade`     (`prioridade`),
  CONSTRAINT `fk_anuncio_criado_por`
    FOREIGN KEY (`criado_por`) REFERENCES `usuarios` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ================================================================
-- 17. MÉTRICAS DE ACESSO (pageviews)
--    Registra cada visualização de página para o dashboard admin.
--    Gravar de forma assíncrona / via queue para não travar requests.
-- ================================================================
CREATE TABLE `acessos` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `conteudo_tipo`  ENUM('filme','serie','anime','episodio','home','busca','outro')
                                   NOT NULL DEFAULT 'outro',
  `conteudo_id`    INT UNSIGNED        NULL DEFAULT NULL,
  `usuario_id`     INT UNSIGNED        NULL DEFAULT NULL,
  `ip`             VARCHAR(45)         NULL DEFAULT NULL,
  `user_agent`     VARCHAR(500)        NULL DEFAULT NULL,
  `referer`        VARCHAR(500)        NULL DEFAULT NULL,
  `criado_em`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_conteudo`  (`conteudo_tipo`, `conteudo_id`),
  INDEX `idx_criado_em` (`criado_em`),
  INDEX `idx_usuario`   (`usuario_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ================================================================
-- 18. LISTA DO USUÁRIO (watchlist / "Minha Lista")
-- ================================================================
CREATE TABLE `lista_usuario` (
  `id`             INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  `usuario_id`     INT UNSIGNED   NOT NULL,
  `conteudo_tipo`  ENUM('filme','serie','anime') NOT NULL,
  `conteudo_id`    INT UNSIGNED   NOT NULL,
  `criado_em`      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_conteudo` (`usuario_id`, `conteudo_tipo`, `conteudo_id`),
  CONSTRAINT `fk_lista_usuario`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ================================================================
-- 19. TAGS DE CONTEÚDO (opcional, para filtros avançados)
-- ================================================================
CREATE TABLE `tags` (
  `id`    SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nome`  VARCHAR(80)       NOT NULL,
  `slug`  VARCHAR(80)       NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `conteudo_tags` (
  `conteudo_tipo` ENUM('filme','serie','anime') NOT NULL,
  `conteudo_id`   INT UNSIGNED      NOT NULL,
  `tag_id`        SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (`conteudo_tipo`, `conteudo_id`, `tag_id`),
  CONSTRAINT `fk_ct_tag` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ================================================================
-- 20. CONFIGURAÇÕES DO SISTEMA
--    Pares chave/valor para configurações dinâmicas do admin.
-- ================================================================
CREATE TABLE `configuracoes` (
  `chave`          VARCHAR(100)  NOT NULL,
  `valor`          TEXT              NULL,
  `descricao`      VARCHAR(300)      NULL DEFAULT NULL,
  `atualizado_em`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                          ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`chave`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `configuracoes` (`chave`, `valor`, `descricao`) VALUES
  ('site_nome',           'Splitflix',         'Nome do site exibido no header'),
  ('site_descricao',      'Assista filmes, séries e animes em HD', 'Meta description padrão'),
  ('comentarios_moderacao', '1',               '1=aprovação manual, 0=automático'),
  ('max_login_tentativas', '5',                'Tentativas antes de bloquear IP'),
  ('bloqueio_minutos',    '15',                'Minutos de bloqueio após exceder tentativas'),
  ('jwt_expiracao_min',   '60',                'Minutos de validade do access token JWT'),
  ('jwt_refresh_dias',    '30',                'Dias de validade do refresh token'),
  ('upload_max_mb',       '10',                'Tamanho máximo de upload em MB'),
  ('adsense_publisher_id','',                  'ca-pub-XXXXXXXXXXXXXXXX');


-- ================================================================
-- SEED: Usuário admin padrão
--   Senha: Admin@2026!  (bcrypt hash gerado com PHP)
--   ALTERAR IMEDIATAMENTE após o primeiro login.
-- ================================================================
INSERT INTO `usuarios`
  (`nome`, `email`, `senha_hash`, `papel`, `status`, `email_verificado`)
VALUES (
  'Administrador',
  'admin@splitflix.local',
  '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'admin',
  'ativo',
  1
);
-- Nota: o hash acima corresponde à senha 'Admin@2026!'
-- Trocar em: UPDATE usuarios SET senha_hash = password_hash('SUA_SENHA', PASSWORD_BCRYPT) WHERE email = 'admin@splitflix.local';


-- ================================================================
-- VIEWS úteis para o dashboard admin
-- ================================================================

-- Total de conteúdo por tipo
CREATE OR REPLACE VIEW `vw_totais_conteudo` AS
  SELECT 'filmes'  AS tipo, COUNT(*) AS total FROM filmes  WHERE status = 'publicado'
  UNION ALL
  SELECT 'series'  AS tipo, COUNT(*) AS total FROM series  WHERE status = 'publicado'
  UNION ALL
  SELECT 'animes'  AS tipo, COUNT(*) AS total FROM animes  WHERE status = 'publicado'
  UNION ALL
  SELECT 'episodios' AS tipo, COUNT(*) AS total FROM episodios WHERE status = 'publicado';

-- Acessos nas últimas 24h
CREATE OR REPLACE VIEW `vw_acessos_24h` AS
  SELECT
    conteudo_tipo,
    COUNT(*) AS total
  FROM acessos
  WHERE criado_em >= NOW() - INTERVAL 24 HOUR
  GROUP BY conteudo_tipo;

-- Top 10 conteúdos mais acessados (últimos 7 dias)
CREATE OR REPLACE VIEW `vw_top_conteudos_7dias` AS
  SELECT
    conteudo_tipo,
    conteudo_id,
    COUNT(*) AS visualizacoes
  FROM acessos
  WHERE criado_em >= NOW() - INTERVAL 7 DAY
    AND conteudo_id IS NOT NULL
  GROUP BY conteudo_tipo, conteudo_id
  ORDER BY visualizacoes DESC
  LIMIT 10;

-- Comentários pendentes
CREATE OR REPLACE VIEW `vw_comentarios_pendentes` AS
  SELECT
    c.*,
    u.nome AS usuario_nome,
    u.email AS usuario_email
  FROM comentarios c
  JOIN usuarios u ON u.id = c.usuario_id
  WHERE c.status = 'pendente'
  ORDER BY c.criado_em ASC;


-- ================================================================
-- FIM DO SCRIPT — splitflix.sql
-- Versão: 1.0.0  |  2026-06-07
-- ================================================================
