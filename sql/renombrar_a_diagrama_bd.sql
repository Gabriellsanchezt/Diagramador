-- Si ya tenía la base "diagramador_berilion", ejecute este script una vez en phpMyAdmin
-- para mover las tablas a "diagrama_bd" sin perder datos.

CREATE DATABASE IF NOT EXISTS diagrama_bd
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

RENAME TABLE diagramador_berilion.usuarios TO diagrama_bd.usuarios;
RENAME TABLE diagramador_berilion.tipos_equipo TO diagrama_bd.tipos_equipo;
RENAME TABLE diagramador_berilion.sedes TO diagrama_bd.sedes;
RENAME TABLE diagramador_berilion.sede_zonas TO diagrama_bd.sede_zonas;
RENAME TABLE diagramador_berilion.equipos TO diagrama_bd.equipos;

DROP DATABASE diagramador_berilion;
