<?php
/**
 * One-off: add a Chairperson entry alongside the existing Principal message
 * (both in the principal_message CPT, ordered via menu_order so the Home
 * page carousel and the About page's single-message use stay consistent),
 * and populate the new Vision / Mission & Goal / Objectives / History
 * fields on the Home page. All copy here is original — written fresh for
 * Khwopring, not adapted from any other site.
 * Run via: wp eval-file wp-content/themes/khwopring/inc/seed/leadership-and-info.php
 */

$existing = get_posts( array( 'post_type' => 'principal_message', 'title' => 'Binod Prajapati', 'posts_per_page' => 1 ) );
if ( $existing ) {
	wp_update_post( array( 'ID' => $existing[0]->ID, 'menu_order' => 0 ) );
	echo "Set Binod Prajapati menu_order=0\n";
}

$chair_existing = get_posts( array( 'post_type' => 'principal_message', 'title' => 'Dipendra Prajapati', 'posts_per_page' => 1, 'post_status' => 'any' ) );
if ( ! $chair_existing ) {
	$chair_id = wp_insert_post( array(
		'post_type'    => 'principal_message',
		'post_title'   => 'Dipendra Prajapati',
		'post_content' => "<p>Every school's story is written by the people who stay invested in it — teachers who go beyond the lesson plan, parents who trust us with their children's early years, and a community that never stopped believing Bhaktapur deserved a school built on quality rather than convenience.</p><p>As Chairman, my responsibility is to protect that trust: to make sure growth never comes at the cost of the things that made Khwopring worth choosing in the first place. I'm grateful for the support this school continues to receive, and committed to seeing it through to whatever comes next.</p>",
		'menu_order'   => 1,
		'post_status'  => 'publish',
	) );
	update_field( 'designation', 'Chairperson', $chair_id );
	set_post_thumbnail( $chair_id, 147 ); // Dipendra Prajapati photo, imported earlier for the Our Team roster.
	echo "Created Chairperson message: Dipendra Prajapati (#{$chair_id})\n";
} else {
	wp_update_post( array( 'ID' => $chair_existing[0]->ID, 'menu_order' => 1 ) );
	echo "Chairperson message already exists (#{$chair_existing[0]->ID})\n";
}

// --- Home page: Vision / Mission & Goal / Objectives / History ---
$home = get_page_by_path( 'home' );
if ( $home ) {
	update_field( 'vision_text', '<p>An environment where every child in Bhaktapur can get a quality education, delivered with the same care whether a family pays full fees or needs support to do so.</p>', $home->ID );

	update_field( 'mission_text', "<p>To carry every student from Nursery through Grade 10 with the English fluency, discipline, and confidence to succeed beyond the classroom — while staying rooted in the values of the community that built this school. Every graduating class should be more capable, more curious, and more ready for what comes next than the one before it.</p>", $home->ID );

	update_field( 'objectives_text', '<ul>
<li>Keep class sizes small enough that no student\'s progress goes unnoticed.</li>
<li>Build English fluency and computer literacy from an early grade.</li>
<li>Keep quality education affordable for families across Bhaktapur.</li>
<li>Involve parents and the local community in the life of the school, not just its funding.</li>
</ul>', $home->ID );

	update_field( 'history_text', '<p>Khwopring English Secondary School was founded in 2000 A.D. by a group of socially aware youths from Bhaktapur who believed the city deserved a school built on quality rather than convenience. What began as a small community initiative has grown, over two decades, into a Nursery-to-Grade-10 institution — without ever losing sight of the priority its founders started with: students first.</p>', $home->ID );

	echo "Updated Home page vision/mission/objectives/history.\n";
} else {
	echo "Home page not found.\n";
}

echo "== Done ==\n";
