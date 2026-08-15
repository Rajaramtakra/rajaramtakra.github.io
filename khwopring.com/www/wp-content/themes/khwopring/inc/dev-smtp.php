<?php
/**
 * Local dev only: route wp_mail() through Mailpit (a local SMTP catcher) so
 * the contact form is actually testable without real mail credentials.
 * View caught mail at http://127.0.0.1:8025/. Do NOT enable this in
 * production — swap for real SMTP credentials (e.g. via WP Mail SMTP)
 * instead.
 */

defined( 'ABSPATH' ) || exit;

if ( ! defined( 'WP_DEBUG' ) || ! WP_DEBUG ) {
	return;
}

add_action( 'phpmailer_init', function ( $phpmailer ) {
	$phpmailer->isSMTP();
	$phpmailer->Host       = '127.0.0.1';
	$phpmailer->Port       = 1025;
	$phpmailer->SMTPAuth   = false;
	$phpmailer->SMTPSecure = false;
	$phpmailer->SMTPAutoTLS = false;
} );
