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

class Ai1wm_Database_Mariadb extends Ai1wm_Database_Mysqli {

	/**
	 * Replace column types
	 *
	 * @param  string $input Column value
	 * @return string
	 */
	protected function replace_column_types( $input ) {
		static $search  = null;
		static $replace = null;

		// Cache column types on first call
		if ( is_null( $search ) || is_null( $replace ) ) {
			$search  = array();
			$replace = array();

			// Convert INET4 column type (10.10.0)
			if ( version_compare( $this->server_version(), '10.10.0', '<' ) ) {
				$search[]  = '/(?<!`)\bINET4\b(?!\s*\()/i';
				$replace[] = 'VARCHAR(15)';
			}

			// Convert INET6 column type (10.5.0)
			if ( version_compare( $this->server_version(), '10.5.0', '<' ) ) {
				$search[]  = '/(?<!`)\bINET6\b(?!\s*\()/i';
				$replace[] = 'VARCHAR(45)';
			}

			// Convert UUID column type (10.7.0)
			if ( version_compare( $this->server_version(), '10.7.0', '<' ) ) {
				$search[]  = '/(?<!`)\bUUID\b(?!\s*\()/i';
				$replace[] = 'CHAR(36)';
			}

			// Convert XMLTYPE column type (12.3.0)
			if ( version_compare( $this->server_version(), '12.3.0', '<' ) ) {
				$search[]  = '/(?<!`)\bXMLTYPE\b(?!\s*\()/i';
				$replace[] = 'LONGTEXT';
			}

			// Convert VECTOR(N) column type (11.7.1)
			if ( version_compare( $this->server_version(), '11.7.1', '<' ) ) {
				$search[]  = '/(?<!`)\bVECTOR\s*\(\s*\d+\s*\)/i';
				$replace[] = 'BLOB';
			}
		}

		return preg_replace( $search, $replace, $input );
	}
}
