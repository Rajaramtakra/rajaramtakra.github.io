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

class Ai1wm_Import_Validate_Crc {

	public static function execute( $params ) {
		$archive_bytes_read = 0;

		// Skip validation for v1 archives (no CRC available)
		if ( empty( $params['archive_crc_value'] ) ) {
			return $params;
		}

		// Set progress
		Ai1wm_Status::info( __( 'Validating archive checksum...', 'all-in-one-wp-migration' ) );

		// Set archive bytes remaining
		if ( isset( $params['archive_bytes_remaining'] ) ) {
			$archive_bytes_remaining = (int) $params['archive_bytes_remaining'];
		} elseif ( isset( $params['archive_crc_size'] ) ) {
			$archive_bytes_remaining = (int) $params['archive_crc_size'];
		} else {
			$archive_bytes_remaining = 0;
		}

		// Set archive bytes offset
		if ( isset( $params['archive_bytes_offset'] ) ) {
			$archive_bytes_offset = (int) $params['archive_bytes_offset'];
		} else {
			$archive_bytes_offset = 0;
		}

		// Set file CRC
		$file_crc = null;
		if ( isset( $params['file_crc'] ) ) {
			$file_crc = $params['file_crc'];
		}

		// Flag to hold if file data has been processed
		$completed = true;

		// Start time
		$start = microtime( true );

		// Initialize CRC context
		$hash_ctx = Ai1wm_Crc::init_crc32();

		// Open archive for reading
		if ( ( $file_handle = ai1wm_open( ai1wm_archive_path( $params ), 'rb' ) ) ) {
			if ( fseek( $file_handle, $archive_bytes_offset, SEEK_SET ) !== -1 ) {

				// Process file in chunks
				while ( $archive_bytes_remaining > 0 ) {
					if ( ( $file_content = ai1wm_read( $file_handle, min( Ai1wm_Archiver::READ_CHUNK_SIZE, $archive_bytes_remaining ) ) ) !== false ) {

						// Empty read indicates EOF
						if ( strlen( $file_content ) === 0 ) {
							break;
						}

						// Add the amount of bytes we read
						$archive_bytes_read += strlen( $file_content );

						// Subtract the amount of bytes we read
						$archive_bytes_remaining -= strlen( $file_content );

						// Update CRC with original content
						Ai1wm_Crc::update_crc32( $hash_ctx, $file_content );
					}

					// Time elapsed
					if ( ( $timeout = apply_filters( 'ai1wm_completed_timeout', 10 ) ) ) {
						if ( ( microtime( true ) - $start ) > $timeout ) {
							$completed = false;
							break;
						}
					}
				}

				// Get archive bytes offset
				$archive_bytes_offset += $archive_bytes_read;
			}

			ai1wm_close( $file_handle );
		}

		// Combine and finalize CRC
		if ( empty( $file_crc ) ) {
			$params['file_crc'] = Ai1wm_Crc::finalize_crc32( $hash_ctx );
		} else {
			$params['file_crc'] = Ai1wm_Crc::combine_crc32( $file_crc, Ai1wm_Crc::finalize_crc32( $hash_ctx ), $archive_bytes_read );
		}

		// End of the archive file?
		if ( $completed ) {

			// Validate CRC value
			if ( $params['archive_crc_value'] !== $params['file_crc'] ) {
				throw new Ai1wm_CRC_Exception(
					wp_kses(
						__(
							'This backup file is damaged and can\'t be imported.<br />' .
							'Try downloading or transferring the file again.<br /><br />' .
							'<strong>Reason:</strong> File integrity check failed (CRC mismatch). <a href="https://help.servmask.com/knowledgebase/import-failed-crc-mismatch/" target="_blank">Technical details</a>',
							'all-in-one-wp-migration'
						),
						ai1wm_allowed_html_tags()
					)
				);
			}

			// Unset file CRC
			unset( $params['file_crc'] );

			// Unset archive bytes remaining
			unset( $params['archive_bytes_remaining'] );

			// Unset archive bytes offset
			unset( $params['archive_bytes_offset'] );

			// Unset completed flag
			unset( $params['completed'] );

		} else {

			// St archive bytes remaining
			$params['archive_bytes_remaining'] = $archive_bytes_remaining;

			// Set archive bytes offset
			$params['archive_bytes_offset'] = $archive_bytes_offset;

			// Set completed flag
			$params['completed'] = $completed;
		}

		return $params;
	}
}
