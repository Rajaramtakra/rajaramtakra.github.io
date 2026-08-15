<?php
/**
 * Khwopring English Secondary School — WordPress config (local dev, headless backend)
 */

// ** Database settings ** //
define( 'DB_NAME', 'khwopring_db' );
define( 'DB_USER', 'root' );
define( 'DB_PASSWORD', '' );
define( 'DB_HOST', '127.0.0.1:3307' );
define( 'DB_CHARSET', 'utf8mb4' );
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication unique keys and salts.
 */
define('AUTH_KEY',         ' c,7w%^tO@X/v_:k-!aR$!`um[7.ODYQ|%^z/Ivn~GO;NB`uN/d*7J`pEz^;h@Fb');
define('SECURE_AUTH_KEY',  '_A:*b/X&FoRm.qzhk8fTjus&-p~$PgZuJ&)-UvN41|TB6aTS+Cz&5H`Djin_X]Zs');
define('LOGGED_IN_KEY',    'qYW>Q^/8!C@!2_6/r7+A;Gr$Z*TOpv+wg^i+CMO{R3En}`Y=|[L:{}ji,2Zs#?I@');
define('NONCE_KEY',        '>dRI:V>vEaMoSv@lg^Z z=sH>P/V}gD}fh;v{y9}*r;{ekfQwVBjy>c^AiXgjB:8');
define('AUTH_SALT',        ':FG2+L-3 +a=bF9iI=`%N+uq)c0Y$Z|1Tp=D~t{&ENP{IVtQ+VeOT!D^BqM`mQ|N');
define('SECURE_AUTH_SALT', '@2ZPe/DB9yZDD`5r3-sW;xNT|<+stW m92<L!##E@8_z~+V p__2f_Qm?`ORIG;w');
define('LOGGED_IN_SALT',   'rJb]1-Vk%cyeRe+yXf!%{veIVu{*s=opL +TS}mrfsI3aLx+*>[dp1h5UB${i+7]');
define('NONCE_SALT',       'Zpt%97`l*HdD.(S*F^~2>{X^]$-u2rb 9<I-Ws?WejFC&wxo=wf(wqlDOCq]1_+V');
/**#@-*/

$table_prefix = 'wp_';

define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', true );
define( 'WP_DEBUG_DISPLAY', false );

// Headless: React frontend runs on the Vite dev server during development.
define( 'FRONTEND_URL', 'http://localhost:5173' );

if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

require_once ABSPATH . 'wp-settings.php';
