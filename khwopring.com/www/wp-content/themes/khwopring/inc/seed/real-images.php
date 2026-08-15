<?php
/**
 * One-off: replace placeholder picsum.photos images with the school's own
 * real photos (pulled from the live khwopring.edu.np site, staged locally
 * in .tools/real-images/) across the CPTs that were seeded with placeholders.
 * Run via: wp eval-file wp-content/themes/khwopring/inc/seed/real-images.php
 */

require_once ABSPATH . 'wp-admin/includes/media.php';
require_once ABSPATH . 'wp-admin/includes/file.php';
require_once ABSPATH . 'wp-admin/includes/image.php';

define( 'KH_STAGE_DIR', 'D:/wamp/www/Khwopring.com.np/.tools/real-images/' );

function khreal_import( $filename, $title ) {
	static $cache = array();
	if ( isset( $cache[ $filename ] ) ) {
		return $cache[ $filename ];
	}
	$path = KH_STAGE_DIR . $filename;
	if ( ! file_exists( $path ) ) {
		echo "MISSING: {$filename}\n";
		return 0;
	}
	$file_array = array(
		'name'     => $filename,
		'tmp_name' => $path,
	);
	// media_handle_sideload deletes tmp_name on success/failure — copy first so
	// the staged original survives for re-runs.
	$tmp_copy = wp_tempnam( $filename );
	copy( $path, $tmp_copy );
	$file_array['tmp_name'] = $tmp_copy;

	$attachment_id = media_handle_sideload( $file_array, 0, $title );
	if ( is_wp_error( $attachment_id ) ) {
		echo "FAILED {$filename}: " . $attachment_id->get_error_message() . "\n";
		return 0;
	}
	echo "Imported {$filename} -> #{$attachment_id}\n";
	$cache[ $filename ] = $attachment_id;
	return $attachment_id;
}

function khreal_find( $post_type, $title ) {
	$q = new WP_Query( array(
		'post_type'      => $post_type,
		'title'          => $title,
		'posts_per_page' => 1,
		'post_status'    => 'any',
	) );
	return $q->posts[0] ?? null;
}

echo "== Importing real Khwopring photos ==\n";

// Logo -> site settings
$logo_id = khreal_import( 'logo.png', 'Khwopring Logo' );
if ( $logo_id ) {
	$settings         = get_option( 'khwopring_settings', array() );
	$settings['logo'] = $logo_id;
	update_option( 'khwopring_settings', $settings );
}

// Principal photo
$principal = khreal_find( 'principal_message', 'Binod Prajapati' );
if ( $principal ) {
	$id = khreal_import( 'about-us.jpg', 'Principal Photo' );
	if ( $id ) set_post_thumbnail( $principal->ID, $id );
}

// Library facility
$library = khreal_find( 'facility', 'Library' );
if ( $library ) {
	$id = khreal_import( 'Lib.jpg', 'School Library' );
	if ( $id ) set_post_thumbnail( $library->ID, $id );
}

// Hero slides
$slide1 = khreal_find( 'hero_slide', 'Kingster Kindergarten' );
if ( $slide1 ) {
	$id = khreal_import( 'slider.jpg', 'Khwopring Open Futsal Tournament' );
	if ( $id ) {
		set_post_thumbnail( $slide1->ID, $id );
		update_field( 'background_image', $id, $slide1->ID );
	}
}
$slide2 = khreal_find( 'hero_slide', "Building Tomorrow's Leaders" );
if ( $slide2 ) {
	$id = khreal_import( 'khwopring-annual-02.jpg', 'Khwopring Annual Day' );
	if ( $id ) {
		set_post_thumbnail( $slide2->ID, $id );
		update_field( 'background_image', $id, $slide2->ID );
	}
}

// Gallery: replace the 6 seeded placeholders, then add extra real photos as new items.
$gallery_files = array(
	'keas.jpg', 'Neo-Fusion-7808-851-1365x560.jpg', 'Popup-1365x560.jpg',
	'iss-9.jpg', '20191115_145529.jpg', 'WhatsApp-Image-2023-06-05-at-2.23.22-PM-1.jpeg',
	'337710502_6040474612703941_105121178782751278_n-1365x560.jpg', 'extra.jpg',
	'khwopring-annual-05.jpg',
);
for ( $i = 1; $i <= 6; $i++ ) {
	$item = khreal_find( 'gallery_item', "Campus Life {$i}" );
	$file = $gallery_files[ $i - 1 ] ?? null;
	if ( $item && $file ) {
		$id = khreal_import( $file, "Campus Life {$i}" );
		if ( $id ) set_post_thumbnail( $item->ID, $id );
	}
}
$extra_titles = array( 'Campus Life 7', 'Campus Life 8', 'Campus Life 9' );
for ( $i = 0; $i < 3; $i++ ) {
	$file = $gallery_files[ 6 + $i ] ?? null;
	if ( ! $file ) continue;
	$existing = khreal_find( 'gallery_item', $extra_titles[ $i ] );
	if ( $existing ) continue;
	$post_id = wp_insert_post( array(
		'post_type'   => 'gallery_item',
		'post_title'  => $extra_titles[ $i ],
		'post_status' => 'publish',
	) );
	wp_set_object_terms( $post_id, array( 'Campus' ), 'gallery_category' );
	$id = khreal_import( $file, $extra_titles[ $i ] );
	if ( $id ) set_post_thumbnail( $post_id, $id );
	echo "Created gallery_item: {$extra_titles[$i]} (#{$post_id})\n";
}

// Achievements: update the 2 seeded ones, add a 3rd for the competition photo.
$ach1 = khreal_find( 'achievement', 'District Science Fair — 1st Place' );
if ( $ach1 ) {
	$id = khreal_import( 'Qualified.jpg', 'Achievement Certificate' );
	if ( $id ) set_post_thumbnail( $ach1->ID, $id );
}
$ach2 = khreal_find( 'achievement', '100% SEE Pass Rate' );
if ( $ach2 ) {
	$id = khreal_import( 'certification.jpg', 'Certificate Presentation' );
	if ( $id ) set_post_thumbnail( $ach2->ID, $id );
}
$ach3 = khreal_find( 'achievement', 'Spelling Competition Winners' );
if ( ! $ach3 ) {
	$ach3_id = wp_insert_post( array(
		'post_type'    => 'achievement',
		'post_title'   => 'Spelling Competition Winners',
		'post_content' => '<p>Students recognised for outstanding performance in the inter-house spelling competition.</p>',
		'post_status'  => 'publish',
	) );
	update_field( 'year', '2025', $ach3_id );
	$id = khreal_import( 'Compition-360x215.jpg', 'Spelling Competition' );
	if ( $id ) set_post_thumbnail( $ach3_id, $id );
	echo "Created achievement: Spelling Competition Winners (#{$ach3_id})\n";
}

// Teacher avatars (generic placeholders from the live site, not individual photos)
$female_avatar = khreal_import( 'team-f.png', 'Staff Avatar (Female)' );
$male_avatar   = khreal_import( 'team-m.png', 'Staff Avatar (Male)' );
$teacher_avatars = array(
	'Sunita Shrestha' => $female_avatar,
	'Anita Rai'       => $female_avatar,
	'Ramesh Maharjan' => $male_avatar,
);
foreach ( $teacher_avatars as $name => $avatar_id ) {
	$teacher = khreal_find( 'teacher', $name );
	if ( $teacher && $avatar_id ) {
		set_post_thumbnail( $teacher->ID, $avatar_id );
	}
}

echo "== Done ==\n";
