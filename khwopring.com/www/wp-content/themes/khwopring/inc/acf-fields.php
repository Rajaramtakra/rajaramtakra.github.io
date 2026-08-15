<?php
/**
 * ACF (free) field groups. Only plain field types are used — no repeater,
 * flexible content, or options pages — so this works fully on free ACF and
 * needs zero changes if/when ACF Pro is installed later.
 */

defined( 'ABSPATH' ) || exit;

function khwopring_register_acf_fields() {
	if ( ! function_exists( 'acf_add_local_field_group' ) ) {
		return;
	}

	// Hero Slide
	acf_add_local_field_group( array(
		'key'      => 'group_hero_slide',
		'title'    => 'Hero Slide Details',
		'fields'   => array(
			array( 'key' => 'field_hs_subtitle', 'name' => 'subtitle', 'label' => 'Subtitle', 'type' => 'text' ),
			array( 'key' => 'field_hs_description', 'name' => 'description', 'label' => 'Description', 'type' => 'textarea', 'rows' => 3 ),
			array( 'key' => 'field_hs_button_text', 'name' => 'button_text', 'label' => 'Button Text', 'type' => 'text' ),
			array( 'key' => 'field_hs_button_link', 'name' => 'button_link', 'label' => 'Button Link', 'type' => 'text', 'placeholder' => '/admission or https://example.com' ),
			array( 'key' => 'field_hs_background_image', 'name' => 'background_image', 'label' => 'Background Image', 'type' => 'image', 'return_format' => 'array', 'preview_size' => 'large' ),
			array( 'key' => 'field_hs_overlay_color', 'name' => 'overlay_color', 'label' => 'Overlay Color', 'type' => 'color_picker' ),
		),
		'location' => array( array( array( 'param' => 'post_type', 'operator' => '==', 'value' => 'hero_slide' ) ) ),
	) );

	// Event
	acf_add_local_field_group( array(
		'key'      => 'group_event',
		'title'    => 'Event Details',
		'fields'   => array(
			array( 'key' => 'field_ev_start_date', 'name' => 'start_date', 'label' => 'Start Date', 'type' => 'date_picker', 'display_format' => 'F j, Y', 'return_format' => 'Y-m-d' ),
			array( 'key' => 'field_ev_end_date', 'name' => 'end_date', 'label' => 'End Date', 'type' => 'date_picker', 'display_format' => 'F j, Y', 'return_format' => 'Y-m-d' ),
			array( 'key' => 'field_ev_location', 'name' => 'location', 'label' => 'Location', 'type' => 'text' ),
		),
		'location' => array( array( array( 'param' => 'post_type', 'operator' => '==', 'value' => 'event' ) ) ),
	) );

	// Teacher
	acf_add_local_field_group( array(
		'key'      => 'group_teacher',
		'title'    => 'Teacher Details',
		'fields'   => array(
			array( 'key' => 'field_tc_designation', 'name' => 'designation', 'label' => 'Designation', 'type' => 'text' ),
			array( 'key' => 'field_tc_subject', 'name' => 'subject', 'label' => 'Subject', 'type' => 'text' ),
			array( 'key' => 'field_tc_email', 'name' => 'email', 'label' => 'Email', 'type' => 'email' ),
		),
		'location' => array( array( array( 'param' => 'post_type', 'operator' => '==', 'value' => 'teacher' ) ) ),
	) );

	// Testimonial
	acf_add_local_field_group( array(
		'key'      => 'group_testimonial',
		'title'    => 'Testimonial Details',
		'fields'   => array(
			array( 'key' => 'field_ts_role', 'name' => 'role', 'label' => 'Role', 'type' => 'text' ),
			array( 'key' => 'field_ts_rating', 'name' => 'rating', 'label' => 'Rating (1-5)', 'type' => 'number', 'min' => 1, 'max' => 5, 'default_value' => 5 ),
		),
		'location' => array( array( array( 'param' => 'post_type', 'operator' => '==', 'value' => 'testimonial' ) ) ),
	) );

	// Notice
	acf_add_local_field_group( array(
		'key'      => 'group_notice',
		'title'    => 'Notice Details',
		'fields'   => array(
			array( 'key' => 'field_nt_date', 'name' => 'notice_date', 'label' => 'Date', 'type' => 'date_picker', 'display_format' => 'F j, Y', 'return_format' => 'Y-m-d' ),
			array( 'key' => 'field_nt_pdf', 'name' => 'pdf_file', 'label' => 'PDF File', 'type' => 'file', 'return_format' => 'array' ),
			array( 'key' => 'field_nt_important', 'name' => 'is_important', 'label' => 'Important', 'type' => 'true_false', 'ui' => 1 ),
		),
		'location' => array( array( array( 'param' => 'post_type', 'operator' => '==', 'value' => 'notice' ) ) ),
	) );

	// Facility
	acf_add_local_field_group( array(
		'key'      => 'group_facility',
		'title'    => 'Facility Details',
		'fields'   => array(
			array( 'key' => 'field_fc_icon', 'name' => 'icon', 'label' => 'Icon (icomoon class)', 'type' => 'text', 'placeholder' => 'icon-classroom' ),
		),
		'location' => array( array( array( 'param' => 'post_type', 'operator' => '==', 'value' => 'facility' ) ) ),
	) );

	// Achievement
	acf_add_local_field_group( array(
		'key'      => 'group_achievement',
		'title'    => 'Achievement Details',
		'fields'   => array(
			array( 'key' => 'field_ac_year', 'name' => 'year', 'label' => 'Year', 'type' => 'text' ),
		),
		'location' => array( array( array( 'param' => 'post_type', 'operator' => '==', 'value' => 'achievement' ) ) ),
	) );

	// Admission Notice
	acf_add_local_field_group( array(
		'key'      => 'group_admission_notice',
		'title'    => 'Admission Notice Details',
		'fields'   => array(
			array( 'key' => 'field_ad_intake_year', 'name' => 'intake_year', 'label' => 'Intake Year', 'type' => 'text' ),
			array( 'key' => 'field_ad_deadline', 'name' => 'deadline', 'label' => 'Deadline', 'type' => 'date_picker', 'display_format' => 'F j, Y', 'return_format' => 'Y-m-d' ),
			array( 'key' => 'field_ad_button_link', 'name' => 'button_link', 'label' => 'Button Link', 'type' => 'text', 'placeholder' => '/admission or https://example.com' ),
		),
		'location' => array( array( array( 'param' => 'post_type', 'operator' => '==', 'value' => 'admission_notice' ) ) ),
	) );

	// Statistic
	acf_add_local_field_group( array(
		'key'      => 'group_statistic',
		'title'    => 'Statistic Details',
		'fields'   => array(
			array( 'key' => 'field_st_icon', 'name' => 'icon', 'label' => 'Icon (icomoon class)', 'type' => 'text' ),
			array( 'key' => 'field_st_number', 'name' => 'number', 'label' => 'Number', 'type' => 'number', 'required' => 1 ),
			array( 'key' => 'field_st_suffix', 'name' => 'suffix', 'label' => 'Suffix', 'type' => 'text', 'placeholder' => '+' ),
			array( 'key' => 'field_st_label', 'name' => 'label', 'label' => 'Label', 'type' => 'text' ),
		),
		'location' => array( array( array( 'param' => 'post_type', 'operator' => '==', 'value' => 'statistic' ) ) ),
	) );

	// Principal Message
	acf_add_local_field_group( array(
		'key'      => 'group_principal_message',
		'title'    => 'Principal Message Details',
		'fields'   => array(
			array( 'key' => 'field_pm_designation', 'name' => 'designation', 'label' => 'Designation', 'type' => 'text', 'default_value' => 'Principal' ),
		),
		'location' => array( array( array( 'param' => 'post_type', 'operator' => '==', 'value' => 'principal_message' ) ) ),
	) );

	// Home Page Content — attached to whichever Page is set as the static front page.
	acf_add_local_field_group( array(
		'key'      => 'group_home_page_content',
		'title'    => 'Home Page Content',
		'fields'   => array(
			array( 'key' => 'field_hp_about_title', 'name' => 'about_title', 'label' => 'About Title', 'type' => 'text' ),
			array( 'key' => 'field_hp_about_text', 'name' => 'about_text', 'label' => 'About Text', 'type' => 'wysiwyg', 'tabs' => 'visual', 'media_upload' => 0 ),
			array( 'key' => 'field_hp_about_image', 'name' => 'about_image', 'label' => 'About Image', 'type' => 'image', 'return_format' => 'array' ),
			array( 'key' => 'field_hp_cta_title', 'name' => 'admission_cta_title', 'label' => 'Admission CTA Title', 'type' => 'text' ),
			array( 'key' => 'field_hp_cta_description', 'name' => 'admission_cta_description', 'label' => 'Admission CTA Description', 'type' => 'textarea', 'rows' => 3 ),
			array( 'key' => 'field_hp_cta_image', 'name' => 'admission_cta_image', 'label' => 'Admission CTA Image', 'type' => 'image', 'return_format' => 'array' ),
			array( 'key' => 'field_hp_cta_button_label', 'name' => 'admission_cta_button_label', 'label' => 'Admission CTA Button Label', 'type' => 'text' ),
			array( 'key' => 'field_hp_cta_button_link', 'name' => 'admission_cta_button_link', 'label' => 'Admission CTA Button Link', 'type' => 'text', 'placeholder' => '/admission or https://example.com' ),
			array( 'key' => 'field_hp_vision', 'name' => 'vision_text', 'label' => 'Vision', 'type' => 'wysiwyg', 'tabs' => 'visual', 'media_upload' => 0 ),
			array( 'key' => 'field_hp_mission', 'name' => 'mission_text', 'label' => 'Mission & Goal', 'type' => 'wysiwyg', 'tabs' => 'visual', 'media_upload' => 0 ),
			array( 'key' => 'field_hp_objectives', 'name' => 'objectives_text', 'label' => 'Objectives', 'type' => 'wysiwyg', 'tabs' => 'visual', 'media_upload' => 0 ),
			array( 'key' => 'field_hp_history', 'name' => 'history_text', 'label' => 'School History', 'type' => 'wysiwyg', 'tabs' => 'visual', 'media_upload' => 0 ),
			array( 'key' => 'field_hp_stats_bg', 'name' => 'stats_bg_image', 'label' => 'Stats Section Background Image', 'type' => 'image', 'return_format' => 'array' ),
			array( 'key' => 'field_hp_decoration', 'name' => 'decoration_image', 'label' => 'Decorative Illustration', 'type' => 'image', 'return_format' => 'array' ),
		),
		'location' => array( array( array( 'param' => 'page_type', 'operator' => '==', 'value' => 'front_page' ) ) ),
	) );

	// Generic Page Content — About, Academics, Admission, FAQ, etc. (any Page except the front page).
	acf_add_local_field_group( array(
		'key'      => 'group_generic_page',
		'title'    => 'Page Content',
		'fields'   => array(
			array( 'key' => 'field_gp_hero_title', 'name' => 'hero_title', 'label' => 'Hero Title', 'type' => 'text' ),
			array( 'key' => 'field_gp_hero_subtitle', 'name' => 'hero_subtitle', 'label' => 'Hero Subtitle', 'type' => 'text' ),
			array( 'key' => 'field_gp_hero_image', 'name' => 'hero_image', 'label' => 'Hero Image', 'type' => 'image', 'return_format' => 'array' ),
			array( 'key' => 'field_gp_content', 'name' => 'content_body', 'label' => 'Content', 'type' => 'wysiwyg', 'tabs' => 'visual', 'media_upload' => 0 ),
		),
		'location' => array( array(
			array( 'param' => 'post_type', 'operator' => '==', 'value' => 'page' ),
			array( 'param' => 'page_type', 'operator' => '!=', 'value' => 'front_page' ),
		) ),
	) );
}
add_action( 'acf/init', 'khwopring_register_acf_fields' );
