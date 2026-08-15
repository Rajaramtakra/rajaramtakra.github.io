<?php
/**
 * Khwopring headless theme bootstrap.
 */

defined( 'ABSPATH' ) || exit;

require_once __DIR__ . '/inc/cpts.php';
require_once __DIR__ . '/inc/acf-fields.php';
require_once __DIR__ . '/inc/theme-settings.php';
require_once __DIR__ . '/inc/rest-api.php';
require_once __DIR__ . '/inc/dev-smtp.php';

function khwopring_theme_setup() {
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'html5', array( 'search-form', 'gallery', 'caption' ) );

	register_nav_menus( array(
		'primary' => 'Primary Navigation',
	) );

	add_image_size( 'card', 600, 400, true );
	add_image_size( 'hero', 1920, 900, true );
}
add_action( 'after_setup_theme', 'khwopring_theme_setup' );

/** Headless site: no front-end templates render, so skip emoji/embed scripts meant for them. */
function khwopring_disable_frontend_bloat() {
	remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
	remove_action( 'wp_print_styles', 'print_emoji_styles' );
	remove_action( 'wp_head', 'wp_generator' );
}
add_action( 'init', 'khwopring_disable_frontend_bloat' );
