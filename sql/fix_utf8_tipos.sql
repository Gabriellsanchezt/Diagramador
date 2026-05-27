-- Corrige textos dañados (ej. Biom??trico) por importación sin UTF-8
USE diagrama_bd;
SET NAMES utf8mb4;

SET FOREIGN_KEY_CHECKS = 0;

UPDATE equipos SET tipo_codigo = 'Biométrico' WHERE tipo_codigo LIKE 'Biom%trico' AND tipo_codigo <> 'Biométrico';
UPDATE modelos_equipo SET tipo_codigo = 'Biométrico' WHERE tipo_codigo LIKE 'Biom%trico' AND tipo_codigo <> 'Biométrico';

UPDATE tipos_equipo
SET codigo = 'Biométrico', etiqueta = 'Biométrico'
WHERE codigo LIKE 'Biom%trico' AND codigo <> 'Biométrico';

UPDATE tipos_equipo
SET etiqueta = 'Estación de Trabajo'
WHERE codigo = 'PC';

SET FOREIGN_KEY_CHECKS = 1;
