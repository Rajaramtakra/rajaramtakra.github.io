<?php
/**
 * One-off: rebuild the primary nav menu with a hierarchical structure
 * (dropdowns), mirroring khwopring.edu.np's real section grouping while
 * only pointing at routes that actually exist in the React frontend.
 * Run via: wp eval-file wp-content/themes/khwopring/inc/seed/rebuild-menu.php
 */

$menu_name = 'Primary Navigation';
$menu = wp_get_nav_menu_object( $menu_name );
if ( ! $menu ) {
	$menu_id = wp_create_nav_menu( $menu_name );
} else {
	$menu_id = $menu->term_id;
	$existing_items = wp_get_nav_menu_items( $menu_id );
	foreach ( $existing_items as $item ) {
		wp_delete_post( $item->ID, true );
	}
	echo "Cleared existing menu items.\n";
}

$locations = get_theme_mod( 'nav_menu_locations', array() );
$locations['primary'] = $menu_id;
set_theme_mod( 'nav_menu_locations', $locations );

function khmenu_add( $menu_id, $title, $url, $parent_id = 0 ) {
	$id = wp_update_nav_menu_item( $menu_id, 0, array(
		'menu-item-title'     => $title,
		'menu-item-url'       => $url,
		'menu-item-status'    => 'publish',
		'menu-item-parent-id' => $parent_id,
	) );
	echo "Added menu item: {$title} -> {$url}" . ( $parent_id ? " (child of #{$parent_id})" : '' ) . "\n";
	return $id;
}

khmenu_add( $menu_id, 'Home', '/' );

$about_id = khmenu_add( $menu_id, 'About', '/about' );
khmenu_add( $menu_id, 'About Us', '/about', $about_id );
khmenu_add( $menu_id, 'Our Team', '/teachers', $about_id );
khmenu_add( $menu_id, 'Academics', '/academics', $about_id );

khmenu_add( $menu_id, 'Facilities', '/facilities' );

$news_id = khmenu_add( $menu_id, 'News & Events', '/news' );
khmenu_add( $menu_id, 'News', '/news', $news_id );
khmenu_add( $menu_id, 'Events', '/events', $news_id );

khmenu_add( $menu_id, 'Gallery', '/gallery' );
khmenu_add( $menu_id, 'Admission', '/admission' );
khmenu_add( $menu_id, 'Contact', '/contact' );

echo "== Menu rebuilt ==\n";
