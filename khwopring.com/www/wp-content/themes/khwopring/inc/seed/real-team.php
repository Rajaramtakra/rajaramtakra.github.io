<?php
/**
 * One-off: replace the fictional teacher/team placeholders with the real
 * management committee & staff roster from khwopring.edu.np's "Our Team"
 * page, and add a few more real gallery photos found there.
 * Run via: wp eval-file wp-content/themes/khwopring/inc/seed/real-team.php
 */

require_once ABSPATH . 'wp-admin/includes/media.php';
require_once ABSPATH . 'wp-admin/includes/file.php';
require_once ABSPATH . 'wp-admin/includes/image.php';

define( 'KH_STAGE_DIR2', 'D:/wamp/www/Khwopring.com.np/.tools/real-images/' );

function khreal2_import( $filename, $title ) {
	$path = KH_STAGE_DIR2 . $filename;
	if ( ! file_exists( $path ) ) {
		echo "MISSING: {$filename}\n";
		return 0;
	}
	$tmp_copy = wp_tempnam( $filename );
	copy( $path, $tmp_copy );
	$attachment_id = media_handle_sideload( array( 'name' => $filename, 'tmp_name' => $tmp_copy ), 0, $title );
	if ( is_wp_error( $attachment_id ) ) {
		echo "FAILED {$filename}: " . $attachment_id->get_error_message() . "\n";
		return 0;
	}
	echo "Imported {$filename} -> #{$attachment_id}\n";
	return $attachment_id;
}

// --- Remove the fictional teacher roster ---
$old_teachers = get_posts( array( 'post_type' => 'teacher', 'posts_per_page' => -1, 'post_status' => 'any' ) );
foreach ( $old_teachers as $t ) {
	wp_delete_post( $t->ID, true );
	echo "Deleted fictional teacher: {$t->post_title}\n";
}

// --- Real team roster (name, designation, photo file) ---
$roster = array(
	array( 'Dipendra Prajapati', 'Chairman', 'Dipendra-Sir.jpg' ),
	array( 'Ram Prasad Prajapati', 'Past Chairman', 'Ram-Prasad-Sir.jpg' ),
	array( 'Binod Prajapati', 'Principal', 'Binod-Sir.jpg' ),
	array( 'Niranjan Prajapati', 'Vice Principal', 'Niranjan-Sir.jpg' ),
	array( 'Krishna Sundar Prajapati', 'Manager', 'Krishna-Sundar-Sir.jpg' ),
	array( 'Sundar Prajapati', 'Admin Officer', 'Sundar-Sir.jpg' ),
	array( 'Kyarinda Khayargoli', 'Kindergarten Incharge', 'Kyarinda-Teacher.jpg' ),
	array( 'Bishnu Prashad Prajapati', 'Member', 'Bishnu-Prasad-Sir.jpg' ),
	array( 'Shamser Prajapati', 'Member', 'Shamsher-Sir.jpg' ),
	array( 'Meera Prajapati', 'Member', 'Meera-Maam.jpg' ),
);

foreach ( $roster as $i => $member ) {
	list( $name, $designation, $file ) = $member;
	$post_id = wp_insert_post( array(
		'post_type'    => 'teacher',
		'post_title'   => $name,
		'menu_order'   => $i,
		'post_status'  => 'publish',
	) );
	update_field( 'designation', $designation, $post_id );
	$img_id = khreal2_import( $file, $name );
	if ( $img_id ) set_post_thumbnail( $post_id, $img_id );
	echo "Created team member: {$name} ({$designation}) #{$post_id}\n";
}

// --- Extra real gallery photos ---
$extra_gallery = array(
	'1_visit-07-e1695635794410.jpg'                 => 'School Visit',
	'compressed_IMG_6570.jpg'                        => 'Campus Event',
	'isc02.jpg'                                      => 'Inter-School Competition',
	'WhatsApp-Image-2026-05-24-at-10.26.34-AM.jpeg'  => 'Campus Moment',
	'IMG_9327-scaled.jpg'                             => 'School Assembly',
);
$n = 10;
foreach ( $extra_gallery as $file => $title ) {
	$post_id = wp_insert_post( array(
		'post_type'   => 'gallery_item',
		'post_title'  => "Campus Life {$n}",
		'post_status' => 'publish',
	) );
	wp_set_object_terms( $post_id, array( 'Campus' ), 'gallery_category' );
	$img_id = khreal2_import( $file, $title );
	if ( $img_id ) set_post_thumbnail( $post_id, $img_id );
	echo "Created gallery_item: Campus Life {$n} (#{$post_id})\n";
	$n++;
}

echo "== Done ==\n";
