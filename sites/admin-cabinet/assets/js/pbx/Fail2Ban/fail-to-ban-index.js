"use strict";

/*
 * MikoPBX - free phone system for small business
 * Copyright © 2017-2024 Alexey Portnov and Nikolay Beketov
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

/* global globalTranslate, PbxApi, Form, globalRootUrl, Datatable, SemanticLocalization */

/**
 * The `fail2BanIndex` object contains methods and variables for managing the Fail2Ban system.
 *
 * @module fail2BanIndex
 */
var fail2BanIndex = {
  /**
   * jQuery object for the form.
   * @type {jQuery}
   */
  $formObj: $('#fail2ban-settings-form'),

  /**
   * The list of banned IPs
   * @type {jQuery}
   */
  $bannedIpListTable: $('#banned-ip-list-table'),

  /**
   * The list of banned IPs
   * @type {Datatable}
   */
  dataTable: null,

  /**
   * The unban buttons
   * @type {jQuery}
   */
  $unbanButtons: $('.unban-button'),

  /**
   * The global search input element.
   * @type {jQuery}
   */
  $globalSearch: $('#global-search'),

  /**
   * Validation rules for the form fields before submission.
   *
   * @type {object}
   */
  validateRules: {
    maxretry: {
      identifier: 'maxretry',
      rules: [{
        type: 'integer[3..99]',
        prompt: globalTranslate.f2b_ValidateMaxRetryRange
      }]
    },
    findtime: {
      identifier: 'findtime',
      rules: [{
        type: 'integer[300..86400]',
        prompt: globalTranslate.f2b_ValidateFindTimeRange
      }]
    },
    bantime: {
      identifier: 'bantime',
      rules: [{
        type: 'integer[300..86400]',
        prompt: globalTranslate.f2b_ValidateBanTimeRange
      }]
    }
  },
  // This method initializes the Fail2Ban management interface.
  initialize: function initialize() {
    $('#fail2ban-tab-menu .item').tab();
    fail2BanIndex.initializeDataTable();
    fail2BanIndex.initializeForm();
    PbxApi.FirewallGetBannedIp(fail2BanIndex.cbGetBannedIpList);
    fail2BanIndex.$bannedIpListTable.on('click', fail2BanIndex.$unbanButtons, function (e) {
      var unbannedIp = $(e.target).attr('data-value');
      fail2BanIndex.$bannedIpListTable.addClass('loading');
      PbxApi.FirewallUnBanIp(unbannedIp, fail2BanIndex.cbAfterUnBanIp);
    });
  },

  /**
   * Initialize data table on the page
   *
   */
  initializeDataTable: function initializeDataTable() {
    $('#fail2ban-tab-menu .item').tab({
      onVisible: function onVisible() {
        if ($(this).data('tab') === 'banned' && fail2BanIndex.dataTable !== null) {
          var newPageLength = fail2BanIndex.calculatePageLength();
          fail2BanIndex.dataTable.page.len(newPageLength).draw(false);
        }
      }
    });
    fail2BanIndex.dataTable = fail2BanIndex.$bannedIpListTable.DataTable({
      // destroy: true,
      lengthChange: false,
      paging: true,
      pageLength: fail2BanIndex.calculatePageLength(),
      scrollCollapse: true,
      deferRender: true,
      columns: [// IP
      {
        orderable: true,
        // This column is orderable
        searchable: true // This column is searchable

      }, // Reason
      {
        orderable: false,
        // This column is not orderable
        searchable: false // This column is not searchable

      }, // Buttons
      {
        orderable: false,
        // This column is orderable
        searchable: false // This column is searchable

      }],
      order: [0, 'asc'],
      language: SemanticLocalization.dataTableLocalisation,

      /**
       * Constructs the Extensions row.
       * @param {HTMLElement} row - The row element.
       * @param {Array} data - The row data.
       */
      createdRow: function createdRow(row, data) {
        $('td', row).eq(0).addClass('collapsing');
        $('td', row).eq(2).addClass('collapsing');
      }
    });
  },
  // This callback method is used to display the list of banned IPs.
  cbGetBannedIpList: function cbGetBannedIpList(response) {
    fail2BanIndex.$bannedIpListTable.removeClass('loading');

    if (response === false) {
      return;
    } // Clear the DataTable


    fail2BanIndex.dataTable.clear(); // Prepare the new data to be added

    var newData = [];
    Object.keys(response).forEach(function (ip) {
      var bans = response[ip]; // Combine all reasons and dates for this IP into one string

      var reasonsDatesCombined = bans.map(function (ban) {
        var blockDate = new Date(ban.timeofban * 1000).toLocaleString();
        var reason = "f2b_Jail_".concat(ban.jail);

        if (reason in globalTranslate) {
          reason = globalTranslate[reason];
        }

        return "".concat(reason, " - ").concat(blockDate);
      }).join('<br>'); // Use line breaks to separate each reason-date pair
      // Construct a row: IP, Combined Reasons and Dates, Unban Button

      var row = [ip, reasonsDatesCombined, "<button class=\"ui icon basic mini button right floated unban-button\" data-value=\"".concat(ip, "\"><i class=\"icon trash red\"></i>").concat(globalTranslate.f2b_Unban, "</button>")];
      newData.push(row);
    }); // Add the new data and redraw the table

    fail2BanIndex.dataTable.rows.add(newData).draw();
  },
  // This callback method is used after an IP has been unbanned.
  cbAfterUnBanIp: function cbAfterUnBanIp() {
    PbxApi.FirewallGetBannedIp(fail2BanIndex.cbGetBannedIpList);
  },

  /**
   * Callback function to be called before the form is sent
   * @param {Object} settings - The current settings of the form
   * @returns {Object} - The updated settings of the form
   */
  cbBeforeSendForm: function cbBeforeSendForm(settings) {
    var result = settings;
    result.data = fail2BanIndex.$formObj.form('get values');
    return result;
  },

  /**
   * Callback function to be called after the form has been sent.
   * @param {Object} response - The response from the server after the form is sent
   */
  cbAfterSendForm: function cbAfterSendForm(response) {},

  /**
   * Calculate data table page length
   *
   * @returns {number}
   */
  calculatePageLength: function calculatePageLength() {
    // Calculate row height
    var rowHeight = fail2BanIndex.$bannedIpListTable.find('tr').last().outerHeight(); // Calculate window height and available space for table

    var windowHeight = window.innerHeight;
    var headerFooterHeight = 400; // Estimate height for header, footer, and other elements
    // Calculate new page length

    return Math.max(Math.floor((windowHeight - headerFooterHeight) / rowHeight), 10);
  },

  /**
   * Initialize the form with custom settings
   */
  initializeForm: function initializeForm() {
    Form.$formObj = fail2BanIndex.$formObj;
    Form.url = "".concat(globalRootUrl, "fail2-ban/save"); // Form submission URL

    Form.validateRules = fail2BanIndex.validateRules; // Form validation rules

    Form.cbBeforeSendForm = fail2BanIndex.cbBeforeSendForm; // Callback before form is sent

    Form.cbAfterSendForm = fail2BanIndex.cbAfterSendForm; // Callback after form is sent

    Form.initialize();
  }
}; // When the document is ready, initialize the Fail2Ban management interface.

$(document).ready(function () {
  fail2BanIndex.initialize();
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9GYWlsMkJhbi9mYWlsLXRvLWJhbi1pbmRleC5qcyJdLCJuYW1lcyI6WyJmYWlsMkJhbkluZGV4IiwiJGZvcm1PYmoiLCIkIiwiJGJhbm5lZElwTGlzdFRhYmxlIiwiZGF0YVRhYmxlIiwiJHVuYmFuQnV0dG9ucyIsIiRnbG9iYWxTZWFyY2giLCJ2YWxpZGF0ZVJ1bGVzIiwibWF4cmV0cnkiLCJpZGVudGlmaWVyIiwicnVsZXMiLCJ0eXBlIiwicHJvbXB0IiwiZ2xvYmFsVHJhbnNsYXRlIiwiZjJiX1ZhbGlkYXRlTWF4UmV0cnlSYW5nZSIsImZpbmR0aW1lIiwiZjJiX1ZhbGlkYXRlRmluZFRpbWVSYW5nZSIsImJhbnRpbWUiLCJmMmJfVmFsaWRhdGVCYW5UaW1lUmFuZ2UiLCJpbml0aWFsaXplIiwidGFiIiwiaW5pdGlhbGl6ZURhdGFUYWJsZSIsImluaXRpYWxpemVGb3JtIiwiUGJ4QXBpIiwiRmlyZXdhbGxHZXRCYW5uZWRJcCIsImNiR2V0QmFubmVkSXBMaXN0Iiwib24iLCJlIiwidW5iYW5uZWRJcCIsInRhcmdldCIsImF0dHIiLCJhZGRDbGFzcyIsIkZpcmV3YWxsVW5CYW5JcCIsImNiQWZ0ZXJVbkJhbklwIiwib25WaXNpYmxlIiwiZGF0YSIsIm5ld1BhZ2VMZW5ndGgiLCJjYWxjdWxhdGVQYWdlTGVuZ3RoIiwicGFnZSIsImxlbiIsImRyYXciLCJEYXRhVGFibGUiLCJsZW5ndGhDaGFuZ2UiLCJwYWdpbmciLCJwYWdlTGVuZ3RoIiwic2Nyb2xsQ29sbGFwc2UiLCJkZWZlclJlbmRlciIsImNvbHVtbnMiLCJvcmRlcmFibGUiLCJzZWFyY2hhYmxlIiwib3JkZXIiLCJsYW5ndWFnZSIsIlNlbWFudGljTG9jYWxpemF0aW9uIiwiZGF0YVRhYmxlTG9jYWxpc2F0aW9uIiwiY3JlYXRlZFJvdyIsInJvdyIsImVxIiwicmVzcG9uc2UiLCJyZW1vdmVDbGFzcyIsImNsZWFyIiwibmV3RGF0YSIsIk9iamVjdCIsImtleXMiLCJmb3JFYWNoIiwiaXAiLCJiYW5zIiwicmVhc29uc0RhdGVzQ29tYmluZWQiLCJtYXAiLCJiYW4iLCJibG9ja0RhdGUiLCJEYXRlIiwidGltZW9mYmFuIiwidG9Mb2NhbGVTdHJpbmciLCJyZWFzb24iLCJqYWlsIiwiam9pbiIsImYyYl9VbmJhbiIsInB1c2giLCJyb3dzIiwiYWRkIiwiY2JCZWZvcmVTZW5kRm9ybSIsInNldHRpbmdzIiwicmVzdWx0IiwiZm9ybSIsImNiQWZ0ZXJTZW5kRm9ybSIsInJvd0hlaWdodCIsImZpbmQiLCJsYXN0Iiwib3V0ZXJIZWlnaHQiLCJ3aW5kb3dIZWlnaHQiLCJ3aW5kb3ciLCJpbm5lckhlaWdodCIsImhlYWRlckZvb3RlckhlaWdodCIsIk1hdGgiLCJtYXgiLCJmbG9vciIsIkZvcm0iLCJ1cmwiLCJnbG9iYWxSb290VXJsIiwiZG9jdW1lbnQiLCJyZWFkeSJdLCJtYXBwaW5ncyI6Ijs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFNQSxhQUFhLEdBQUc7QUFFbEI7QUFDSjtBQUNBO0FBQ0E7QUFDSUMsRUFBQUEsUUFBUSxFQUFFQyxDQUFDLENBQUMseUJBQUQsQ0FOTzs7QUFRbEI7QUFDSjtBQUNBO0FBQ0E7QUFDSUMsRUFBQUEsa0JBQWtCLEVBQUVELENBQUMsQ0FBQyx1QkFBRCxDQVpIOztBQWNsQjtBQUNKO0FBQ0E7QUFDQTtBQUNJRSxFQUFBQSxTQUFTLEVBQUUsSUFsQk87O0FBb0JsQjtBQUNKO0FBQ0E7QUFDQTtBQUNJQyxFQUFBQSxhQUFhLEVBQUVILENBQUMsQ0FBQyxlQUFELENBeEJFOztBQTBCbEI7QUFDSjtBQUNBO0FBQ0E7QUFDSUksRUFBQUEsYUFBYSxFQUFFSixDQUFDLENBQUMsZ0JBQUQsQ0E5QkU7O0FBZ0NsQjtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0lLLEVBQUFBLGFBQWEs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TGEsQ0FLeUM7O0FBQ3REWSxJQUFBQSxJQUFJLENBQUM3RSxVQUFMO0FBQ0g7QUE1TmlCLENBQXRCLEMsQ0ErTkE7O0FBQ0FqQixDQUFDLENBQUNpRyxRQUFELENBQUQsQ0FBWUMsS0FBWixDQUFrQixZQUFNO0FBQ3BCcEcsRUFBQUEsYUFBYSxDQUFDbUIsVUFBZDtBQUNILENBRkQiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogTWlrb1BCWCAtIGZyZWUgcGhvbmUgc3lzdGVtIGZvciBzbWFsbCBidXNpbmVzc1xuICogQ29weXJpZ2h0IMKpIDIwMTctMjAyNCBBbGV4ZXkgUG9ydG5vdiBhbmQgTmlrb2xheSBCZWtldG92XG4gKlxuICogVGhpcyBwcm9ncmFtIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbiAqIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uOyBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxuICogKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbiAqIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG4gKiBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG4gKiBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFsb25nIHdpdGggdGhpcyBwcm9ncmFtLlxuICogSWYgbm90LCBzZWUgPGh0dHBzOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqL1xuXG4vKiBnbG9iYWwgZ2xvYmFsVHJhbnNsYXRlLCBQYnhBcGksIEZvcm0sIGdsb2JhbFJvb3RVcmwsIERhdGF0YWJsZSwgU2VtYW50aWNMb2NhbGl6YXRpb24gKi9cbi8qKlxuICogVGhlIGBmYWlsMkJhbkluZGV4YCBvYmplY3QgY29udGFpbnMgbWV0aG9kcyBhbmQgdmFyaWFibGVzIGZvciBtYW5hZ2luZyB0aGUgRmFpbDJCYW4gc3lzdGVtLlxuICpcbiAqIEBtb2R1bGUgZmFpbDJCYW5JbmRleFxuICovXG5jb25zdCBmYWlsMkJhbkluZGV4ID0ge1xuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIGZvcm0uXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkZm9ybU9iajogJCgnI2ZhaWwyYmFuLXNldHRpbmdzLWZvcm0nKSxcblxuICAgIC8qKlxuICAgICAqIFRoZSBsaXN0IG9mIGJhbm5lZCBJUHNcbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRiYW5uZWRJcExpc3RUYWJsZTogJCgnI2Jhbm5lZC1pcC1saXN0LXRhYmxlJyksXG5cbiAgICAvKipcbiAgICAgKiBUaGUgbGlzdCBvZiBiYW5uZWQgSVBzXG4gICAgICogQHR5cGUge0RhdGF0YWJsZX1cbiAgICAgKi9cbiAgICBkYXRhVGFibGU6IG51bGwsXG5cbiAgICAvKipcbiAgICAgKiBUaGUgdW5iYW4gYnV0dG9uc1xuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJHVuYmFuQnV0dG9uczogJCgnLnVuYmFuLWJ1dHRvbicpLFxuXG4gICAgLyoqXG4gICAgICogVGhlIGdsb2JhbCBzZWFyY2ggaW5wdXQgZWxlbWVudC5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRnbG9iYWxTZWFyY2g6ICQoJyNnbG9iYWwtc2VhcmNoJyksXG5cbiAgICAvKipcbiAgICAgKiBWYWxpZGF0aW9uIHJ1bGVzIGZvciB0aGUgZm9ybSBmaWVsZHMgYmVmb3JlIHN1Ym1pc3Npb24uXG4gICAgICpcbiAgICAgKiBAdHlwZSB7b2JqZWN0fVxuICAgICAqL1xuICAgIHZhbGlkYXRlUnVsZXM6IHtcbiAgICAgICAgbWF4cmV0cnk6IHtcbiAgICAgICAgICAgIGlkZW50aWZpZXI6ICdtYXhyZXRyeScsXG4gICAgICAgICAgICBydWxlczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2ludGVnZXJbMy4uOTldJyxcbiAgICAgICAgICAgICAgICAgICAgcHJvbXB0OiBnbG9iYWxUcmFuc2xhdGUuZjJiX1ZhbGlkYXRlTWF4UmV0cnlSYW5nZSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAgZmluZHRpbWU6IHtcbiAgICAgICAgICAgIGlkZW50aWZpZXI6ICdmaW5kdGltZScsXG4gICAgICAgICAgICBydWxlczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2ludGVnZXJbMzAwLi44NjQwMF0nLFxuICAgICAgICAgICAgICAgICAgICBwcm9tcHQ6IGdsb2JhbFRyYW5zbGF0ZS5mMmJfVmFsaWRhdGVGaW5kVGltZVJhbmdlLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICBiYW50aW1lOiB7XG4gICAgICAgICAgICBpZGVudGlmaWVyOiAnYmFudGltZScsXG4gICAgICAgICAgICBydWxlczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2ludGVnZXJbMzAwLi44NjQwMF0nLFxuICAgICAgICAgICAgICAgICAgICBwcm9tcHQ6IGdsb2JhbFRyYW5zbGF0ZS5mMmJfVmFsaWRhdGVCYW5UaW1lUmFuZ2UsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgfSxcblxuICAgIC8vIFRoaXMgbWV0aG9kIGluaXRpYWxpemVzIHRoZSBGYWlsMkJhbiBtYW5hZ2VtZW50IGludGVyZmFjZS5cbiAgICBpbml0aWFsaXplKCkge1xuICAgICAgICAkKCcjZmFpbDJiYW4tdGFiLW1lbnUgLml0ZW0nKS50YWIoKTtcbiAgICAgICAgZmFpbDJCYW5JbmRleC5pbml0aWFsaXplRGF0YVRhYmxlKCk7XG4gICAgICAgIGZhaWwyQmFuSW5kZXguaW5pdGlhbGl6ZUZvcm0oKTtcblxuICAgICAgICBQYnhBcGkuRmlyZXdhbGxHZXRCYW5uZWRJcChmYWlsMkJhbkluZGV4LmNiR2V0QmFubmVkSXBMaXN0KTtcblxuICAgICAgICBmYWlsMkJhbkluZGV4LiRiYW5uZWRJcExpc3RUYWJsZS5vbignY2xpY2snLCBmYWlsMkJhbkluZGV4LiR1bmJhbkJ1dHRvbnMsIChlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB1bmJhbm5lZElwID0gJChlLnRhcmdldCkuYXR0cignZGF0YS12YWx1ZScpO1xuICAgICAgICAgICAgZmFpbDJCYW5JbmRleC4kYmFubmVkSXBMaXN0VGFibGUuYWRkQ2xhc3MoJ2xvYWRpbmcnKTtcbiAgICAgICAgICAgIFBieEFwaS5GaXJld2FsbFVuQmFuSXAodW5iYW5uZWRJcCwgZmFpbDJCYW5JbmRleC5jYkFmdGVyVW5CYW5JcCk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplIGRhdGEgdGFibGUgb24gdGhlIHBhZ2VcbiAgICAgKlxuICAgICAqL1xuICAgIGluaXRpYWxpemVEYXRhVGFibGUoKXtcbiAgICAgICAgJCgnI2ZhaWwyYmFuLXRhYi1tZW51IC5pdGVtJykudGFiKHtcbiAgICAgICAgICAgIG9uVmlzaWJsZSgpe1xuICAgICAgICAgICAgICAgIGlmICgkKHRoaXMpLmRhdGEoJ3RhYicpPT09J2Jhbm5lZCcgJiYgZmFpbDJCYW5JbmRleC5kYXRhVGFibGUhPT1udWxsKXtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbmV3UGFnZUxlbmd0aCA9IGZhaWwyQmFuSW5kZXguY2FsY3VsYXRlUGFnZUxlbmd0aCgpO1xuICAgICAgICAgICAgICAgICAgICBmYWlsMkJhbkluZGV4LmRhdGFUYWJsZS5wYWdlLmxlbihuZXdQYWdlTGVuZ3RoKS5kcmF3KGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGZhaWwyQmFuSW5kZXguZGF0YVRhYmxlID0gZmFpbDJCYW5JbmRleC4kYmFubmVkSXBMaXN0VGFibGUuRGF0YVRhYmxlKHtcbiAgICAgICAgICAgIC8vIGRlc3Ryb3k6IHRydWUsXG4gICAgICAgICAgICBsZW5ndGhDaGFuZ2U6IGZhbHNlLFxuICAgICAgICAgICAgcGFnaW5nOiB0cnVlLFxuICAgICAgICAgICAgcGFnZUxlbmd0aDogZmFpbDJCYW5JbmRleC5jYWxjdWxhdGVQYWdlTGVuZ3RoKCksXG4gICAgICAgICAgICBzY3JvbGxDb2xsYXBzZTogdHJ1ZSxcbiAgICAgICAgICAgIGRlZmVyUmVuZGVyOiB0cnVlLFxuICAgICAgICAgICAgY29sdW1uczogW1xuICAgICAgICAgICAgICAgIC8vIElQXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBvcmRlcmFibGU6IHRydWUsICAvLyBUaGlzIGNvbHVtbiBpcyBvcmRlcmFibGVcbiAgICAgICAgICAgICAgICAgICAgc2VhcmNoYWJsZTogdHJ1ZSAgLy8gVGhpcyBjb2x1bW4gaXMgc2VhcmNoYWJsZVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgLy8gUmVhc29uXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBvcmRlcmFibGU6IGZhbHNlLCAgLy8gVGhpcyBjb2x1bW4gaXMgbm90IG9yZGVyYWJsZVxuICAgICAgICAgICAgICAgICAgICBzZWFyY2hhYmxlOiBmYWxzZSAgLy8gVGhpcyBjb2x1bW4gaXMgbm90IHNlYXJjaGFibGVcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIC8vIEJ1dHRvbnNcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG9yZGVyYWJsZTogZmFsc2UsICAvLyBUaGlzIGNvbHVtbiBpcyBvcmRlcmFibGVcbiAgICAgICAgICAgICAgICAgICAgc2VhcmNoYWJsZTogZmFsc2UgIC8vIFRoaXMgY29sdW1uIGlzIHNlYXJjaGFibGVcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIG9yZGVyOiBbMCwgJ2FzYyddLFxuICAgICAgICAgICAgbGFuZ3VhZ2U6IFNlbWFudGljTG9jYWxpemF0aW9uLmRhdGFUYWJsZUxvY2FsaXNhdGlvbixcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ29uc3RydWN0cyB0aGUgRXh0ZW5zaW9ucyByb3cuXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSByb3cgLSBUaGUgcm93IGVsZW1lbnQuXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0FycmF5fSBkYXRhIC0gVGhlIHJvdyBkYXRhLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBjcmVhdGVkUm93KHJvdywgZGF0YSkge1xuICAgICAgICAgICAgICAgICQoJ3RkJywgcm93KS5lcSgwKS5hZGRDbGFzcygnY29sbGFwc2luZycpO1xuICAgICAgICAgICAgICAgICQoJ3RkJywgcm93KS5lcSgyKS5hZGRDbGFzcygnY29sbGFwc2luZycpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8vIFRoaXMgY2FsbGJhY2sgbWV0aG9kIGlzIHVzZWQgdG8gZGlzcGxheSB0aGUgbGlzdCBvZiBiYW5uZWQgSVBzLlxuICAgIGNiR2V0QmFubmVkSXBMaXN0KHJlc3BvbnNlKSB7XG4gICAgICAgIGZhaWwyQmFuSW5kZXguJGJhbm5lZElwTGlzdFRhYmxlLnJlbW92ZUNsYXNzKCdsb2FkaW5nJyk7XG4gICAgICAgIGlmIChyZXNwb25zZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyBDbGVhciB0aGUgRGF0YVRhYmxlXG4gICAgICAgIGZhaWwyQmFuSW5kZXguZGF0YVRhYmxlLmNsZWFyKCk7XG5cbiAgICAgICAgLy8gUHJlcGFyZSB0aGUgbmV3IGRhdGEgdG8gYmUgYWRkZWRcbiAgICAgICAgbGV0IG5ld0RhdGEgPSBbXTtcbiAgICAgICAgT2JqZWN0LmtleXMocmVzcG9uc2UpLmZvckVhY2goaXAgPT4ge1xuICAgICAgICAgICAgY29uc3QgYmFucyA9IHJlc3BvbnNlW2lwXTtcbiAgICAgICAgICAgIC8vIENvbWJpbmUgYWxsIHJlYXNvbnMgYW5kIGRhdGVzIGZvciB0aGlzIElQIGludG8gb25lIHN0cmluZ1xuICAgICAgICAgICAgbGV0IHJlYXNvbnNEYXRlc0NvbWJpbmVkID0gYmFucy5tYXAoYmFuID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBibG9ja0RhdGUgPSBuZXcgRGF0ZShiYW4udGltZW9mYmFuICogMTAwMCkudG9Mb2NhbGVTdHJpbmcoKTtcbiAgICAgICAgICAgICAgICBsZXQgcmVhc29uID0gYGYyYl9KYWlsXyR7YmFuLmphaWx9YDtcbiAgICAgICAgICAgICAgICBpZiAocmVhc29uIGluIGdsb2JhbFRyYW5zbGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICByZWFzb24gPSBnbG9iYWxUcmFuc2xhdGVbcmVhc29uXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGAke3JlYXNvbn0gLSAke2Jsb2NrRGF0ZX1gO1xuICAgICAgICAgICAgfSkuam9pbignPGJyPicpOyAvLyBVc2UgbGluZSBicmVha3MgdG8gc2VwYXJhdGUgZWFjaCByZWFzb24tZGF0ZSBwYWlyXG5cbiAgICAgICAgICAgIC8vIENvbnN0cnVjdCBhIHJvdzogSVAsIENvbWJpbmVkIFJlYXNvbnMgYW5kIERhdGVzLCBVbmJhbiBCdXR0b25cbiAgICAgICAgICAgIGNvbnN0IHJvdyA9IFtcbiAgICAgICAgICAgICAgICBpcCxcbiAgICAgICAgICAgICAgICByZWFzb25zRGF0ZXNDb21iaW5lZCxcbiAgICAgICAgICAgICAgICBgPGJ1dHRvbiBjbGFzcz1cInVpIGljb24gYmFzaWMgbWluaSBidXR0b24gcmlnaHQgZmxvYXRlZCB1bmJhbi1idXR0b25cIiBkYXRhLXZhbHVlPVwiJHtpcH1cIj48aSBjbGFzcz1cImljb24gdHJhc2ggcmVkXCI+PC9pPiR7Z2xvYmFsVHJhbnNsYXRlLmYyYl9VbmJhbn08L2J1dHRvbj5gXG4gICAgICAgICAgICBdO1xuICAgICAgICAgICAgbmV3RGF0YS5wdXNoKHJvdyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEFkZCB0aGUgbmV3IGRhdGEgYW5kIHJlZHJhdyB0aGUgdGFibGVcbiAgICAgICAgZmFpbDJCYW5JbmRleC5kYXRhVGFibGUucm93cy5hZGQobmV3RGF0YSkuZHJhdygpO1xuICAgIH0sXG5cbiAgICAvLyBUaGlzIGNhbGxiYWNrIG1ldGhvZCBpcyB1c2VkIGFmdGVyIGFuIElQIGhhcyBiZWVuIHVuYmFubmVkLlxuICAgIGNiQWZ0ZXJVbkJhbklwKCkge1xuICAgICAgICBQYnhBcGkuRmlyZXdhbGxHZXRCYW5uZWRJcChmYWlsMkJhbkluZGV4LmNiR2V0QmFubmVkSXBMaXN0KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2FsbGJhY2sgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIGJlZm9yZSB0aGUgZm9ybSBpcyBzZW50XG4gICAgICogQHBhcmFtIHtPYmplY3R9IHNldHRpbmdzIC0gVGhlIGN1cnJlbnQgc2V0dGluZ3Mgb2YgdGhlIGZvcm1cbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSAtIFRoZSB1cGRhdGVkIHNldHRpbmdzIG9mIHRoZSBmb3JtXG4gICAgICovXG4gICAgY2JCZWZvcmVTZW5kRm9ybShzZXR0aW5ncykge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBzZXR0aW5ncztcbiAgICAgICAgcmVzdWx0LmRhdGEgPSBmYWlsMkJhbkluZGV4LiRmb3JtT2JqLmZvcm0oJ2dldCB2YWx1ZXMnKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2FsbGJhY2sgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIGFmdGVyIHRoZSBmb3JtIGhhcyBiZWVuIHNlbnQuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHJlc3BvbnNlIC0gVGhlIHJlc3BvbnNlIGZyb20gdGhlIHNlcnZlciBhZnRlciB0aGUgZm9ybSBpcyBzZW50XG4gICAgICovXG4gICAgY2JBZnRlclNlbmRGb3JtKHJlc3BvbnNlKSB7XG5cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2FsY3VsYXRlIGRhdGEgdGFibGUgcGFnZSBsZW5ndGhcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9XG4gICAgICovXG4gICAgY2FsY3VsYXRlUGFnZUxlbmd0aCgpIHtcbiAgICAgICAgLy8gQ2FsY3VsYXRlIHJvdyBoZWlnaHRcbiAgICAgICAgbGV0IHJvd0hlaWdodCA9IGZhaWwyQmFuSW5kZXguJGJhbm5lZElwTGlzdFRhYmxlLmZpbmQoJ3RyJykubGFzdCgpLm91dGVySGVpZ2h0KCk7XG4gICAgICAgIC8vIENhbGN1bGF0ZSB3aW5kb3cgaGVpZ2h0IGFuZCBhdmFpbGFibGUgc3BhY2UgZm9yIHRhYmxlXG4gICAgICAgIGNvbnN0IHdpbmRvd0hlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICAgICAgY29uc3QgaGVhZGVyRm9vdGVySGVpZ2h0ID0gNDAwOyAvLyBFc3RpbWF0ZSBoZWlnaHQgZm9yIGhlYWRlciwgZm9vdGVyLCBhbmQgb3RoZXIgZWxlbWVudHNcblxuICAgICAgICAvLyBDYWxjdWxhdGUgbmV3IHBhZ2UgbGVuZ3RoXG4gICAgICAgIHJldHVybiBNYXRoLm1heChNYXRoLmZsb29yKCh3aW5kb3dIZWlnaHQgLSBoZWFkZXJGb290ZXJIZWlnaHQpIC8gcm93SGVpZ2h0KSwgMTApO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplIHRoZSBmb3JtIHdpdGggY3VzdG9tIHNldHRpbmdzXG4gICAgICovXG4gICAgaW5pdGlhbGl6ZUZvcm0oKSB7XG4gICAgICAgIEZvcm0uJGZvcm1PYmogPSBmYWlsMkJhbkluZGV4LiRmb3JtT2JqO1xuICAgICAgICBGb3JtLnVybCA9IGAke2dsb2JhbFJvb3RVcmx9ZmFpbDItYmFuL3NhdmVgOyAvLyBGb3JtIHN1Ym1pc3Npb24gVVJMXG4gICAgICAgIEZvcm0udmFsaWRhdGVSdWxlcyA9IGZhaWwyQmFuSW5kZXgudmFsaWRhdGVSdWxlczsgLy8gRm9ybSB2YWxpZGF0aW9uIHJ1bGVzXG4gICAgICAgIEZvcm0uY2JCZWZvcmVTZW5kRm9ybSA9IGZhaWwyQmFuSW5kZXguY2JCZWZvcmVTZW5kRm9ybTsgLy8gQ2FsbGJhY2sgYmVmb3JlIGZvcm0gaXMgc2VudFxuICAgICAgICBGb3JtLmNiQWZ0ZXJTZW5kRm9ybSA9IGZhaWwyQmFuSW5kZXguY2JBZnRlclNlbmRGb3JtOyAvLyBDYWxsYmFjayBhZnRlciBmb3JtIGlzIHNlbnRcbiAgICAgICAgRm9ybS5pbml0aWFsaXplKCk7XG4gICAgfSxcbn07XG5cbi8vIFdoZW4gdGhlIGRvY3VtZW50IGlzIHJlYWR5LCBpbml0aWFsaXplIHRoZSBGYWlsMkJhbiBtYW5hZ2VtZW50IGludGVyZmFjZS5cbiQoZG9jdW1lbnQpLnJlYWR5KCgpID0+IHtcbiAgICBmYWlsMkJhbkluZGV4LmluaXRpYWxpemUoKTtcbn0pO1xuXG4iXX0=