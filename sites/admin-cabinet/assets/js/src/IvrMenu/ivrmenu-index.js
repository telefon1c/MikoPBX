/*
 * MikoPBX - free phone system for small business
 * Copyright (C) 2017-2023 Alexey Portnov and Nikolay Beketov
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program.
 * If not, see <https://www.gnu.org/licenses/>.
 */

/* global globalRootUrl, SemanticLocalization */

const IvrMenuTable = {
	$ivrTable: $('#ivr-menu-table'),
	initialize() {
		$('.menu-row td').on('dblclick', (e) => {
			const id = $(e.target).closest('tr').attr('id');
			window.location = `${globalRootUrl}ivr-menu/modify/${id}`;
		});

		IvrMenuTable.initializeDataTable();
	},

	/**
	 * Initialize data tables on table
	 */
	initializeDataTable() {
		IvrMenuTable.$ivrTable.DataTable({
			lengthChange: false,
			paging: false,
			columns: [
				null,
				null,
				null,
				null,
				null,
				{orderable: false, searchable: false},
			],
			order: [1, 'asc'],
			language: SemanticLocalization.dataTableLocalisation,
		});
		$('#add-new-button').appendTo($('div.eight.column:eq(0)'));
	},
};

$(document).ready(() => {
	IvrMenuTable.initialize();
});

