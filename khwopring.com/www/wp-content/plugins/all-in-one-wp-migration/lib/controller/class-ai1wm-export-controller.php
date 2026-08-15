<?php
/**
 * Copyright (C) 2014-2025 ServMask Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * Attribution: This code is part of the All-in-One WP Migration plugin, developed by
 *
 * ███████╗███████╗██████╗ ██╗   ██╗███╗   ███╗ █████╗ ███████╗██╗  ██╗
 * ██╔════╝██╔════╝██╔══██╗██║   ██║████╗ ████║██╔══██╗██╔════╝██║ ██╔╝
 * ███████╗█████╗  ██████╔╝██║   ██║██╔████╔██║███████║███████╗█████╔╝
 * ╚════██║██╔══╝  ██╔══██╗╚██╗ ██╔╝██║╚██╔╝██║██╔══██║╚════██║██╔═██╗
 * ███████║███████╗██║  ██║ ╚████╔╝ ██║ ╚═╝ ██║██║  ██║███████║██║  ██╗
 * ╚══════╝╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Kangaroos cannot jump here' );
}

class Ai1wm_Export_Controller {

	public static function index() {
		Ai1wm_Template::render( 'export/index' );
	}

	public static function export( $params = array() ) {
		global $ai1wm_params;

		// Set params
		if ( empty( $params ) ) {
			$params = stripslashes_deep( array_merge( $_GET, $_POST ) );
		}

		// Set priority
		if ( ! isset( $params['priority'] ) ) {
			$params['priority'] = 5;
		}

		$ai1wm_params = $params;

		// Set job ID for per-job status tracking
		if ( isset( $params['storage'] ) ) {
			Ai1wm_Status::$job_id = $params['storage'];
		}

		// Set secret key
		$secret_key = null;
		if ( isset( $params['secret_key'] ) ) {
			$secret_key = trim( $params['secret_key'] );
		}

		ai1wm_setup_environment();

		try {
			// Ensure that unauthorized people cannot access export action
			ai1wm_verify_secret_key( $secret_key );
		} catch ( Ai1wm_Not_Valid_Secret_Key_Exception $e ) {
			exit;
		}

		// Error handling is set up for the authorised request, after the secret-key check.
		ai1wm_setup_errors();

		// Loop over filters
		if ( ( $filters = ai1wm_get_filters( 'ai1wm_export' ) ) ) {
			while ( $hooks = current( $filters ) ) {
				if ( intval( $params['priority'] ) === key( $filters ) ) {
					foreach ( $hooks as $hook ) {
						try {

							// Run function hook
							$params = call_user_func_array( $hook['function'], array( $params ) );

						} catch ( Ai1wm_Database_Exception $e ) {
							do_action( 'ai1wm_status_export_error', $params, $e );

							if ( defined( 'WP_CLI' ) ) {
								/* translators: 1: Error code, 2: Error message. */
								WP_CLI::error( sprintf( __( 'Export failed (database error). Code: %1$s. Message: %2$s', 'all-in-one-wp-migration' ), $e->getCode(), $e->getMessage() ) );
							}

							// REST API: write job-scoped error so poll clients see the terminal state, then re-throw
							if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) {
								Ai1wm_Status::error( __( 'Export failed', 'all-in-one-wp-migration' ), $e->getMessage() );
								throw $e;
							}

							status_header( $e->getCode() );
							ai1wm_json_response( array( 'errors' => array( array( 'code' => $e->getCode(), 'message' => $e->getMessage() ) ) ) );
							exit;
						} catch ( Exception $e ) {
							do_action( 'ai1wm_status_export_error', $params, $e );

							if ( defined( 'WP_CLI' ) ) {
								/* translators: 1: Error message. */
								WP_CLI::error( sprintf( __( 'Export failed: %s', 'all-in-one-wp-migration' ), $e->getMessage() ) );
							}

							// Write job-scoped error first so REST poll clients see the terminal state
							Ai1wm_Status::error( __( 'Export failed', 'all-in-one-wp-migration' ), $e->getMessage() );

							// REST API: re-throw so the handler can return a WP_Error
							if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) {
								throw $e;
							}

							Ai1wm_Notification::error( __( 'Export failed', 'all-in-one-wp-migration' ), $e->getMessage() );
							exit;
						}
					}

					// Set completed
					$completed = true;
					if ( isset( $params['completed'] ) ) {
						$completed = (bool) $params['completed'];
					}

					// Do request
					if ( $completed === false || ( $next = next( $filters ) ) && ( $params['priority'] = key( $filters ) ) ) {
						if ( defined( 'WP_CLI' ) ) {
							if ( ! defined( 'DOING_CRON' ) ) {
								continue;
							}
						}

						if ( isset( $params['ai1wm_manual_export'] ) ) {
							ai1wm_json_response( $params );
							exit;
						}

						wp_remote_request(
							apply_filters( 'ai1wm_http_export_url', add_query_arg( array( 'ai1wm_import' => 1 ), admin_url( 'admin-ajax.php?action=ai1wm_export' ) ) ),
							array(
								'method'    => apply_filters( 'ai1wm_http_export_method', 'POST' ),
								'timeout'   => apply_filters( 'ai1wm_http_export_timeout', 10 ),
								'blocking'  => apply_filters( 'ai1wm_http_export_blocking', false ),
								'sslverify' => apply_filters( 'ai1wm_http_export_sslverify', false ),
								'headers'   => apply_filters( 'ai1wm_http_export_headers', array() ),
								'body'      => apply_filters( 'ai1wm_http_export_body', $params ),
							)
						);

						// REST API: return params instead of exit so the handler can build a response
						if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) {
							return $params;
						}

						exit;
					}
				}

				next( $filters );
			}
		}

		return $params;
	}

	public static function buttons() {
		$active_filters = array();
		$static_filters = array();

		// All-in-One WP Migration
		if ( defined( 'AI1WM_PLUGIN_NAME' ) ) {
			$active_filters[] = apply_filters( 'ai1wm_export_file', Ai1wm_Template::get_content( 'export/button-file' ) );
		} else {
			$static_filters[] = apply_filters( 'ai1wm_export_file', Ai1wm_Template::get_content( 'export/button-file' ) );
		}

		// Add Google Drive Extension
		if ( defined( 'AI1WMGE_PLUGIN_NAME' ) ) {
			$active_filters[] = apply_filters( 'ai1wm_export_gdrive', Ai1wm_Template::get_content( 'export/button-gdrive' ) );
		} else {
			$static_filters[] = apply_filters( 'ai1wm_export_gdrive', Ai1wm_Template::get_content( 'export/button-gdrive' ) );
		}

		// Add FTP Extension
		if ( defined( 'AI1WMFE_PLUGIN_NAME' ) ) {
			$active_filters[] = apply_filters( 'ai1wm_export_ftp', Ai1wm_Template::get_content( 'export/button-ftp' ) );
		} else {
			$static_filters[] = apply_filters( 'ai1wm_export_ftp', Ai1wm_Template::get_content( 'export/button-ftp' ) );
		}

		// Add Dropbox Extension
		if ( defined( 'AI1WMDE_PLUGIN_NAME' ) ) {
			$active_filters[] = apply_filters( 'ai1wm_export_dropbox', Ai1wm_Template::get_content( 'export/button-dropbox' ) );
		} else {
			$static_filters[] = apply_filters( 'ai1wm_export_dropbox', Ai1wm_Template::get_content( 'export/button-dropbox' ) );
		}

		// Add Amazon S3 Extension
		if ( defined( 'AI1WMSE_PLUGIN_NAME' ) ) {
			$active_filters[] = apply_filters( 'ai1wm_export_s3', Ai1wm_Template::get_content( 'export/button-s3' ) );
		} else {
			$static_filters[] = apply_filters( 'ai1wm_export_s3', Ai1wm_Template::get_content( 'export/button-s3' ) );
		}

		// Add OneDrive Extension
		if ( defined( 'AI1WMOE_PLUGIN_NAME' ) ) {
			$active_filters[] = apply_filters( 'ai1wm_export_onedrive', Ai1wm_Template::get_content( 'export/button-onedrive' ) );
		} else {
			$static_filters[] = apply_filters( 'ai1wm_export_onedrive', Ai1wm_Template::get_content( 'export/button-onedrive' ) );
		}

		// Add pCloud Extension
		if ( defined( 'AI1WMPE_PLUGIN_NAME' ) ) {
			$active_filters[] = apply_filters( 'ai1wm_export_pcloud', Ai1wm_Template::get_content( 'export/button-pcloud' ) );
		} else {
			$static_filters[] = apply_filters( 'ai1wm_export_pcloud', Ai1wm_Template::get_content( 'export/button-pcloud' ) );
		}

		// Add S3 Client Extension
		if ( defined( 'AI1WMNE_PLUGIN_NAME' ) ) {
			$active_filters[] = apply_filters( 'ai1wm_export_s3_client', Ai1wm_Template::get_content( 'export/button-s3-client' ) );
		} else {
			$static_filters[] = apply_filters( 'ai1wm_export_s3_client', Ai1wm_Template::get_content( 'export/button-s3-client' ) );
		}

		// Add Google Cloud Storage Extension
		if ( defined( 'AI1WMCE_PLUGIN_NAME' ) ) {
			$active_filters[] = apply_filters( 'ai1wm_export_gcloud_storage', Ai1wm_Template::get_content( 'export/button-gcloud-storage' ) );
		} else {
			$static_filters[] = apply_filters( 'ai1wm_export_gcloud_storage', Ai1wm_Template::get_content( 'export/button-gcloud-storage' ) );
		}

		// Add DigitalOcean Spaces Extension
		if ( defined( 'AI1WMIE_PLUGIN_NAME' ) ) {
			$active_filters[] = apply_filters( 'ai1wm_export_digitalocean', Ai1wm_Template::get_content( 'export/button-digitalocean' ) );
		} else {
			$static_filters[] = apply_filters( 'ai1wm_export_digitalocean', Ai1wm_Template::get_content( 'export/button-digitalocean' ) );
		}

		// Add Mega Extension
		if ( defined( 'AI1WMEE_PLUGIN_NAME' ) ) {
			$active_filters[] = apply_filters( 'ai1wm_export_mega', Ai1wm_Template::get_content( 'export/button-mega' ) );
		} else {
			$static_filters[] = apply_filters( 'ai1wm_export_mega', Ai1wm_Template::get_content( 'export/button-mega' ) );
		}

		// Add Backblaze B2 Extension
		if ( defined( 'AI1WMAE_PLUGIN_NAME' ) ) {
			$active_filters[] = apply_filters( 'ai1wm_export_b2', Ai1wm_Template::get_content( 'export/button-b2' ) );
		} else {
			$static_filters[] = apply_filters( 'ai1wm_export_b2', Ai1wm_Template::get_content( 'export/button-b2' ) );
		}

		// Add Box Extension
		if ( defined( 'AI1WMBE_PLUGIN_NAME' ) ) {
			$active_filters[] = apply_filters( 'ai1wm_export_box', Ai1wm_Template::get_content( 'export/button-box' ) );
		} else {
			$static_filters[] = apply_filters( 'ai1wm_export_box', Ai1wm_Template::get_content( 'export/button-box' ) );
		}

		// Add Microsoft Azure Extension
		if ( defined( 'AI1WMZE_PLUGIN_NAME' ) ) {
			$active_filters[] = apply_filters( 'ai1wm_export_azure_storage', Ai1wm_Template::get_content( 'export/button-azure-storage' ) );
		} else {
			$static_filters[] = apply_filters( 'ai1wm_export_azure_storage', Ai1wm_Template::get_content( 'export/button-azure-storage' ) );
		}

		// Add WebDAV Extension
		if ( defined( 'AI1WMWE_PLUGIN_NAME' ) ) {
			$active_filters[] = apply_filters( 'ai1wm_export_webdav', Ai1wm_Template::get_content( 'export/button-webdav' ) );
		} else {
			$static_filters[] = apply_filters( 'ai1wm_export_webdav', Ai1wm_Template::get_content( 'export/button-webdav' ) );
		}

		// Add Amazon Glacier Extension
		if ( defined( 'AI1WMRE_PLUGIN_NAME' ) ) {
			$active_filters[] = apply_filters( 'ai1wm_export_glacier', Ai1wm_Template::get_content( 'export/button-glacier' ) );
		} else {
			$static_filters[] = apply_filters( 'ai1wm_export_glacier', Ai1wm_Template::get_content( 'export/button-glacier' ) );
		}

		return array_merge( $active_filters, $static_filters );
	}

	public static function cleanup() {
		try {
			// Iterate over storage directory
			$iterator = new Ai1wm_Recursive_Directory_Iterator( AI1WM_STORAGE_PATH );

			// Exclude index.php
			$iterator = new Ai1wm_Recursive_Exclude_Filter( $iterator, array( 'index.php', 'index.html' ) );

			// Loop over folders and files
			foreach ( $iterator as $item ) {
				try {
					if ( $item->isFile() && $item->getExtension() === 'log' ) {
						if ( $item->getMTime() < ( time() - AI1WM_MAX_LOG_CLEANUP ) ) {
							Ai1wm_File::delete( $item->getPathname() );
						}
					} elseif ( $item->getMTime() < ( time() - AI1WM_MAX_STORAGE_CLEANUP ) ) {
						if ( $item->isDir() ) {
							delete_option( 'ai1wm_status_' . basename( $item->getPathname() ) );
							Ai1wm_Directory::delete( $item->getPathname() );
						} else {
							Ai1wm_File::delete( $item->getPathname() );
						}
					}
				} catch ( Exception $e ) {
				}
			}
		} catch ( Exception $e ) {
		}

		// Sweep orphan ai1wm_status_<job_id> options whose storage folder is gone.
		// Pipeline Clean stages delete the folder before this cron sees it, so the
		// folder-iterating loop above can't reach their option rows.
		global $wpdb;
		if ( $wpdb instanceof wpdb ) {
			$prefix       = 'ai1wm_status_';
			$prefix_len   = strlen( $prefix );
			$storage_root = AI1WM_STORAGE_PATH . DIRECTORY_SEPARATOR;
			$like         = $wpdb->esc_like( $prefix ) . '%';
			// $wpdb->options is a trusted property, not user input.
			// @phpstan-ignore-next-line argument.type
			$sql  = $wpdb->prepare( "SELECT option_name FROM {$wpdb->options} WHERE option_name LIKE %s", $like );
			$rows = $wpdb->get_col( $sql );
			if ( is_array( $rows ) ) {
				foreach ( $rows as $option_name ) {
					$job_id = substr( $option_name, $prefix_len );
					if ( ! preg_match( '/\A[a-zA-Z0-9_-]+\z/', $job_id ) ) {
						continue;
					}
					if ( ! is_dir( $storage_root . $job_id ) ) {
						delete_option( $option_name );
					}
				}
			}
		}
	}
}
