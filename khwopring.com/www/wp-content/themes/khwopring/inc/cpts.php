<?php
/**
 * Custom Post Types & Taxonomies for the Khwopring headless backend.
 *
 * Every repeatable content type from the design spec (hero slides, news,
 * events, gallery items, teachers, testimonials, notices, facilities,
 * achievements, admission notices, stats) is its own CPT rather than an ACF
 * repeater field, so none of this depends on ACF Pro.
 */

defined( 'ABSPATH' ) || exit;

function khwopring_register_cpts() {

	register_post_type( 'hero_slide', array(
		'labels'       => array(
			'name'          => 'Hero Slides',
			'singular_name' => 'Hero Slide',
			'add_new_item'  => 'Add New Hero Slide',
		),
		'public'       => true,
		'show_in_rest' => true,
		'show_in_menu' => true,
		'menu_icon'    => 'dashicons-images-alt2',
		'supports'     => array( 'title', 'thumbnail', 'page-attributes' ),
		'has_archive'  => false,
		'rewrite'      => false,
	) );

	register_post_type( 'news', array(
		'labels'       => array(
			'name'          => 'News',
			'singular_name' => 'News',
			'add_new_item'  => 'Add New News Post',
		),
		'public'       => true,
		'show_in_rest' => true,
		'show_in_menu' => true,
		'menu_icon'    => 'dashicons-media-document',
		'supports'     => array( 'title', 'editor', 'excerpt', 'thumbnail' ),
		'has_archive'  => true,
		'rewrite'      => array( 'slug' => 'news' ),
	) );

	register_post_type( 'event', array(
		'labels'       => array(
			'name'          => 'Events',
			'singular_name' => 'Event',
			'add_new_item'  => 'Add New Event',
		),
		'public'       => true,
		'show_in_rest' => true,
		'show_in_menu' => true,
		'menu_icon'    => 'dashicons-calendar-alt',
		'supports'     => array( 'title', 'editor', 'excerpt', 'thumbnail' ),
		'has_archive'  => true,
		'rewrite'      => array( 'slug' => 'event' ),
	) );

	register_post_type( 'gallery_item', array(
		'labels'       => array(
			'name'          => 'Gallery',
			'singular_name' => 'Gallery Item',
			'add_new_item'  => 'Add New Gallery Item',
		),
		'public'       => true,
		'show_in_rest' => true,
		'show_in_menu' => true,
		'menu_icon'    => 'dashicons-format-gallery',
		'supports'     => array( 'title', 'thumbnail' ),
		'has_archive'  => false,
		'rewrite'      => false,
	) );

	register_post_type( 'teacher', array(
		'labels'       => array(
			'name'          => 'Teachers',
			'singular_name' => 'Teacher',
			'add_new_item'  => 'Add New Teacher',
		),
		'public'       => true,
		'show_in_rest' => true,
		'show_in_menu' => true,
		'menu_icon'    => 'dashicons-groups',
		'supports'     => array( 'title', 'editor', 'thumbnail', 'page-attributes' ),
		'has_archive'  => false,
		'rewrite'      => false,
	) );

	register_post_type( 'testimonial', array(
		'labels'       => array(
			'name'          => 'Testimonials',
			'singular_name' => 'Testimonial',
			'add_new_item'  => 'Add New Testimonial',
		),
		'public'       => true,
		'show_in_rest' => true,
		'show_in_menu' => true,
		'menu_icon'    => 'dashicons-format-quote',
		'supports'     => array( 'title', 'editor', 'thumbnail' ),
		'has_archive'  => false,
		'rewrite'      => false,
	) );

	register_post_type( 'notice', array(
		'labels'       => array(
			'name'          => 'Notices',
			'singular_name' => 'Notice',
			'add_new_item'  => 'Add New Notice',
		),
		'public'       => true,
		'show_in_rest' => true,
		'show_in_menu' => true,
		'menu_icon'    => 'dashicons-megaphone',
		'supports'     => array( 'title', 'editor' ),
		'has_archive'  => true,
		'rewrite'      => array( 'slug' => 'notice' ),
	) );

	register_post_type( 'facility', array(
		'labels'       => array(
			'name'          => 'Facilities',
			'singular_name' => 'Facility',
			'add_new_item'  => 'Add New Facility',
		),
		'public'       => true,
		'show_in_rest' => true,
		'show_in_menu' => true,
		'menu_icon'    => 'dashicons-building',
		'supports'     => array( 'title', 'editor', 'thumbnail', 'page-attributes' ),
		'has_archive'  => true,
		'rewrite'      => array( 'slug' => 'facility' ),
	) );

	register_post_type( 'achievement', array(
		'labels'       => array(
			'name'          => 'Achievements',
			'singular_name' => 'Achievement',
			'add_new_item'  => 'Add New Achievement',
		),
		'public'       => true,
		'show_in_rest' => true,
		'show_in_menu' => true,
		'menu_icon'    => 'dashicons-awards',
		'supports'     => array( 'title', 'editor', 'thumbnail' ),
		'has_archive'  => false,
		'rewrite'      => false,
	) );

	register_post_type( 'admission_notice', array(
		'labels'       => array(
			'name'          => 'Admission Notices',
			'singular_name' => 'Admission Notice',
			'add_new_item'  => 'Add New Admission Notice',
		),
		'public'       => true,
		'show_in_rest' => true,
		'show_in_menu' => true,
		'menu_icon'    => 'dashicons-welcome-learn-more',
		'supports'     => array( 'title', 'editor', 'thumbnail' ),
		'has_archive'  => true,
		'rewrite'      => array( 'slug' => 'admission-notice' ),
	) );

	register_post_type( 'statistic', array(
		'labels'       => array(
			'name'          => 'Statistics',
			'singular_name' => 'Statistic',
			'add_new_item'  => 'Add New Statistic',
		),
		'public'       => true,
		'show_in_rest' => true,
		'show_in_menu' => true,
		'menu_icon'    => 'dashicons-chart-bar',
		'supports'     => array( 'title', 'page-attributes' ),
		'has_archive'  => false,
		'rewrite'      => false,
	) );

	register_post_type( 'principal_message', array(
		'labels'       => array(
			'name'          => 'Principal Message',
			'singular_name' => 'Principal Message',
			'add_new_item'  => 'Add New Principal Message',
		),
		'public'       => true,
		'show_in_rest' => true,
		'show_in_menu' => true,
		'menu_icon'    => 'dashicons-admin-users',
		'supports'     => array( 'title', 'editor', 'thumbnail', 'page-attributes' ),
		'has_archive'  => false,
		'rewrite'      => false,
	) );

	register_post_type( 'highlight', array(
		'labels'       => array(
			'name'          => 'Why Us Highlights',
			'singular_name' => 'Highlight',
			'add_new_item'  => 'Add New Highlight',
		),
		'public'       => true,
		'show_in_rest' => true,
		'show_in_menu' => true,
		'menu_icon'    => 'dashicons-star-filled',
		'supports'     => array( 'title', 'editor', 'thumbnail', 'page-attributes' ),
		'has_archive'  => false,
		'rewrite'      => false,
	) );

	register_post_type( 'faq_item', array(
		'labels'       => array(
			'name'          => 'FAQs',
			'singular_name' => 'FAQ',
			'add_new_item'  => 'Add New FAQ',
		),
		'public'       => true,
		'show_in_rest' => true,
		'show_in_menu' => true,
		'menu_icon'    => 'dashicons-editor-help',
		'supports'     => array( 'title', 'editor', 'page-attributes' ),
		'has_archive'  => false,
		'rewrite'      => false,
	) );
}
add_action( 'init', 'khwopring_register_cpts' );

function khwopring_register_taxonomies() {

	register_taxonomy( 'news_category', 'news', array(
		'labels'       => array( 'name' => 'News Categories', 'singular_name' => 'News Category' ),
		'public'       => true,
		'show_in_rest' => true,
		'hierarchical' => true,
		'rewrite'      => array( 'slug' => 'news-category' ),
	) );

	register_taxonomy( 'event_category', 'event', array(
		'labels'       => array( 'name' => 'Event Categories', 'singular_name' => 'Event Category' ),
		'public'       => true,
		'show_in_rest' => true,
		'hierarchical' => true,
		'rewrite'      => array( 'slug' => 'event-category' ),
	) );

	register_taxonomy( 'gallery_category', 'gallery_item', array(
		'labels'       => array( 'name' => 'Gallery Categories', 'singular_name' => 'Gallery Category' ),
		'public'       => true,
		'show_in_rest' => true,
		'hierarchical' => true,
		'rewrite'      => array( 'slug' => 'gallery-category' ),
	) );
}
add_action( 'init', 'khwopring_register_taxonomies' );
