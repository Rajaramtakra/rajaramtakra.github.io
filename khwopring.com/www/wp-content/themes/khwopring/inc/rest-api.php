<?php
/**
 * REST API: expose ACF fields on every CPT, plus custom endpoints for site
 * settings, nav menu, and the contact form. Also opens CORS for the Vite
 * dev server during local development.
 */

defined( 'ABSPATH' ) || exit;

/** ACF fields aren't exposed to REST by free ACF automatically — add them. */
function khwopring_expose_acf_in_rest() {
	$post_types = array(
		'hero_slide', 'event', 'gallery_item', 'teacher', 'testimonial',
		'notice', 'facility', 'achievement', 'admission_notice', 'statistic',
		'principal_message', 'page',
	);
	foreach ( $post_types as $post_type ) {
		register_rest_field( $post_type, 'acf', array(
			'get_callback' => function ( $object ) {
				return function_exists( 'get_fields' ) ? get_fields( $object['id'] ) : array();
			},
			'schema' => null,
		) );
	}
}
add_action( 'rest_api_init', 'khwopring_expose_acf_in_rest' );

/** Dev CORS: allow the Vite dev server to call the REST API. */
function khwopring_rest_cors() {
	remove_filter( 'rest_pre_serve_request', 'rest_send_cors_headers' );
	add_filter( 'rest_pre_serve_request', function ( $value ) {
		$allowed_origins = array( 'http://localhost:5173', 'http://127.0.0.1:5173' );
		$origin = get_http_origin();
		if ( $origin && in_array( $origin, $allowed_origins, true ) ) {
			header( 'Access-Control-Allow-Origin: ' . esc_url_raw( $origin ) );
			header( 'Access-Control-Allow-Methods: GET, POST, OPTIONS' );
			header( 'Access-Control-Allow-Credentials: true' );
			header( 'Access-Control-Allow-Headers: Content-Type, X-WP-Nonce' );
		}
		return $value;
	} );
}
add_action( 'rest_api_init', 'khwopring_rest_cors', 15 );

/** GET /khwopring/v1/site-settings */
function khwopring_rest_site_settings( WP_REST_Request $request ) {
	$settings = get_option( KHWOPRING_SETTINGS_OPTION, array() );
	if ( ! empty( $settings['logo'] ) ) {
		$settings['logo_url'] = wp_get_attachment_image_url( $settings['logo'], 'medium' );
	}
	return rest_ensure_response( $settings );
}

/** GET /khwopring/v1/menu?location=primary — nested menu tree for header nav. */
function khwopring_rest_menu( WP_REST_Request $request ) {
	$location = $request->get_param( 'location' ) ?: 'primary';
	$locations = get_nav_menu_locations();

	if ( empty( $locations[ $location ] ) ) {
		return rest_ensure_response( array() );
	}

	$menu_items = wp_get_nav_menu_items( $locations[ $location ] );
	if ( ! $menu_items ) {
		return rest_ensure_response( array() );
	}

	$items_by_id = array();
	foreach ( $menu_items as $item ) {
		$items_by_id[ $item->ID ] = array(
			'id'       => $item->ID,
			'title'    => $item->title,
			'url'      => $item->url,
			'target'   => $item->target,
			'children' => array(),
		);
	}

	$tree = array();
	foreach ( $menu_items as $item ) {
		if ( $item->menu_item_parent && isset( $items_by_id[ $item->menu_item_parent ] ) ) {
			$items_by_id[ $item->menu_item_parent ]['children'][] = &$items_by_id[ $item->ID ];
		} else {
			$tree[] = &$items_by_id[ $item->ID ];
		}
	}

	return rest_ensure_response( $tree );
}

/** POST /khwopring/v1/contact */
function khwopring_rest_contact( WP_REST_Request $request ) {
	$name    = sanitize_text_field( $request->get_param( 'name' ) );
	$email   = sanitize_email( $request->get_param( 'email' ) );
	$phone   = sanitize_text_field( $request->get_param( 'phone' ) );
	$subject = sanitize_text_field( $request->get_param( 'subject' ) );
	$message = sanitize_textarea_field( $request->get_param( 'message' ) );

	if ( ! $name || ! is_email( $email ) || ! $message ) {
		return new WP_Error( 'invalid_data', 'Please fill in your name, a valid email, and a message.', array( 'status' => 400 ) );
	}

	$settings = get_option( KHWOPRING_SETTINGS_OPTION, array() );
	$to = ! empty( $settings['email'] ) ? $settings['email'] : get_option( 'admin_email' );

	$body = "Name: {$name}\nEmail: {$email}\nPhone: {$phone}\nSubject: {$subject}\n\nMessage:\n{$message}";
	$sent = wp_mail( $to, '[Website Contact] ' . ( $subject ?: 'New enquiry' ), $body, array( 'Reply-To: ' . $name . ' <' . $email . '>' ) );

	if ( ! $sent ) {
		return new WP_Error( 'mail_failed', 'Sorry, the message could not be sent. Please try again later.', array( 'status' => 500 ) );
	}

	return rest_ensure_response( array( 'success' => true, 'message' => 'Thank you — your message has been sent.' ) );
}

/** Maps a search result post to the React frontend route that displays it. */
function khwopring_search_result_url( WP_Post $post ) {
	switch ( $post->post_type ) {
		case 'news':
			return '/news/' . $post->post_name;
		case 'event':
			return '/event/' . $post->post_name;
		case 'facility':
			return '/facilities';
		case 'teacher':
			return '/teachers';
		case 'faq_item':
			return '/faq';
		case 'admission_notice':
			return '/admission';
		case 'page':
			$slug_map = array(
				'home'      => '/',
				'about'     => '/about',
				'academics' => '/academics',
				'admission' => '/admission',
				'faq'       => '/faq',
			);
			return $slug_map[ $post->post_name ] ?? ( '/' . $post->post_name );
		default:
			return '/';
	}
}

$khwopring_search_type_labels = array(
	'news'             => 'News',
	'event'            => 'Event',
	'facility'         => 'Facility',
	'teacher'          => 'Our Team',
	'faq_item'         => 'FAQ',
	'admission_notice' => 'Admission',
	'page'             => 'Page',
);

/** GET /khwopring/v1/search?q=... — searches across every publicly browsable CPT. */
function khwopring_rest_search( WP_REST_Request $request ) {
	global $khwopring_search_type_labels;

	$query = trim( (string) $request->get_param( 'q' ) );
	if ( '' === $query ) {
		return rest_ensure_response( array() );
	}

	$posts = get_posts( array(
		'post_type'      => array_keys( $khwopring_search_type_labels ),
		's'              => $query,
		'posts_per_page' => 20,
		'post_status'    => 'publish',
	) );

	// Exclude the front page itself from generic "page" results — Home is
	// already one click away and rarely what someone searching expects.
	$front_page_id = (int) get_option( 'page_on_front' );

	$results = array();
	foreach ( $posts as $post ) {
		if ( 'page' === $post->post_type && $post->ID === $front_page_id ) {
			continue;
		}
		$excerpt = has_excerpt( $post ) ? $post->post_excerpt : $post->post_content;
		$results[] = array(
			'id'      => $post->ID,
			'type'    => $post->post_type,
			'typeLabel' => $khwopring_search_type_labels[ $post->post_type ] ?? $post->post_type,
			'title'   => get_the_title( $post ),
			'excerpt' => wp_trim_words( wp_strip_all_tags( $excerpt ), 20 ),
			'url'     => khwopring_search_result_url( $post ),
		);
	}

	return rest_ensure_response( $results );
}

function khwopring_register_rest_routes() {
	register_rest_route( 'khwopring/v1', '/site-settings', array(
		'methods'             => 'GET',
		'callback'            => 'khwopring_rest_site_settings',
		'permission_callback' => '__return_true',
	) );

	register_rest_route( 'khwopring/v1', '/search', array(
		'methods'             => 'GET',
		'callback'            => 'khwopring_rest_search',
		'permission_callback' => '__return_true',
	) );

	register_rest_route( 'khwopring/v1', '/menu', array(
		'methods'             => 'GET',
		'callback'            => 'khwopring_rest_menu',
		'permission_callback' => '__return_true',
	) );

	register_rest_route( 'khwopring/v1', '/contact', array(
		'methods'             => 'POST',
		'callback'            => 'khwopring_rest_contact',
		'permission_callback' => '__return_true',
	) );
}
add_action( 'rest_api_init', 'khwopring_register_rest_routes' );
