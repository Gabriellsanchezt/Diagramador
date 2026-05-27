<?php

declare(strict_types=1);

/** Redirección relativa: funciona en cualquier carpeta de htdocs. */
header('Location: public/index.php', true, 302);
exit;
