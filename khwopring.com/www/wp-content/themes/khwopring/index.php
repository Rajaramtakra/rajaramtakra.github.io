<?php
// Headless theme — the React frontend renders everything. WordPress only
// needs this file to route non-API, non-admin requests to the built SPA
// shell; React Router takes over from there once the JS loads.

$dist_index = __DIR__ . '/dist/index.html';

if ( file_exists( $dist_index ) ) {
	readfile( $dist_index );
} else { 
	status_header( 503 );
	echo 'Frontend build not found. Run `npm run build` in wp-content/themes/khwopring/frontend.';
}
