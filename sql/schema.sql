-- =============================================================================
-- DIAGRAMADOR BERILION - Esquema MySQL/MariaDB para XAMPP
-- Ejecutar en phpMyAdmin o: mysql -u root < sql/schema.sql
-- =============================================================================

CREATE DATABASE IF NOT EXISTS diagrama_bd
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE diagrama_bd;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS equipos;
DROP TABLE IF EXISTS sede_zonas;
DROP TABLE IF EXISTS sedes;
DROP TABLE IF EXISTS tipos_equipo;
DROP TABLE IF EXISTS usuarios;

SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- Usuarios (login con contraseña hasheada)
-- -----------------------------------------------------------------------------
CREATE TABLE usuarios (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario       VARCHAR(50)  NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nombre        VARCHAR(100) NOT NULL DEFAULT '',
  activo        TINYINT(1)   NOT NULL DEFAULT 1,
  creado_en     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_usuario (usuario)
) ENGINE=InnoDB;

-- Usuario por defecto: admin / berilion23
INSERT INTO usuarios (usuario, password_hash, nombre) VALUES
('admin', '$2y$10$lN9IS56uPZGf/6Hzqx7rpOv1G2wTx.xe6CNgYV.RLdc2onUPofjSq', 'Administrador');

-- -----------------------------------------------------------------------------
-- Catálogo de tipos de equipo (lógica estructural administrable)
-- -----------------------------------------------------------------------------
CREATE TABLE tipos_equipo (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo             VARCHAR(40)  NOT NULL,
  etiqueta           VARCHAR(80)  NOT NULL,
  requiere_ip        TINYINT(1)   NOT NULL DEFAULT 0,
  requiere_velocidad TINYINT(1)   NOT NULL DEFAULT 0,
  requiere_puertos   TINYINT(1)   NOT NULL DEFAULT 0,
  es_switch          TINYINT(1)   NOT NULL DEFAULT 0,
  puertos_max        TINYINT UNSIGNED NULL,
  activo             TINYINT(1)   NOT NULL DEFAULT 1,
  orden              SMALLINT     NOT NULL DEFAULT 0,
  UNIQUE KEY uk_codigo (codigo)
) ENGINE=InnoDB;

INSERT INTO tipos_equipo (codigo, etiqueta, requiere_ip, requiere_velocidad, requiere_puertos, es_switch, puertos_max, orden) VALUES
('Router',              'Router',                         0, 1, 0, 0,  4,  10),
('Deco',                'Deco / Mesh',                    0, 1, 0, 0,  4,  20),
('Repetidor',           'Repetidor AP',                   1, 1, 0, 0,  4,  30),
('Switch_Acceso_16',    'Switch Acceso Rack (16p)',       0, 1, 0, 1, 16,  40),
('Switch_Acceso_24',    'Switch Acceso Rack (24p)',       0, 1, 0, 1, 24,  41),
('Switch_Distrib_16',   'Switch Distribución Rack (16p)', 0, 1, 0, 1, 16,  50),
('Switch_Distrib_24',   'Switch Distribución Rack (24p)', 0, 1, 0, 1, 24,  51),
('Switch_Nucleo_16',    'Switch Núcleo Rack (16p)',        0, 1, 0, 1, 16,  60),
('Switch_Puesto_5',     'Switch Acceso Puesto (5p)',      0, 1, 0, 1,  5,  70),
('Switch_Puesto_8',     'Switch Acceso Puesto (8p)',      0, 1, 0, 1,  8,  71),
('Servidor',            'Servidor',                       1, 0, 0, 0, NULL, 80),
('DVR',                 'DVR / NVR',                      0, 0, 0, 0, NULL, 90),
('Camara_IP',           'Cámara IP',                      1, 0, 0, 0, NULL, 95),
('Camara_Cableada',     'Cámara cableada (analógica)',    0, 0, 0, 0, NULL, 96),
('Interbancario',       'Interbancario',                  0, 0, 0, 0, NULL, 100),
('Biometrico',          'Biométrico',                     1, 0, 0, 0, NULL, 110),
('Impresora',           'Impresora',                      1, 0, 0, 0, NULL, 120),
('PC',                  'Estación de Trabajo',             0, 0, 1, 0, NULL, 130);

-- -----------------------------------------------------------------------------
-- Sedes
-- -----------------------------------------------------------------------------
CREATE TABLE sedes (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre           VARCHAR(255) NOT NULL,
  rif              VARCHAR(20)  NULL,
  categoria_cable  ENUM('Cat5e','Cat6','No especificado') NOT NULL DEFAULT 'No especificado',
  activa           TINYINT(1)   NOT NULL DEFAULT 1,
  creado_en        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_nombre (nombre),
  KEY idx_activa (activa)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- Pisos / áreas por sede (agrupación en diagrama)
-- -----------------------------------------------------------------------------
CREATE TABLE sede_zonas (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sede_id     INT UNSIGNED NOT NULL,
  piso_id     INT UNSIGNED NULL COMMENT 'Obligatorio si tipo=area: piso al que pertenece',
  nombre      VARCHAR(120) NOT NULL,
  tipo        ENUM('piso','area') NOT NULL DEFAULT 'piso',
  orden       SMALLINT     NOT NULL DEFAULT 1,
  color_hex   CHAR(7)      NOT NULL DEFAULT '#3b82f6',
  activa      TINYINT(1)   NOT NULL DEFAULT 1,
  FOREIGN KEY (sede_id) REFERENCES sedes(id) ON DELETE CASCADE,
  FOREIGN KEY (piso_id) REFERENCES sede_zonas(id) ON DELETE CASCADE,
  KEY idx_sede_orden (sede_id, orden),
  KEY idx_piso (piso_id),
  CONSTRAINT chk_zona_jerarquia CHECK (
    (tipo = 'piso' AND piso_id IS NULL) OR
    (tipo = 'area' AND piso_id IS NOT NULL)
  )
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- Equipos de red por sede
-- -----------------------------------------------------------------------------
CREATE TABLE equipos (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sede_id         INT UNSIGNED NOT NULL,
  zona_id         INT UNSIGNED NULL,
  tipo_codigo     VARCHAR(40)  NOT NULL,
  switch_capa     ENUM('acceso','distribucion','nucleo') NULL,
  modelo          VARCHAR(255) NOT NULL DEFAULT '',
  ip              VARCHAR(45)  NULL,
  generacion      VARCHAR(20)  NULL,
  velocidad       VARCHAR(50)  NULL,
  puertos_usados  TINYINT UNSIGNED NULL,
  medio_enlace    ENUM('cableado','inalambrico') NOT NULL DEFAULT 'cableado',
  padre_id        INT UNSIGNED NULL,
  creado_en       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (sede_id) REFERENCES sedes(id) ON DELETE CASCADE,
  FOREIGN KEY (zona_id) REFERENCES sede_zonas(id) ON DELETE SET NULL,
  FOREIGN KEY (padre_id) REFERENCES equipos(id) ON DELETE SET NULL,
  FOREIGN KEY (tipo_codigo) REFERENCES tipos_equipo(codigo),
  KEY idx_sede (sede_id),
  KEY idx_padre (padre_id),
  KEY idx_ip_sede (sede_id, ip)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- Sedes iniciales
-- -----------------------------------------------------------------------------
INSERT INTO sedes (nombre) VALUES
('CONSORCIO FARMACIAS SAN IGNACIO (CONSORCIO)'),
('FARMACIA LA MILAGROSA 2019, C.A. (GC)'),
('FSI BISCUCUY, C.A. (AJ)'),
('FARMAIGNACIO EL SISAL, C.A. (AJ)'),
('FARMACIA SAN IGNACIO DE EL TOCUYO, C.A. (AJ)'),
('FARMACIA SAN IGNACIO LA 20, C.A. (AJ)'),
('FARMACIA SAN IGNACIO EL TOCUYO, C.A. (AJ)'),
('FARMAIGNACIO ANDRES BELLO, C.A. (AJ)'),
('FARMA MERCADO, C.A. (AJ)'),
('FARMACIA GUARICO FSI, C.A (AJ)'),
('FARMACIA LA PICA, C.A. (ANE)'),
('FARMACIA EL ROSARIO, C.A. (ANE)'),
('FARMACIA SAN MIGUEL DE CARORA, C.A. (ANE)'),
('FARMACIA FARMAMARKET, C.A. (GR)'),
('FARMACIA PTO CABELLO, C.A. (GR)'),
('FARMACIA CARORA LA 14, C.A. (GR)'),
('FARMACIA MIGUEL NIEVES, C.A (GR)'),
('FARMAIGNACIO BARARIDA, C.A. (JT)'),
('FARMAIGNACIO BARARIDA, C.A. (SUCURSAL) (JT)'),
('FARMAIGNACIO MIGUEL ANGEL, C.A. (JT)'),
('FARMACIA ALTAGRACIA 20, C.A. (JT)'),
('FARMAIGNACIO LA LARA, C.A. (JT)'),
('FARMACIA SAN VALENTIN EL BOLIVAR, C.A. (JT)'),
('FARMACIA BARRIO UNION, C.A. (JT)'),
('FARMACIA LA ORQUIDEA, C.A. (JT)'),
('FARMACIA LA 50, C.A. (JT)'),
('FARMAIGNACIO CENTRO, C.A. (JT)'),
('FARMAIGNACIO LA 19, C.A. (JT)'),
('FARMACIA LA 33 FT, C.A. (JT)'),
('FARMAIGNACIO MORAN, C.A. (JT)'),
('FARMACIA YUDIBETH, C.A. (JT)'),
('FARMACIA LOS CERRAJONES F.T, C.A (JT)'),
('FARMACIA SAN IGNACIO LA 25 F.T, C.A (JT)'),
('FARMACIA MEGA CENTER, C.A. (JT)'),
('FARMACIA CARLOS PÉREZ, C.A. (JT)'),
('FARMACIA SAN JUDAS OESTE, C.A. (JT)'),
('FARMACIA CHE GABRIEL DE CERRITOS BLANCO, C.A. (JT)'),
('FARMACIA GUANARE, C.A. (JT)'),
('FARMACIA FARMILY, C.A. (JT)'),
('FARMACIA ALIANZA 2020, C.A. (JT)'),
('FARMACIA EL ESFUERZO, C.A. (JT)'),
('FARMACIA FARMAIGNACIO ESTE, C.A. (JT)'),
('FARMACIA ANGELY, C.A. (JT)'),
('FARMACIA SANTA ISABEL DEL OESTE, C.A. (JT)'),
('FARMACIA SAN IGNACIO 2021, C.A. (JT)'),
('FARMACIA LA 5TA AVENIDA, C.A. (JT)'),
('FARMACIA NUEVA ALIANZA H&G C.A. (JT)'),
('FARMACIA LA VICTORIA 2023 WPM, C.A (JT)'),
('FARMACIA DIVINA PASTORA WPM C.A (JT)'),
('FARMACIA GUACARA WPM C.A (JT)'),
('FARMAIGNACIO LA SALUD, C.A. (JT)'),
('FARMAIGNACIO CAMORUCO, C.A. (JT)'),
('FARMAIGNACIO TINAQUILLO, C.A. (JT)'),
('FARMAIGNACIO NAGUANAGUA, C.A. (JT)'),
('FARMAIGNACIO SAN CARLOS, C.A. (JT)'),
('FARMAIGNACIO BEATRIZ TRISTANCHO C.A (JT)'),
('FARMAIGNACIO SAN JOAQUIN, C.A (JT)'),
('FARMACIA VERASI, C.A. (JT)'),
('FARMACIA SAN VALENTIN ACARIGUA CENTRO C.A (JT)'),
('FARMACIA FARMA-MARKET 2011, C.A. (AE)'),
('FARMACIA EL RECREO, C.A. (AE)'),
('FARMAIGNACIO LA 12, C.A. (AE)'),
('FARMACIA LA 37, C.A. (AE)'),
('FARMACIA LA 19, C.A. (AE)'),
('FARMACIA LA CHINITA DE LARA, C.A. (AE)'),
('MULTIFARMA 07, C.A. (AE)'),
('SUPERFARMA PORTUGUESA, C.A (AE)'),
('SUPERFARMA SANARE, C.A. (AE)'),
('SUPERFARMA LA FLORESTA, C.A. (AE)'),
('FARMACIA PRINCIPAL PIRITU, C.A. (AE)'),
('FARMACIA EL SAMAN DE TUREN, C.A. (AE)'),
('FARMACIA METROPOLIS DE LARA C.A. (AE)'),
('FARMACIA SAN VALENTIN CABUDARE CENTRO C.A (AE)'),
('FARMACIA SAN VALENTIN PAVIA, C.A. (AE)'),
('FARMACIA SAN VALENTIN FLORENCIO JIMÉNEZ, C.A. (AE)'),
('FARMACIA SAN VALENTIN EL OESTE, C.A. (AE)'),
('FARMACIA SAN IGNACIO DE LOYOLA II, C.A. (AE)'),
('FARMACIA LAS MERCEDES DE CABUDARE, C.A (AE)'),
('FARMACIA NUEVA SEGOVIA DE BQTO, C.A (AE)'),
('FARMACIA LA 55 DE BQTO, C.A (AE)'),
('FARMACIA SAN IGNACIO DE CHIVACOA, C.A. (AE)'),
('AMI DISTRIBUIDORA Y COMERCIALIZADORA, C.A (AE)'),
('FARMACIA SAN IGNACIO, C.A. (AE)'),
('FARMACIA DEL NORTE, C.A. (AE)'),
('MEDIENTREGRAS');
