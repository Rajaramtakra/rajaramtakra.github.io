<?php
/**
 * Site-wide Theme Settings admin page (native Settings API — no ACF Options
 * Page dependency, since that's an ACF Pro-only feature). Covers everything
 * the footer, header, and admission CTA need: logo, contact info, socials,
 * ERP button, top bar text.
 */

defined( 'ABSPATH' ) || exit;

define( 'KHWOPRING_SETTINGS_OPTION', 'khwopring_settings' );

function khwopring_settings_fields() {
	return array(
		'logo'          => 'Logo',
		'address'       => 'Address',
		'phone'         => 'Phone',
		'phone_alt'     => 'Phone (Alternate)',
		'email'         => 'Email',
		'office_hours'  => 'Office Hours (top bar)',
		'facebook_url'  => 'Facebook URL',
		'instagram_url' => 'Instagram URL',
		'youtube_url'   => 'YouTube URL',
		'linkedin_url'  => 'LinkedIn URL',
		'twitter_url'   => 'Twitter / X URL',
		'erp_label'     => 'ERP Button Label',
		'erp_link'      => 'ERP Button Link',
		'google_map_embed' => 'Google Map Embed URL',
	);
}

function khwopring_register_settings() {
	register_setting( 'khwopring_settings_group', KHWOPRING_SETTINGS_OPTION, array(
		'type'              => 'array',
		'sanitize_callback' => 'khwopring_sanitize_settings',
		'default'           => array(),
	) );
}
add_action( 'admin_init', 'khwopring_register_settings' );

function khwopring_sanitize_settings( $input ) {
	$clean = array();
	foreach ( array_keys( khwopring_settings_fields() ) as $key ) {
		$value = isset( $input[ $key ] ) ? $input[ $key ] : '';
		if ( 'logo' === $key ) {
			$clean[ $key ] = absint( $value );
		} elseif ( strpos( $key, '_url' ) !== false || 'erp_link' === $key || 'google_map_embed' === $key ) {
			$clean[ $key ] = esc_url_raw( $value );
		} elseif ( 'email' === $key ) {
			$clean[ $key ] = sanitize_email( $value );
		} else {
			$clean[ $key ] = sanitize_text_field( $value );
		}
	}
	return $clean;
}

function khwopring_add_settings_page() {
	add_menu_page(
		'Theme Settings',
		'Theme Settings',
		'manage_options',
		'khwopring-settings',
		'khwopring_render_settings_page',
		'dashicons-admin-generic',
		60
	);
}
add_action( 'admin_menu', 'khwopring_add_settings_page' );

function khwopring_settings_enqueue( $hook ) {
	if ( 'toplevel_page_khwopring-settings' !== $hook ) {
		return;
	}
	wp_enqueue_media();
	wp_add_inline_script( 'jquery-core', "
		jQuery(function($){
			var frame;
			$('.khwopring-logo-picker').on('click', function(e){
				e.preventDefault();
				if (frame) { frame.open(); return; }
				frame = wp.media({ title: 'Select Logo', multiple: false, library: { type: 'image' } });
				frame.on('select', function(){
					var attachment = frame.state().get('selection').first().toJSON();
					$('#khwopring_logo_id').val(attachment.id);
					$('#khwopring_logo_preview').attr('src', attachment.url).show();
				});
				frame.open();
			});
		});
	" );
}
add_action( 'admin_enqueue_scripts', 'khwopring_settings_enqueue' );

function khwopring_render_settings_page() {
	$settings = wp_parse_args( get_option( KHWOPRING_SETTINGS_OPTION, array() ), array_fill_keys( array_keys( khwopring_settings_fields() ), '' ) );
	$logo_url = $settings['logo'] ? wp_get_attachment_image_url( $settings['logo'], 'medium' ) : '';
	?>
	<div class="wrap">
		<h1>Khwopring Theme Settings</h1>
		<form method="post" action="options.php">
			<?php settings_fields( 'khwopring_settings_group' ); ?>
			<table class="form-table">
				<tr>
					<th><label>Logo</label></th>
					<td>
						<img id="khwopring_logo_preview" src="<?php echo esc_url( $logo_url ); ?>" style="max-width:150px;display:<?php echo $logo_url ? 'block' : 'none'; ?>;margin-bottom:8px;" />
						<input type="hidden" id="khwopring_logo_id" name="<?php echo KHWOPRING_SETTINGS_OPTION; ?>[logo]" value="<?php echo esc_attr( $settings['logo'] ); ?>" />
						<button class="button khwopring-logo-picker">Select Logo</button>
					</td>
				</tr>
				<?php foreach ( khwopring_settings_fields() as $key => $label ) :
					if ( 'logo' === $key ) continue; ?>
					<tr>
						<th><label for="khwopring_<?php echo esc_attr( $key ); ?>"><?php echo esc_html( $label ); ?></label></th>
						<td>
							<input type="text" class="regular-text" id="khwopring_<?php echo esc_attr( $key ); ?>"
								name="<?php echo KHWOPRING_SETTINGS_OPTION; ?>[<?php echo esc_attr( $key ); ?>]"
								value="<?php echo esc_attr( $settings[ $key ] ); ?>" />
						</td>
					</tr>
				<?php endforeach; ?>
			</table>
			<?php submit_button(); ?>
		</form>
	</div>
	<?php
}
