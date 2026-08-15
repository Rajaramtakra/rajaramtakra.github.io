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

class Ai1wm_Compressor extends Ai1wm_Archiver {

	/**
	 * Overloaded constructor that opens the passed file for writing
	 *
	 * @param string $file_name        File to use as archive
	 * @param string $file_password    File password string
	 * @param string $file_compression File compression type
	 */
	public function __construct( $file_name, $file_password = null, $file_compression = null ) {
		// Call parent, to initialize variables
		parent::__construct( $file_name, $file_password, $file_compression, true );
	}

	/**
	 * Add a file to the archive
	 *
	 * @param string      $file_name          File to add to the archive
	 * @param string      $new_file_name      Write the file with a different name
	 * @param int         $file_bytes_read    Amount of the bytes we read
	 * @param int         $file_bytes_offset  File bytes offset
	 * @param int         $file_bytes_written Amount of the bytes we wrote
	 * @param string|null $file_crc           File CRC32 checksum (passed by reference, optional)
	 *
	 * @throws \Ai1wm_Not_Seekable_Exception
	 * @throws \Ai1wm_Not_Writable_Exception
	 * @throws \Ai1wm_Quota_Exceeded_Exception
	 *
	 * @return bool
	 */
	public function add_file( $file_name, $new_file_name = '', &$file_bytes_read = 0, &$file_bytes_offset = 0, &$file_bytes_written = 0, &$file_crc = null ) {
		// Replace forward slash with current directory separator in file name
		$file_name = ai1wm_replace_forward_slash_with_directory_separator( $file_name );

		// Escape Windows directory separator in file name
		$file_name = ai1wm_escape_windows_directory_separator( $file_name );

		// Flag to hold if file data has been processed
		$completed = true;

		// Start time
		$start = microtime( true );

		// Open the file for reading in binary mode (fopen may return null for quarantined files)
		if ( ( $file_handle = @fopen( $file_name, 'rb' ) ) ) {

			// Start native hash for current chunk
			$hash_ctx = Ai1wm_Crc::init_crc32();

			// Get header block with empty CRC placeholder
			if ( ( $block = $this->get_file_block( $file_name, $new_file_name, '' ) ) ) {

				// Write header block
				if ( $file_bytes_offset === 0 ) {
					if ( ( $file_bytes = @fwrite( $this->file_handle, $block ) ) !== false ) {
						if ( strlen( $block ) !== $file_bytes ) {
							throw new Ai1wm_Quota_Exceeded_Exception( sprintf( __( 'Out of disk space. Could not write header to file. File: %s', 'all-in-one-wp-migration' ), $this->file_name ) );
						}
					} else {
						throw new Ai1wm_Not_Writable_Exception( sprintf( __( 'Could not write header to file. File: %s', 'all-in-one-wp-migration' ), $this->file_name ) );
					}
				}

				// Set file offset
				if ( @fseek( $file_handle, $file_bytes_offset, SEEK_SET ) !== -1 ) {
					$file_bytes_read = 0;

					// Cache config file check outside the loop
					$should_process_file = ! in_array( $new_file_name, ai1wm_config_filters() );

					// Read the file in 512KB chunks
					while ( false === @feof( $file_handle ) ) {
						if ( ( $file_content = @fread( $file_handle, static::READ_CHUNK_SIZE ) ) !== false ) {

							// Empty read indicates EOF
							if ( strlen( $file_content ) === 0 ) {
								break;
							}

							// Add the amount of bytes we read
							$file_bytes_read += strlen( $file_content );

							// Update CRC with original content (BEFORE compression/encryption)
							Ai1wm_Crc::update_crc32( $hash_ctx, $file_content );

							// Do not encrypt or compress config files
							if ( $should_process_file === true ) {

								// Add chunk data compression
								if ( ! empty( $this->file_compression ) ) {
									switch ( $this->file_compression ) {
										case 'gzip':
											$file_content = gzcompress( $file_content, 9 );
											break;

										case 'bzip2':
											$file_content = bzcompress( $file_content, 9 );
											break;
									}
								}

								// Add chunk data encryption
								if ( ! empty( $this->file_password ) ) {
									$file_content = ai1wm_encrypt_string( $file_content, $this->file_password );
								}

								// Add variable length chunk size before chunk data
								if ( ! empty( $this->file_compression ) ) {
									$file_content = pack( 'N', strlen( $file_content ) ) . $file_content;
								}
							}

							if ( ( $file_bytes = @fwrite( $this->file_handle, $file_content ) ) !== false ) {
								if ( strlen( $file_content ) !== $file_bytes ) {
									throw new Ai1wm_Quota_Exceeded_Exception( sprintf( __( 'Out of disk space. Could not write content to file. File: %s', 'all-in-one-wp-migration' ), $this->file_name ) );
								}
							} else {
								throw new Ai1wm_Not_Writable_Exception( sprintf( __( 'Could not write content to file. File: %s', 'all-in-one-wp-migration' ), $this->file_name ) );
							}

							// Add the amount of bytes we wrote
							$file_bytes_written += $file_bytes;
						}

						// Time elapsed
						if ( ( $timeout = apply_filters( 'ai1wm_completed_timeout', 10 ) ) ) {
							if ( ( microtime( true ) - $start ) > $timeout ) {
								$completed = false;
								break;
							}
						}
					}

					// Add the amount of bytes we read
					$file_bytes_offset += $file_bytes_read;
				}

				// Combine and finalize CRC
				if ( empty( $file_crc ) ) {
					$file_crc = Ai1wm_Crc::finalize_crc32( $hash_ctx );
				} else {
					$file_crc = Ai1wm_Crc::combine_crc32( $file_crc, Ai1wm_Crc::finalize_crc32( $hash_ctx ), $file_bytes_read );
				}

				// Write file size to file header
				if ( ( $file_size_block = $this->get_file_size_block( $file_bytes_written ) ) ) {

					// Seek to beginning of file size (back over: content + crc32(8) + path(4088) + mtime(12) + size(14))
					if ( @fseek( $this->file_handle, - $file_bytes_written - 8 - 4088 - 12 - 14, SEEK_CUR ) === -1 ) {
						throw new Ai1wm_Not_Seekable_Exception( __( 'Your PHP is 32-bit. In order to export your file, please change your PHP version to 64-bit and try again. <a href="https://help.servmask.com/knowledgebase/php-32bit/" target="_blank">Technical details</a>', 'all-in-one-wp-migration' ) );
					}

					// Write file size to file header
					if ( ( $file_bytes = @fwrite( $this->file_handle, $file_size_block ) ) !== false ) {
						if ( strlen( $file_size_block ) !== $file_bytes ) {
							throw new Ai1wm_Quota_Exceeded_Exception( sprintf( __( 'Out of disk space. Could not write size to file. File: %s', 'all-in-one-wp-migration' ), $this->file_name ) );
						}
					} else {
						throw new Ai1wm_Not_Writable_Exception( sprintf( __( 'Could not write size to file. File: %s', 'all-in-one-wp-migration' ), $this->file_name ) );
					}

					// Seek to beginning of file CRC (forward over: mtime(12) + path(4088))
					if ( @fseek( $this->file_handle, + 12 + 4088, SEEK_CUR ) === -1 ) {
						throw new Ai1wm_Not_Seekable_Exception( __( 'Your PHP is 32-bit. In order to export your file, please change your PHP version to 64-bit and try again. <a href="https://help.servmask.com/knowledgebase/php-32bit/" target="_blank">Technical details</a>', 'all-in-one-wp-migration' ) );
					}

					// Write file CRC to file header
					if ( ( $file_crc_block = $this->get_file_crc_block( $file_crc ) ) ) {
						if ( ( $file_bytes = @fwrite( $this->file_handle, $file_crc_block ) ) !== false ) {
							if ( strlen( $file_crc_block ) !== $file_bytes ) {
								throw new Ai1wm_Quota_Exceeded_Exception( sprintf( __( 'Out of disk space. Could not write CRC to file. File: %s', 'all-in-one-wp-migration' ), $this->file_name ) );
							}
						}
					}

					// Seek to end of file content (forward over: content)
					if ( @fseek( $this->file_handle, + $file_bytes_written, SEEK_CUR ) === -1 ) {
						throw new Ai1wm_Not_Seekable_Exception( __( 'Your PHP is 32-bit. In order to export your file, please change your PHP version to 64-bit and try again. <a href="https://help.servmask.com/knowledgebase/php-32bit/" target="_blank">Technical details</a>', 'all-in-one-wp-migration' ) );
					}
				}
			}

			// Close the handle
			@fclose( $file_handle );
		}

		return $completed;
	}

	/**
	 * Generate binary block header for a file
	 *
	 * @param string      $file_name     Filename to generate block header for
	 * @param string      $new_file_name Write the file with a different name
	 * @param string|null $crc32         CRC32 checksum (optional)
	 *
	 * @return string
	 */
	private function get_file_block( $file_name, $new_file_name = '', $crc32 = null ) {
		$block = '';

		// Get stats about the file
		if ( ( $stat = @stat( $file_name ) ) !== false ) {

			// Filename of the file we are accessing
			if ( empty( $new_file_name ) ) {
				$name = ai1wm_basename( $file_name );
			} else {
				$name = ai1wm_basename( $new_file_name );
			}

			// Size in bytes of the file
			$size = $stat['size'];

			// Last time the file was modified
			$date = $stat['mtime'];

			// Replace current directory separator with backward slash in file path
			if ( empty( $new_file_name ) ) {
				$path = ai1wm_replace_directory_separator_with_forward_slash( ai1wm_dirname( $file_name ) );
			} else {
				$path = ai1wm_replace_directory_separator_with_forward_slash( ai1wm_dirname( $new_file_name ) );
			}

			// Only calculate CRC if not provided
			if ( empty( $crc32 ) ) {
				$crc32 = Ai1wm_Crc::calculate_file_crc32( $file_name );
			}

			// Concatenate block format parts
			$format = implode( '', $this->block_format );

			// Pack file data into binary string
			$block = pack( $format, $name, $size, $date, $path, $crc32 );
		}

		return $block;
	}

	/**
	 * Generate file size binary block header for a file
	 *
	 * @param int $file_size File size
	 *
	 * @return string
	 */
	public function get_file_size_block( $file_size ) {
		$block = '';

		// Pack file data into binary string
		if ( isset( $this->block_format[1] ) ) {
			$block = pack( $this->block_format[1], $file_size );
		}

		return $block;
	}

	/**
	 * Generate file CRC binary block header for a file
	 *
	 * @param int $file_crc File CRC
	 *
	 * @return string
	 */
	public function get_file_crc_block( $file_crc ) {
		$block = '';

		// Pack file data into binary string
		if ( isset( $this->block_format[4] ) ) {
			$block = pack( $this->block_format[4], $file_crc );
		}

		return $block;
	}
}
