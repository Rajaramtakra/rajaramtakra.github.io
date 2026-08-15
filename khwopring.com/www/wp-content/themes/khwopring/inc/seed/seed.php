<?php
/**
 * One-off dev content seeder. Run once via:
 *   wp eval-file wp-content/themes/khwopring/inc/seed/seed.php
 * Populates every CPT with a few real (not mock) posts so the React frontend
 * has genuine WordPress content to render against, plus site settings, the
 * Home page + ACF fields, and the primary nav menu.
 */

require_once ABSPATH . 'wp-admin/includes/media.php';
require_once ABSPATH . 'wp-admin/includes/file.php';
require_once ABSPATH . 'wp-admin/includes/image.php';

function khseed_image( $seed, $w = 1200, $h = 800 ) {
	$url = "https://picsum.photos/seed/{$seed}/{$w}/{$h}.jpg";
	$id  = media_sideload_image( $url, 0, null, 'id' );
	return is_wp_error( $id ) ? 0 : $id;
}

function khseed_post( $post_type, $title, $content = '', $meta = array(), $image_seed = null, $terms = array() ) {
	$existing = get_page_by_title( $title, OBJECT, $post_type );
	if ( $existing ) {
		return $existing->ID;
	}
	$post_id = wp_insert_post( array(
		'post_type'   => $post_type,
		'post_title'  => $title,
		'post_content'=> $content,
		'post_status' => 'publish',
	) );
	foreach ( $meta as $key => $value ) {
		update_field( $key, $value, $post_id );
	}
	if ( $image_seed ) {
		$img_id = khseed_image( $image_seed );
		if ( $img_id ) {
			set_post_thumbnail( $post_id, $img_id );
		}
	}
	foreach ( $terms as $taxonomy => $term_names ) {
		wp_set_object_terms( $post_id, $term_names, $taxonomy );
	}
	echo "Created {$post_type}: {$title} (#{$post_id})\n";
	return $post_id;
}

echo "== Seeding Khwopring content ==\n";

// --- Home page + static front page ---
$home_id = khseed_post( 'page', 'Home' );
update_option( 'show_on_front', 'page' );
update_option( 'page_on_front', $home_id );
update_field( 'about_title', 'A caring community in the heart of a historical city.', $home_id );
update_field( 'about_text', '<p>Khwopring English Academy sits in Libali, Bhaktapur — a city that has taught the world about craft, patience, and continuity for centuries. We carry a comparable purpose: preparing learners from Nursery to Grade 10 to take their place as leaders in a global community, without setting aside where they come from.</p><p>Traditional Nepalese values and modern educational practice are asked to coexist here, not compete. Students\' needs come first, and the school\'s growth over the past two decades has been built on that single priority.</p>', $home_id );
$about_img = khseed_image( 'khwopring-about', 900, 900 );
if ( $about_img ) update_field( 'about_image', $about_img, $home_id );
update_field( 'admission_cta_title', 'Apply for Admission', $home_id );
update_field( 'admission_cta_description', "We don't just give students an education and a classroom that sets them up to pass an exam. We help them build the confidence, discipline, and English fluency to succeed well beyond Grade 10 — and to carry Khwopa's values with them wherever they go.", $home_id );
$cta_img = khseed_image( 'khwopring-admission', 900, 700 );
if ( $cta_img ) update_field( 'admission_cta_image', $cta_img, $home_id );
update_field( 'admission_cta_button_label', 'Apply Now', $home_id );
update_field( 'admission_cta_button_link', '/admission', $home_id );

// --- Hero Slides ---
khseed_post( 'hero_slide', 'Kingster Kindergarten', '', array(
	'subtitle'    => 'Kingster Kindergarten',
	'description' => 'Take a tour in Kingster and you will find the best school in the state. The video will take you to every place in this school.',
	'button_text' => 'Take A Tour',
	'button_link' => '/about',
	'overlay_color' => '#0f2038',
), 'hero-1', array() );

khseed_post( 'hero_slide', 'Building Tomorrow\'s Leaders', '', array(
	'subtitle'    => "Building Tomorrow's Leaders",
	'description' => 'From Nursery to Grade 10, we help every student build confidence, discipline, and the English fluency to succeed well beyond school.',
	'button_text' => 'Apply Now',
	'button_link' => '/admission',
	'overlay_color' => '#7a2e1d',
), 'hero-2', array() );

// --- Statistics ---
khseed_post( 'statistic', 'Total Students', '', array( 'icon' => 'icon-graduation-cap', 'number' => 1081, 'suffix' => '', 'label' => 'Total Students' ) );
khseed_post( 'statistic', 'Years in Service', '', array( 'icon' => 'icon-star', 'number' => 24, 'suffix' => '+', 'label' => 'Years In Service' ) );
khseed_post( 'statistic', 'Awards Won', '', array( 'icon' => 'icon-award', 'number' => 256, 'suffix' => '', 'label' => 'Awards Won' ) );
khseed_post( 'statistic', 'Certified Teachers', '', array( 'icon' => 'icon-chalkboard', 'number' => 200, 'suffix' => '+', 'label' => 'Certified Teachers' ) );

// --- Principal Message ---
khseed_post( 'principal_message', 'Binod Prajapati', '<p>History is not created in a day. It\'s been just half a decade since Bagiswori College has been established, it has become a choice of a number of students. Providing quality education at an affordable fee is our prime objective and we believe in our endeavour.</p>', array( 'designation' => 'Principal' ), 'principal-1' );

// --- News ---
khseed_post( 'news', 'खप्रिङ खाद्य महोत्सव २०८२ — Khwopring Food Carnival', '<p>A community food festival bringing students, families, and staff together on campus.</p>', array(), 'news-1', array( 'news_category' => array( 'Events' ) ) );
khseed_post( 'news', 'SEE Felicitation Program', '<p>Honouring another year of successful SEE graduates from Khwopring.</p>', array(), 'news-2', array( 'news_category' => array( 'Academics' ) ) );
khseed_post( 'news', 'Admissions for the Next Intake Are Open', '<p>Nursery to Grade 10 seats available — enquire before seats fill.</p>', array(), 'news-3', array( 'news_category' => array( 'Admissions' ) ) );

// --- Events ---
khseed_post( 'event', 'Khwopring Food Carnival 2026', '<p>A community food festival bringing students, families, and staff together on campus.</p>', array( 'start_date' => '2026-05-26', 'end_date' => '2026-05-26', 'location' => 'School Campus' ), 'event-1', array( 'event_category' => array( 'Community' ) ) );
khseed_post( 'event', 'SEE Felicitation Program', '<p>Honouring another year of successful SEE graduates from Khwopring.</p>', array( 'start_date' => '2026-02-02', 'end_date' => '2026-02-02', 'location' => 'School Auditorium' ), 'event-2', array( 'event_category' => array( 'Academics' ) ) );
khseed_post( 'event', 'Annual Sports Day', '<p>A full day of inter-house sporting competitions for all grades.</p>', array( 'start_date' => '2026-09-10', 'end_date' => '2026-09-10', 'location' => 'School Grounds' ), 'event-3', array( 'event_category' => array( 'Sports' ) ) );

// --- Gallery ---
foreach ( range( 1, 6 ) as $i ) {
	khseed_post( 'gallery_item', "Campus Life {$i}", '', array(), "gallery-{$i}", array( 'gallery_category' => array( 'Campus' ) ) );
}

// --- Facilities ---
khseed_post( 'facility', 'Modern Classrooms', '<p>Bright, well-ventilated classrooms designed for focused learning.</p>', array( 'icon' => 'icon-classroom' ), 'facility-1' );
khseed_post( 'facility', 'Science & Computer Labs', '<p>Fully equipped labs for hands-on science and computing practice.</p>', array( 'icon' => 'icon-lab' ), 'facility-2' );
khseed_post( 'facility', 'Sports & Recreation', '<p>Dedicated sports grounds and equipment for a balanced school life.</p>', array( 'icon' => 'icon-sports' ), 'facility-3' );
khseed_post( 'facility', 'Library', '<p>A quiet, well-stocked library open to every grade.</p>', array( 'icon' => 'icon-library' ), 'facility-4' );

// --- Teachers ---
khseed_post( 'teacher', 'Sunita Shrestha', '<p>Over a decade of experience teaching primary-level English and Mathematics.</p>', array( 'designation' => 'Senior Teacher', 'subject' => 'English', 'email' => 'sunita@khwopring.edu.np' ), 'teacher-1' );
khseed_post( 'teacher', 'Ramesh Maharjan', '<p>Passionate about making science approachable for every student.</p>', array( 'designation' => 'Science Teacher', 'subject' => 'Science', 'email' => 'ramesh@khwopring.edu.np' ), 'teacher-2' );
khseed_post( 'teacher', 'Anita Rai', '<p>Focused on building strong foundations in early-grade numeracy.</p>', array( 'designation' => 'Primary Teacher', 'subject' => 'Mathematics', 'email' => 'anita@khwopring.edu.np' ), 'teacher-3' );

// --- Testimonials ---
khseed_post( 'testimonial', 'Sunil Prajapati', '<p>"History is not created in a day. It has been just half a decade since the college was established, it has become a choice of a number of students."</p>', array( 'role' => 'Chairperson', 'rating' => 5 ), 'testimonial-1' );
khseed_post( 'testimonial', 'Parent, Grade 8', '<p>"My daughter has grown so much in confidence and discipline since joining Khwopring."</p>', array( 'role' => 'Parent', 'rating' => 5 ), 'testimonial-2' );

// --- Achievements ---
khseed_post( 'achievement', 'District Science Fair — 1st Place', '<p>Our Grade 9 team took first place at the district-level science fair.</p>', array( 'year' => '2025' ), 'achievement-1' );
khseed_post( 'achievement', '100% SEE Pass Rate', '<p>Every Grade 10 student who sat the SEE exam this year passed.</p>', array( 'year' => '2026' ), 'achievement-2' );

// --- Notices ---
khseed_post( 'notice', 'Admissions Open for 2026 Intake', '<p>Nursery to Grade 10 seats now open. Enquire at the school office.</p>', array( 'notice_date' => '2026-07-01', 'is_important' => true ) );
khseed_post( 'notice', 'Half-Day Schedule — Monsoon Break', '<p>Classes will run half-day for the coming week due to seasonal flooding advisories.</p>', array( 'notice_date' => '2026-07-20', 'is_important' => false ) );

// --- Admission Notice ---
khseed_post( 'admission_notice', 'Intake 2026 Applications Now Open', '<p>Apply now for Nursery to Grade 10 seats. Limited seats remain.</p>', array( 'intake_year' => '2026', 'deadline' => '2026-08-31', 'button_link' => '/admission' ), 'admission-1' );

// --- Site settings ---
update_option( 'khwopring_settings', array(
	'logo'             => 0,
	'address'          => 'Libali-8, Bhaktapur, Nepal',
	'phone'            => '+977-01-6616416',
	'phone_alt'        => '+977-9851075450',
	'email'            => 'khwopringeng@gmail.com',
	'office_hours'     => 'Libali, Bhaktapur — Sun-Fri, 10:00-16:00',
	'facebook_url'     => 'https://facebook.com',
	'instagram_url'    => '',
	'youtube_url'      => '',
	'linkedin_url'     => '',
	'twitter_url'      => '',
	'erp_label'        => 'ERP',
	'erp_link'         => 'https://erp.khwopring.edu.np',
	'google_map_embed' => '',
) );

// --- Primary nav menu ---
$menu_name = 'Primary Navigation';
$menu_id   = wp_get_nav_menu_object( $menu_name );
if ( ! $menu_id ) {
	$menu_id = wp_create_nav_menu( $menu_name );
} else {
	$menu_id = $menu_id->term_id;
}
$locations = get_theme_mod( 'nav_menu_locations', array() );
$locations['primary'] = $menu_id;
set_theme_mod( 'nav_menu_locations', $locations );

$nav_items = array(
	'Home'          => '/',
	'About'         => '/about',
	'Academics'     => '/academics',
	'Facilities'    => '/facilities',
	'News & Events' => '/news',
	'Gallery'       => '/gallery',
	'Contact'       => '/contact',
);
$existing_items = wp_get_nav_menu_items( $menu_id );
if ( empty( $existing_items ) ) {
	foreach ( $nav_items as $title => $url ) {
		wp_update_nav_menu_item( $menu_id, 0, array(
			'menu-item-title'  => $title,
			'menu-item-url'    => $url,
			'menu-item-status' => 'publish',
		) );
	}
	echo "Created nav menu items.\n";
}

// --- Generic content pages ---
$about_page = khseed_post( 'page', 'About' );
update_field( 'hero_title', 'About Khwopring', $about_page );
update_field( 'hero_subtitle', 'Two decades of building on quality of school life', $about_page );
$about_hero_img = khseed_image( 'about-hero', 1920, 700 );
if ( $about_hero_img ) update_field( 'hero_image', $about_hero_img, $about_page );
update_field( 'content_body', '<p>Khwopring English Academy was founded in 2000 A.D. by socially aware youths of Bhaktapur who believed the city deserved a school built on quality rather than convenience. Two decades later, that founding priority — students first — still shapes every decision the school makes.</p><p>From Nursery to Grade 10, we prepare learners to take their place as leaders in a global community without setting aside where they come from. Traditional Nepalese values and modern educational practice are asked to coexist here, not compete.</p>', $about_page );

$academics_page = khseed_post( 'page', 'Academics' );
update_field( 'hero_title', 'Academics', $academics_page );
update_field( 'hero_subtitle', 'A curriculum built for Nursery through Grade 10', $academics_page );
$academics_hero_img = khseed_image( 'academics-hero', 1920, 700 );
if ( $academics_hero_img ) update_field( 'hero_image', $academics_hero_img, $academics_page );
update_field( 'content_body', "<p>Our curriculum follows the national framework from Nursery through Grade 10, layered with dedicated English-fluency instruction, computer literacy from an early grade, and continuous assessment rather than exam-only evaluation.</p><p>Class sizes are kept small enough that teachers can track each student's progress individually, and subject teachers coordinate closely across grades so foundational gaps get caught early rather than compounding toward the SEE exams.</p>", $academics_page );

$admission_page = khseed_post( 'page', 'Admission' );
update_field( 'hero_title', 'Admission', $admission_page );
update_field( 'hero_subtitle', 'Applications for the 2026 intake are open', $admission_page );
$admission_hero_img = khseed_image( 'admission-hero', 1920, 700 );
if ( $admission_hero_img ) update_field( 'hero_image', $admission_hero_img, $admission_page );
update_field( 'content_body', '<p>We don\'t just give students an education and a classroom that sets them up to pass an exam. We help them build the confidence, discipline, and English fluency to succeed well beyond Grade 10 — and to carry Khwopring\'s values with them wherever they go.</p><p>Seats are available from Nursery to Grade 10 for the 2026 intake. Enquire at the school office or submit an enquiry below and our admissions team will be in touch.</p>', $admission_page );

$faq_page = khseed_post( 'page', 'FAQ' );
update_field( 'hero_title', 'Frequently Asked Questions', $faq_page );
update_field( 'hero_subtitle', "Answers to what parents ask us most", $faq_page );

// --- FAQ items ---
khseed_post( 'faq_item', 'What grades does Khwopring teach?', '<p>We teach Nursery through Grade 10, following the national curriculum with additional English-fluency and computer literacy instruction at every grade.</p>' );
khseed_post( 'faq_item', 'When do admissions open for the next academic year?', '<p>Admissions typically open mid-year for the following intake. Check the Admission page or Notices for exact dates, as they can shift slightly year to year.</p>' );
khseed_post( 'faq_item', 'Does the school provide transportation?', '<p>Yes, school transportation is available for most routes within Bhaktapur. Contact the school office to confirm coverage for your area.</p>' );
khseed_post( 'faq_item', 'What documents are required to apply?', '<p>A copy of the student\'s birth certificate, previous school transcripts (if applicable), and a passport-size photo. The admissions office will confirm any additional requirements for your child\'s grade.</p>' );
khseed_post( 'faq_item', 'Is there a uniform policy?', '<p>Yes, students are expected to wear the school uniform on all regular school days. Uniforms can be purchased through the school office.</p>' );

echo "== Seeding complete ==\n";
