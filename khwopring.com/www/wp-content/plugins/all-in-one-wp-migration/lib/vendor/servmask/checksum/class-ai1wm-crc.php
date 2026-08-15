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

class Ai1wm_Crc {

	/**
	 * Calculate CRC32 checksum for a file
	 *
	 * @param  string $file_path Path to the file
	 * @return string|null       CRC32 checksum as hexadecimal string or null on error
	 */
	public static function calculate_file_crc32( $file_path ) {
		if ( ! file_exists( $file_path ) || ! is_readable( $file_path ) ) {
			return null;
		}

		// Use hash_file for CRC32b (CRC32 with reversed bit order, more standard)
		$crc = hash_file( 'crc32b', $file_path );

		return $crc;
	}

	/**
	 * Verify file CRC32 checksum
	 *
	 * @param  string $file_path    Path to the file
	 * @param  string $expected_crc Expected CRC32 checksum
	 * @return bool                 True if CRC matches, false otherwise
	 */
	public static function verify_file_crc32( $file_path, $expected_crc ) {
		$calculated_crc = self::calculate_file_crc32( $file_path );

		if ( $calculated_crc === null ) {
			return false;
		}

		return strcasecmp( $calculated_crc, $expected_crc ) === 0;
	}

	/**
	 * Initialize CRC32 hash context for incremental calculation
	 *
	 * @return resource|\HashContext Hash context
	 */
	public static function init_crc32() {
		return hash_init( 'crc32b' );
	}

	/**
	 * Update CRC32 hash with a data chunk
	 *
	 * @param  resource|\HashContext $context Hash context
	 * @param  string      $data    Data chunk to add
	 * @return void
	 */
	public static function update_crc32( $context, $data ) {
		hash_update( $context, $data );
	}

	/**
	 * Finalize CRC32 calculation and return result
	 *
	 * @param  resource|\HashContext $context Hash context
	 * @return string               CRC32 checksum as hexadecimal string
	 */
	public static function finalize_crc32( $context ) {
		return hash_final( $context );
	}

	/**
	 * Combine two CRC32 checksums
	 *
	 * This method mathematically combines two CRC32 values, allowing resumable
	 * CRC calculation across multiple processing cycles (e.g., handling timeouts).
	 *
	 * Based on zlib's crc32_combine algorithm using GF(2) polynomial arithmetic.
	 *
	 * @param  string $crc1_hex CRC32 of first data block (hex string)
	 * @param  string $crc2_hex CRC32 of second data block (hex string)
	 * @param  int    $len2     Length of second data block in bytes
	 * @return string           Combined CRC32 checksum as hexadecimal string
	 */
	public static function combine_crc32( $crc1_hex, $crc2_hex, $len2 ) {
		// CRC32 polynomial (reversed)
		$poly = 0xEDB88320;

		// Convert hex strings to integers
		$crc1 = hexdec( $crc1_hex );
		$crc2 = hexdec( $crc2_hex );

		// If second block is empty, return first CRC unchanged
		if ( $len2 === 0 ) {
			return sprintf( '%08x', $crc1 );
		}

		// Build operator matrix for x^n where n = len2 * 8
		// This represents multiplication by x^(8*len2) mod poly
		$even    = array_fill( 0, 32, 0 );
		$even[0] = $poly;
		$row     = 1;
		for ( $n = 1; $n < 32; $n++ ) {
			$even[ $n ] = $row;
			$row        = $row << 1;
		}

		// Square to get x^2, x^4, x^8, etc.
		$odd = array_fill( 0, 32, 0 );
		self::gf2_matrix_square( $odd, $even );
		self::gf2_matrix_square( $even, $odd );

		// Apply len2 zeros to crc1 by repeatedly squaring and applying
		do {
			// Apply zeros operator for this bit of len2
			self::gf2_matrix_square( $odd, $even );
			if ( $len2 & 1 ) {
				$crc1 = self::gf2_matrix_times( $odd, $crc1 );
			}
			$len2 >>= 1;

			// If no more bits, we're done
			if ( $len2 === 0 ) {
				break;
			}

			// Square again for next bit
			self::gf2_matrix_square( $even, $odd );
			if ( $len2 & 1 ) {
				$crc1 = self::gf2_matrix_times( $even, $crc1 );
			}
			$len2 >>= 1;

		} while ( $len2 !== 0 );

		// Combine the two CRCs
		$crc1 ^= $crc2;

		return sprintf( '%08x', $crc1 );
	}

	/**
	 * Matrix multiplication in GF(2)
	 *
	 * @param  array $mat Matrix
	 * @param  int   $vec Vector
	 * @return int        Result
	 */
	private static function gf2_matrix_times( $mat, $vec ) {
		$sum       = 0;
		$mat_index = 0;

		while ( $vec ) {
			if ( $vec & 1 ) {
				$sum ^= $mat[ $mat_index ];
			}
			$vec = ( $vec >> 1 ) & 0x7FFFFFFF;
			$mat_index++;
		}

		return $sum;
	}

	/**
	 * Square a matrix in GF(2)
	 *
	 * @param  array $square Result matrix (passed by reference)
	 * @param  array $mat    Input matrix
	 * @return void
	 */
	private static function gf2_matrix_square( &$square, $mat ) {
		for ( $n = 0; $n < 32; $n++ ) {
			$square[ $n ] = self::gf2_matrix_times( $mat, $mat[ $n ] );
		}
	}
}
