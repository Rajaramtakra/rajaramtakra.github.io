<?php
/**
 * One-off: bring the hero banner and Home page About content into parity
 * with the real khwopring.edu.np site — same 4 banner photos in the same
 * order, same About copy, same About photo. Also fixes an earlier seeding
 * mix-up where the real banner photos (keas/337710502/Popup/Neo-Fusion) had
 * been attached to Gallery items while two Gallery photos (slider.jpg,
 * khwopring-annual-02.jpg) had ended up on the hero slides instead.
 * Run via: wp eval-file wp-content/themes/khwopring/inc/seed/old-site-parity.php
 */

echo "== Aligning hero banner + About section with khwopring.edu.np ==\n";

// --- Hero Slide 1: real banner photo + real overlay text ---
// Existing post (was seeded as "A School Built on Community").
wp_update_post( array(
	'ID'         => 49,
	'post_title' => 'At The Khwopring ...',
) );
update_field( 'subtitle', 'Welcoming', 49 );
update_field( 'description', '', 49 );
update_field( 'button_text', '', 49 );
update_field( 'button_link', '', 49 );
update_field( 'background_image', 128, 49 ); // keas.jpg
set_post_thumbnail( 49, 128 );
wp_update_post( array( 'ID' => 49, 'menu_order' => 0 ) );
echo "Updated hero_slide #49 -> keas.jpg, 'Welcoming / At The Khwopring ...'\n";

// --- Hero Slide 2: real banner photo, no overlay text (matches old site) ---
wp_update_post( array(
	'ID'         => 51,
	'post_title' => '',
) );
update_field( 'subtitle', '', 51 );
update_field( 'description', '', 51 );
update_field( 'button_text', '', 51 );
update_field( 'button_link', '', 51 );
update_field( 'background_image', 135, 51 ); // 337710502_...-1365x560.jpg
set_post_thumbnail( 51, 135 );
wp_update_post( array( 'ID' => 51, 'menu_order' => 1 ) );
echo "Updated hero_slide #51 -> 337710502 annual day photo, no overlay text\n";

// --- Hero Slide 3 & 4: the remaining two real banner photos ---
function khparity_find_slide_by_image( $image_id ) {
	$q = new WP_Query( array(
		'post_type'      => 'hero_slide',
		'posts_per_page' => 1,
		'post_status'    => 'any',
		'meta_query'     => array( array( 'key' => 'background_image', 'value' => $image_id ) ),
	) );
	return $q->posts[0] ?? null;
}

$slide3 = khparity_find_slide_by_image( 130 );
if ( ! $slide3 ) {
	$slide3_id = wp_insert_post( array(
		'post_type'   => 'hero_slide',
		'post_title'  => '',
		'post_status' => 'publish',
		'menu_order'  => 2,
	) );
	update_field( 'background_image', 130, $slide3_id ); // Popup-1365x560.jpg
	set_post_thumbnail( $slide3_id, 130 );
	echo "Created hero_slide #{$slide3_id} -> Popup-1365x560.jpg\n";
} else {
	wp_update_post( array( 'ID' => $slide3->ID, 'menu_order' => 2 ) );
	echo "hero_slide for Popup-1365x560.jpg already exists (#{$slide3->ID})\n";
}

$slide4 = khparity_find_slide_by_image( 129 );
if ( ! $slide4 ) {
	$slide4_id = wp_insert_post( array(
		'post_type'   => 'hero_slide',
		'post_title'  => '',
		'post_status' => 'publish',
		'menu_order'  => 3,
	) );
	update_field( 'background_image', 129, $slide4_id ); // Neo-Fusion-7808-851-1365x560.jpg
	set_post_thumbnail( $slide4_id, 129 );
	echo "Created hero_slide #{$slide4_id} -> Neo-Fusion-7808-851-1365x560.jpg\n";
} else {
	wp_update_post( array( 'ID' => $slide4->ID, 'menu_order' => 3 ) );
	echo "hero_slide for Neo-Fusion-7808-851-1365x560.jpg already exists (#{$slide4->ID})\n";
}

// --- Home page About section: real copy + real photo, verbatim from the live site ---
$home_id = 46;
update_field( 'about_title', 'Welcome to Khwopring English Academy', $home_id );
update_field(
	'about_text',
	'<p>Welcome to Khwopring English Academy(Secondary), situated inn the heart of Historical city Bhaktapur. The purpose of our school is to educate the youth to take their productive place as leaders in the global community by offering our learners a comprehensive education from Nursery to Grade 10. We are a caring community, where students&#8217; needs are a priority and where traditional Nepalese and modern western educational values are respected and encourage to coexist. Khwopring offers a challenging academic environment emphasizing learning, as well as social and personal growth.</p><p>We know that the development of the school over the past few years has been significant. The future will build on these firm foundations focusing on the quality of school life, especially for the benefit of our learners.</p><p>At Khwopring English Academy, the educational community strives for excellence by preparing students for learning beyond their school years and assisting them to become lifelong learners, as well as helping them to be self-directed, realistic, and responsible decision makers when solving problems that they will encounter in our multicultural, ever-changing world. Ultimately, each learner will gain from their life at school according to the effort they apply.</p>',
	$home_id
);
update_field( 'about_image', 124, $home_id ); // about-us.jpg
echo "Updated Home page About section (#{$home_id}) -> real copy + about-us.jpg\n";

echo "== Done ==\n";
