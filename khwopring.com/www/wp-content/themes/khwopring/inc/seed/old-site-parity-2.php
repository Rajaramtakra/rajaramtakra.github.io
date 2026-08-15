<?php
/**
 * One-off, part 2 of the khwopring.edu.np content parity pass: replaces the
 * originally-written About page, Principal message, and Chairperson message
 * copy with the real text from the live site's Introduction, Message From
 * Principal, and Message from Chairperson pages (English copy only — the
 * live site also has a parallel Nepali version on each of those pages that
 * this frontend has no i18n path for yet).
 *
 * Fields with no real equivalent on the live site (Home page Vision /
 * Mission / Objectives / History, Admission CTA) are deliberately left
 * untouched — khwopring.edu.np's Admission page is just a bare application
 * form with no marketing copy, and its "goals" section is empty.
 *
 * Run via: wp eval-file wp-content/themes/khwopring/inc/seed/old-site-parity-2.php
 */

// --- About page (generic page ACF group) ---
$about_id = 111;
update_field( 'hero_title', 'Introduction', $about_id );
update_field( 'hero_subtitle', '', $about_id );
update_field(
	'content_body',
	'<p>Welcome to Khwopring English Academy(Secondary), situated inn the heart of Historical city Bhaktapur. The purpose of our school is to educate the youth to take their productive place as leaders in the global community by offering our learners a comprehensive education from Nursery to Grade 10. We are a caring community, where students&#8217; needs are a priority and where traditional Nepalese and modern western educational values are respected and encourage to coexist. Khwopring offers a challenging academic environment emphasizing learning, as well as social and personal growth.</p><p>We know that the development of the school over the past few years has been significant. The future will build on these firm foundations focusing on the quality of school life, especially for the benefit of our learners.</p><p>At Khwopring English Academy, the educational community strives for excellence by preparing students for learning beyond their school years and assisting them to become lifelong learners, as well as helping them to be self-directed, realistic, and responsible decision makers when solving problems that they will encounter in our multicultural, ever-changing world. Ultimately, each learner will gain from their life at school according to the effort they apply.</p><p>We strongly believe in the importance of teachers, parents, and administrators collaborating and communicating openly and frequently. We continually improve the quality of tools of communication and education. You are encouraged to regularly check our school bulletin, school souvenir, website and read about our exciting academic and co-curricular activities. We look forward to serving you and your children over the coming years. Interested parents are encouraged to contact our school and to ask questions they may have regarding our school and the programmes we offer.</p><p>We look forward to meeting you.</p>',
	$about_id
);
echo "Updated About page (#{$about_id}) -> real Introduction copy\n";

// --- Principal message: real letter from Binod Prajapati ---
wp_update_post( array(
	'ID'           => 57,
	'post_content' => '<p>Dear Parents / Guardians,</p><p>Since its establishment in 2000 AD, the school has been rendering its true and sincere service in the field of quality education from kindergarten to secondary level. Quality education followed by the motto of transforming each pupil into Nobel citizens for healthy social life has been the focus of this institution.</p><p>&#8220;A healthy mind resides in a healthy body&#8221;, is an old and famous saying. To develop a healthy mind in a healthy body, indoor and outdoor activities are provided to the learners in the school. Various co-curricular as well as extracurricular activities for examples creative writing workshop, story writing workshop, quiz contest, talent show, poetry recitations, music and dance classes, dance competition, various sports activities, writing of articles of the school magazine etc. are conducted to allow the students to explore their talents and for the overall development.</p><p>Our institution vision is to work in partnership with our society, parents, energetic and highly motivated staffs, disciplined students to create positive and inclusive environment for high quality learning and teaching where everyone is respected and valued. Similarly our institution has always given a high priority for safe learning environment as well as non violence teaching too. It has paved along way for its development and it is as the incomparable culture of Khwopring English Academy, since its establishment.</p><p>Finally, we are proud to give your child the lifelong gift of knowledge and we would like to welcome all our respected parents, well wishers, viewers in our school premises and assure you to provide better facilities, well managed academic environment for the quality education and resources for the quality education and resources for all round development of students.</p>',
) );
echo "Updated Principal message (#57) -> real letter\n";

// --- Chairperson message: real letter from Dipendra Prajapati ---
wp_update_post( array(
	'ID'           => 188,
	'post_content' => "<p>Dear Parents / Guardians,</p><p>Khwopring English Academy School (KEAS) Foundation has always been at the forefront of education ever since its inception. Academic institutions have been offering a wide range of academic programmes from pre-school to university for the last three decades, and Khwopring has been in operation since 2000 AD.</p><p>Today, schools are operating in an environment that is ever-changing, complex and digitalized. We embrace a challenging role &#8211; preparing young learners for tomorrow's world which is undergoing rapid social, economic and technological transformation. Given such a dynamic situation, we have adopted the latest pedagogic principles viz. enquiry, activity-based and problem-solving approaches to classroom teaching and learning, and will continue to evolve in the days ahead. Likewise, for the holistic development of our students, we are also strengthening our arenas of extra-curricular activities. In addition, safety and well-being of our students are our prime concern. We give it the utmost priority to protect our children from any form of violence, abuse and discrimination.</p><p>I would also like to partner with our parents / guardians, and seek their active participation and continued support in creating a safe and stimulating learning environment for our children. I reiterate that we are committed to providing our students with inclusive and holistic education in a safe and positive environment. I appreciate, and express my heartfelt gratitude to all our parents for putting trust in us for educating their children.</p><p>As always, I look forward to welcoming students and parents / guardians to Khwopring English Academy.</p>",
) );
echo "Updated Chairperson message (#188) -> real letter\n";

echo "== Done ==\n";
