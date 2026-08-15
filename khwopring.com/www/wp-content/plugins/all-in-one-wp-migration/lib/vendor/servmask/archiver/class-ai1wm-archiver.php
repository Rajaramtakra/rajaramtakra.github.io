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

abstract class Ai1wm_Archiver {

	const HEADER_SIZE = 4377;

	const READ_CHUNK_SIZE = 512000;

	/**
	 * File name including path to the file
	 *
	 * @type string
	 */
	protected $file_name = null;

	/**
	 * File password string
	 *
	 * @type string
	 */
	protected $file_password = null;

	/**
	 * File compression type
	 *
	 * @type string
	 */
	protected $file_compression = null;

	/**
	 * Handle to the file
	 *
	 * @type resource
	 */
	protected $file_handle = null;

	/**
	 * Header block format of a file
	 *
	 * Field Name    Offset    Length    Contents
	 * name               0       255    filename (no path, no slash)
	 * size             255        14    size of file contents
	 * mtime            269        12    last modification time
	 * prefix           281      4088    path name, no trailing slashes
	 * crc32           4369         8    CRC32 checksum (hex string, optional)
	 *
	 * @type array
	 */
	protected $block_format = array(
		'a255',  // filename
		'a14',   // size of file contents
		'a12',   // last time modified
		'a4088', // path
		'a8',    // crc32
	);

	/**
	 * Archive CRC value from the v2 EOF block
	 *
	 * @type string
	 */
	protected $archive_crc_value = null;

	/**
	 * Archive CRC size from the v2 EOF block
	 *
	 * @type string
	 */
	protected $archive_crc_size = null;

	/**
	 * Default constructor
	 *
	 * Initializes filename and end of file block
	 *
	 * @param string $file_name        File to use as archive
	 * @param string $file_password    File password string
	 * @param string $file_compression File compression type
	 * @param bool   $file_write       File Read/write mode
	 *
	 * @throws Ai1wm_Not_Accessible_Exception
	 * @throws Ai1wm_Not_Seekable_Exception
	 */
	public function __construct( $file_name, $file_password = null, $file_compression = null, $file_write = false ) {
		$this->file_name        = $file_name;
		$this->file_password    = $file_password;
		$this->file_compression = $file_compression;

		// Open archive file
		if ( $file_write ) {
			// Open archive file for writing
			if ( ( $this->file_handle = @fopen( $file_name, 'cb' ) ) === false ) {
				throw new Ai1wm_Not_Accessible_Exception( sprintf( __( 'Could not open file for writing. File: %s', 'all-in-one-wp-migration' ), $this->file_name ) );
			}

			// Seek to end of archive file
			if ( @fseek( $this->file_handle, 0, SEEK_END ) === -1 ) {
				throw new Ai1wm_Not_Seekable_Exception( sprintf( __( 'Could not seek to end of file. File: %s', 'all-in-one-wp-migration' ), $this->file_name ) );
			}
		} else {
			// Open archive file for reading
			if ( ( $this->file_handle = @fopen( $file_name, 'rb' ) ) === false ) {
				throw new Ai1wm_Not_Accessible_Exception( sprintf( __( 'Could not open file for reading. File: %s', 'all-in-one-wp-migration' ), $this->file_name ) );
			}
		}
	}

	/**
	 * Set current file pointer
	 *
	 * @param int $offset Archive offset
	 *
	 * @throws \Ai1wm_Not_Seekable_Exception
	 *
	 * @return void
	 */
	public function set_file_pointer( $offset ) {
		if ( @fseek( $this->file_handle, $offset, SEEK_SET ) === -1 ) {
			throw new Ai1wm_Not_Seekable_Exception( sprintf( __( 'Could not seek to offset of file. File: %s Offset: %d', 'all-in-one-wp-migration' ), $this->file_name, $offset ) );
		}
	}

	/**
	 * Get current file pointer
	 *
	 * @throws \Ai1wm_Not_Tellable_Exception
	 *
	 * @return int
	 */
	public function get_file_pointer() {
		if ( ( $offset = @ftell( $this->file_handle ) ) === false ) {
			throw new Ai1wm_Not_Tellable_Exception( sprintf( __( 'Could not tell offset of file. File: %s', 'all-in-one-wp-migration' ), $this->file_name ) );
		}

		return $offset;
	}

	/**
	 * Appends end of file block to the archive file
	 *
	 * @param string|null $archive_crc_value Pre-calculated archive CRC32 (optional)
	 *
	 * @throws \Ai1wm_Not_Seekable_Exception
	 * @throws \Ai1wm_Not_Writable_Exception
	 * @throws \Ai1wm_Quota_Exceeded_Exception
	 *
	 * @return void
	 */
	protected function append_eof( $archive_crc_value = null ) {
		// Seek to end of archive file
		if ( @fseek( $this->file_handle, 0, SEEK_END ) === -1 ) {
			throw new Ai1wm_Not_Seekable_Exception( sprintf( __( 'Could not seek to end of file. File: %s', 'all-in-one-wp-migration' ), $this->file_name ) );
		}

		// Use pre-calculated CRC if provided, otherwise calculate (fallback)
		if ( empty( $archive_crc_value ) ) {
			$archive_crc_value = Ai1wm_Crc::calculate_file_crc32( $this->file_name );
		}

		// Get archive size (before EOF block)
		if ( ( $archive_crc_size = @ftell( $this->file_handle ) ) === false ) {
			throw new Ai1wm_Not_Tellable_Exception( sprintf( __( 'Could not tell offset of file. File: %s', 'all-in-one-wp-migration' ), $this->file_name ) );
		}

		// Write end of file block
		if ( ( $eof_block = $this->get_eof_block( $archive_crc_size, $archive_crc_value ) ) ) {
			if ( ( $file_bytes = @fwrite( $this->file_handle, $eof_block ) ) !== false ) {
				if ( strlen( $eof_block ) !== $file_bytes ) {
					throw new Ai1wm_Quota_Exceeded_Exception( sprintf( __( 'Out of disk space. Could not write end of block to file. File: %s', 'all-in-one-wp-migration' ), $this->file_name ) );
				}
			} else {
				throw new Ai1wm_Not_Writable_Exception( sprintf( __( 'Could not write end of block to file. File: %s', 'all-in-one-wp-migration' ), $this->file_name ) );
			}
		}
	}

	/**
	 * Replace forward slash with current directory separator
	 *
	 * @param string $path Path
	 *
	 * @return string
	 */
	protected function replace_forward_slash_with_directory_separator( $path ) {
		return str_replace( '/', DIRECTORY_SEPARATOR, $path );
	}

	/**
	 * Replace current directory separator with forward slash
	 *
	 * @param string $path Path
	 *
	 * @return string
	 */
	protected function replace_directory_separator_with_forward_slash( $path ) {
		return str_replace( DIRECTORY_SEPARATOR, '/', $path );
	}

	/**
	 * Escape Windows directory separator
	 *
	 * @param string $path Path
	 *
	 * @return string
	 */
	protected function escape_windows_directory_separator( $path ) {
		return preg_replace( '/[\\\\]+/', '\\\\\\\\', $path );
	}

	/**
	 * Validate archive file
	 *
	 * @return bool
	 */
	public function is_valid() {
		// Failed detecting the current file pointer offset
		if ( ( $offset = @ftell( $this->file_handle ) ) === false ) {
			return false;
		}

		// Failed seeking the beginning of EOL block
		if ( @fseek( $this->file_handle, -static::HEADER_SIZE, SEEK_END ) === -1 ) {
			return false;
		}

		// Get end of file block
		if ( ( $block = @fread( $this->file_handle, static::HEADER_SIZE ) ) === false ) {
			return false;
		}

		// Failed returning to original offset
		if ( @fseek( $this->file_handle, $offset, SEEK_SET ) === -1 ) {
			return false;
		}

		// Trailing block does not match EOL
		if ( $this->is_eof_block( $block ) === false ) {
			return false;
		}

		return true;
	}

	/**
	 * Truncates the archive file
	 *
	 * @return void
	 */
	public function truncate() {
		if ( ( $offset = @ftell( $this->file_handle ) ) === false ) {
			throw new Ai1wm_Not_Tellable_Exception( sprintf( __( 'Could not tell offset of file. File: %s', 'all-in-one-wp-migration' ), $this->file_name ) );
		}

		if ( @filesize( $this->file_name ) > $offset ) {
			if ( @ftruncate( $this->file_handle, $offset ) === false ) {
				throw new Ai1wm_Not_Truncatable_Exception( sprintf( __( 'Could not truncate file. File: %s', 'all-in-one-wp-migration' ), $this->file_name ) );
			}
		}
	}

	/**
	 * Closes the archive file
	 *
	 * We either close the file or append the end of file block if complete argument is set to true
	 *
	 * @param bool        $complete          Flag to append end of file block
	 * @param string|null $archive_crc_value Pre-calculated archive CRC32 (optional)
	 *
	 * @return void
	 */
	public function close( $complete = false, $archive_crc_value = null ) {
		// Are we done appending to the file?
		if ( true === $complete ) {
			$this->append_eof( $archive_crc_value );
		}

		if ( @fclose( $this->file_handle ) === false ) {
			throw new Ai1wm_Not_Closable_Exception( sprintf( __( 'Could not close file. File: %s', 'all-in-one-wp-migration' ), $this->file_name ) );
		}
	}

	/**
	 * Generate end of file block
	 *
	 * @param string $archive_crc_value Archive CRC
	 *
	 * @return string
	 */
	protected function get_eof_block( $archive_crc_size = null, $archive_crc_value = null ) {
		return pack( 'a255a14a4100a8', '', $archive_crc_size, '', $archive_crc_value );
	}

	/**
	 * Check if a block is an end of file block (v1 or v2)
	 *
	 * @param string $block The block to check
	 *
	 * @return bool
	 */
	protected function is_eof_block( $block ) {
		return $this->is_v1_eof( $block ) || $this->is_v2_eof( $block );
	}

	/**
	 * Check if a block is a v1 end of file block (all null bytes)
	 *
	 * @param string $block The block to check
	 *
	 * @return bool
	 */
	protected function is_v1_eof( $block ) {
		return $this->get_eof_block() === $block;
	}

	/**
	 * Check if a block is a v2 end of file block
	 *
	 * @param string $block The block to check
	 *
	 * @return bool
	 */
	protected function is_v2_eof( $block ) {
		// Unpack end of file data
		if ( ( $data = unpack( 'a255/a14size/a4100/a8crc32', $block ) ) ) {
			if ( isset( $data['size'], $data['crc32'] ) ) {
				if ( preg_match( '/^[0-9a-f]{8}$/i', $data['crc32'] ) ) {
					return $this->get_eof_block( $data['size'], $data['crc32'] ) === $block;
				}
			}
		}

		return false;
	}

	/**
	 * Get archive CRC from EOF block (v2 only)
	 *
	 * @return string|null CRC32 hex string or null if v1 archive
	 */
	public function get_archive_crc_value() {
		if ( is_null( $this->archive_crc_value ) ) {
			$this->set_archive_crc_data();
		}

		return $this->archive_crc_value;
	}

	/**
	 * Get archive CRC size from EOF block (v2 only)
	 *
	 * @return int|null Size hex string or null if v1 archive
	 */
	public function get_archive_crc_size() {
		if ( is_null( $this->archive_crc_size ) ) {
			$this->set_archive_crc_data();
		}

		return $this->archive_crc_size;
	}

	/**
	 * Set archive CRC value and size from the v2 EOF block
	 *
	 * @return void
	 */
	protected function set_archive_crc_data() {
		// Failed detecting the current file pointer offset
		if ( ( $offset = @ftell( $this->file_handle ) ) === false ) {
			return;
		}

		// Failed seeking the beginning of EOL block
		if ( @fseek( $this->file_handle, -static::HEADER_SIZE, SEEK_END ) === -1 ) {
			return;
		}

		// Get end of file block
		if ( ( $block = @fread( $this->file_handle, static::HEADER_SIZE ) ) === false ) {
			return;
		}

		// Failed returning to original offset
		if ( @fseek( $this->file_handle, $offset, SEEK_SET ) === -1 ) {
			return;
		}

		// Check if v2 EOF
		if ( $this->is_v2_eof( $block ) === false ) {
			return;
		}

		// Unpack end of file data
		if ( ( $data = unpack( 'a255/a14size/a4100/a8crc32', $block ) ) ) {
			if ( isset( $data['crc32'] ) ) {
				$this->archive_crc_value = trim( $data['crc32'] );
			}

			if ( isset( $data['size'] ) ) {
				$this->archive_crc_size = (int) trim( $data['size'] );
			}
		}
	}
}
