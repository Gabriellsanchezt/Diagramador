-- Ejecutar en diagrama_bd si ya tenía sede_zonas sin piso_id

USE diagrama_bd;

ALTER TABLE sede_zonas
  ADD COLUMN piso_id INT UNSIGNED NULL COMMENT 'Piso padre del área' AFTER sede_id,
  ADD KEY idx_piso (piso_id);

ALTER TABLE sede_zonas
  ADD CONSTRAINT fk_zona_piso FOREIGN KEY (piso_id) REFERENCES sede_zonas(id) ON DELETE CASCADE;

-- Áreas huérfanas existentes: asignar al primer piso de la misma sede (si existe)
UPDATE sede_zonas a
INNER JOIN (
  SELECT sede_id, MIN(id) AS primer_piso_id
  FROM sede_zonas
  WHERE tipo = 'piso'
  GROUP BY sede_id
) p ON p.sede_id = a.sede_id
SET a.piso_id = p.primer_piso_id
WHERE a.tipo = 'area' AND a.piso_id IS NULL;

ALTER TABLE sede_zonas
  ADD CONSTRAINT chk_zona_jerarquia CHECK (
    (tipo = 'piso' AND piso_id IS NULL) OR
    (tipo = 'area' AND piso_id IS NOT NULL)
  );
