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

/* global globalRootUrl, PbxApi, globalTranslate */

/**
 * Represents the extension module popup.
 * @class extensionModuleDetail
 * @memberof module:PbxExtensionModules
 */
var extensionModuleDetail = {
  /**
   * jQuery object for the module detail form.
   * @type {jQuery}
   */
  $moduleDetailPopup: $('#module-details-template'),

  /**
   * jQuery object for the table rows which activate the popup.
   * @type {jQuery}
   */
  $popupActivator: $('tr.module-row'),

  /**
   * Initialize extensionModuleDetail
   */
  initialize: function initialize() {
    extensionModuleDetail.$popupActivator.on('click', function (event) {
      var params = {};
      params.uniqid = $(event).closest('tr').attr('id');
      PbxApi.ModulesGetModuleInfo(params, extensionModuleDetail.cbAfterGetModuleDetails);
    });
  },
  initializeSlider: function initializeSlider($popup) {
    $popup.find('.right').on('click', function () {
      $popup.find('.slide').siblings('.active:not(:last-of-type)').removeClass('active').next().addClass('active');
    });
    $popup.find('.left').on('click', function () {
      $popup.find('..slide').siblings('.active:not(:first-of-type)').removeClass('active').prev().addClass('active');
    });
  },
  cbOnShowTheDetailPopup: function cbOnShowTheDetailPopup(event) {
    // Initialize images slider
    $newPopup = $(event).closest('.module-details-modal-form');
    extensionModuleDetail.initializeSlider($newPopup); // Initialize tab menu

    $newPopup.find('.module-details-menu .item').tab();
  },
  cbAfterGetModuleDetails: function cbAfterGetModuleDetails(result, response) {
    if (result) {
      var repoData = response.data; // Module detail popup form

      var _$newPopup = extensionModuleDetail.$moduleDetailPopup.clone(true);

      _$newPopup.attr('id', repoData.uniqid); // Module name


      _$newPopup.find('.module-name').text(repoData.name); // Module logo


      _$newPopup.find('.module-logo').src(repoData.logotype); // Module uniqid


      _$newPopup.find('.module-id').text(repoData.uniqid); // Install last release button


      _$newPopup.find('.main-install-button').attr('data-uniqid', repoData.uniqid); // Total count of installations


      _$newPopup.find('.module-count-installed').html(repoData.downloads); // Last release version


      _$newPopup.find('.module-latest-release').text(repoData.releases[0].version); // Developer


      var developerView = extensionModuleDetail.prepareDeveloperView(repoData);

      _$newPopup.find('.module-publisher').html(developerView); // Commercial


      var commercialView = extensionModuleDetail.prepareCommercialView(repoData.commercial);

      _$newPopup.find('.module-commercial').html(commercialView); // Release size


      var sizeText = extensionModuleDetail.convertBytesToReadableFormat(repoData.releases[0].size);

      _$newPopup.find('.module-latest-release-size').text(sizeText); // Screenshots


      var screenshotsView = extensionModuleDetail.prepareScreenshotsView(repoData.screenshots);

      _$newPopup.find('.module-screenshots').html(screenshotsView); // Description


      var descriptionView = extensionModuleDetail.prepareDescriptionView(repoData);

      _$newPopup.find('.module-description').html(descriptionView); // Changelog


      var changelogView = extensionModuleDetail.prepareChangeLogView(repoData);

      _$newPopup.find('.module-changelog').html(changelogView); // Show the popup


      _$newPopup.popup({
        show: true,
        position: 'top center',
        closable: true,
        onShow: extensionModuleDetail.cbOnShowTheDetailPopup
      });
    }
  },
  convertBytesToReadableFormat: function convertBytesToReadableFormat(bytes) {
    var megabytes = bytes / (1024 * 1024);
    var roundedMegabytes = megabytes.toFixed(2);
    return "".concat(roundedMegabytes, " Mb");
  },
  prepareCommercialView: function prepareCommercialView(commercial) {
    if (commercial === '1') {
      return '<i class="ui donate icon"></i> ' + globalTranslate.ext_CommercialModule;
    }

    return '<i class="puzzle piece icon"></i> ' + globalTranslate.ext_FreeModule;
  },
  prepareScreenshotsView: function prepareScreenshotsView(screenshots) {
    var html = '<div class="ui container">\n' + '            <div class="ui text container slides">\n' + '                <i class="big left angle icon"></i>\n' + '                <i class="big right angle icon"></i>';
    $.each(screenshots, function (index, screenshot) {
      if (index > 0) {
        html += "<div class=\"slide\"><img src=\"".concat(screenshot.url, "\" alt=\"").concat(screenshot.name, "\"></div>");
      } else {
        html += "<div class=\"slide active\"><img src=\"".concat(screenshot.url, "\" alt=\"").concat(screenshot.name, "\"></div>");
      }
    });
    html += '</div></div>';
    return html;
  },
  prepareDescriptionView: function prepareDescriptionView(repoData) {
    var html = "<div class=\"ui header\">".concat(repoData.name, "</div>");
    html += "<p>".concat(repoData.description, "</p>");
    html += "<div class=\"ui header\">".concat(globalTranslate.ext_UsefulLinks, "</div>");
    html += '<ul class="ui list">';
    html += "<li class=\"item\"><a href=\"".concat(repoData.promo_link, "\" target=\"_blank\">").concat(globalTranslate.ext_ExternalDescription, "</a></li>");
    html += '</ul>';
    return html;
  },
  prepareDeveloperView: function prepareDeveloperView(repoData) {
    var html = '';
    html += "".concat(repoData.developer);
    return html;
  },
  prepareChangeLogView: function prepareChangeLogView(repoData) {
    var html = '';
    $.each(repoData.releases, function (index, release) {
      var sizeText = extensionModuleDetail.convertBytesToReadableFormat(release.size);
      html += "<div class=\"ui header\">".concat(release.version, "</div>");
      html += "<p>".concat(release.changelog, "</p>");
      html += "<a href=\"#\" class=\"ui labeled basic button download\"\n               data-uniqid = \"".concat(repoData.uniqid, "\"\n               data-id =\"").concat(release.releaseID, "\">\n                <i class=\"icon download blue\"></i>\n                ").concat(globalTranslate.ext_InstallModule, " (").concat(sizeText, ")\n            </a>");
    });
    return html;
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9QYnhFeHRlbnNpb25Nb2R1bGVzL3BocC1leHRlbnNpb24tbW9kdWxlLWRldGFpbC5qcyJdLCJuYW1lcyI6WyJleHRlbnNpb25Nb2R1bGVEZXRhaWwiLCIkbW9kdWxlRGV0YWlsUG9wdXAiLCIkIiwiJHBvcHVwQWN0aXZhdG9yIiwiaW5pdGlhbGl6ZSIsIm9uIiwiZXZlbnQiLCJwYXJhbXMiLCJ1bmlxaWQiLCJjbG9zZXN0IiwiYXR0ciIsIlBieEFwaSIsIk1vZHVsZXNHZXRNb2R1bGVJbmZvIiwiY2JBZnRlckdldE1vZHVsZURldGFpbHMiLCJpbml0aWFsaXplU2xpZGVyIiwiJHBvcHVwIiwiZmluZCIsInNpYmxpbmdzIiwicmVtb3ZlQ2xhc3MiLCJuZXh0IiwiYWRkQ2xhc3MiLCJwcmV2IiwiY2JPblNob3dUaGVEZXRhaWxQb3B1cCIsIiRuZXdQb3B1cCIsInRhYiIsInJlc3VsdCIsInJlc3BvbnNlIiwicmVwb0RhdGEiLCJkYXRhIiwiY2xvbmUiLCJ0ZXh0IiwibmFtZSIsInNyYyIsImxvZ290eXBlIiwiaHRtbCIsImRvd25sb2FkcyIsInJlbGVhc2VzIiwidmVyc2lvbiIsImRldmVsb3BlclZpZXciLCJwcmVwYXJlRGV2ZWxvcGVyVmlldyIsImNvbW1lcmNpYWxWaWV3IiwicHJlcGFyZUNvbW1lcmNpYWxWaWV3IiwiY29tbWVyY2lhbCIsInNpemVUZXh0IiwiY29udmVydEJ5dGVzVG9SZWFkYWJsZUZvcm1hdCIsInNpemUiLCJzY3JlZW5zaG90c1ZpZXciLCJwcmVwYXJlU2NyZWVuc2hvdHNWaWV3Iiwic2NyZWVuc2hvdHMiLCJkZXNjcmlwdGlvblZpZXciLCJwcmVwYXJlRGVzY3JpcHRpb25WaWV3IiwiY2hhbmdlbG9nVmlldyIsInByZXBhcmVDaGFuZ2VMb2dWaWV3IiwicG9wdXAiLCJzaG93IiwicG9zaXRpb24iLCJjbG9zYWJsZSIsIm9uU2hvdyIsImJ5dGVzIiwibWVnYWJ5dGVzIiwicm91bmRlZE1lZ2FieXRlcyIsInRvRml4ZWQiLCJnbG9iYWxUcmFuc2xhdGUiLCJleHRfQ29tbWVyY2lhbE1vZHVsZSIsImV4dF9GcmVlTW9kdWxlIiwiZWFjaCIsImluZGV4Iiwic2NyZWVuc2hvdCIsInVybCIsImRlc2NyaXB0aW9uIiwiZXh0X1VzZWZ1bExpbmtzIiwicHJvbW9fbGluayIsImV4dF9FeHRlcm5hbERlc2NyaXB0aW9uIiwiZGV2ZWxvcGVyIiwicmVsZWFzZSIsImNoYW5nZWxvZyIsInJlbGVhc2VJRCIsImV4dF9JbnN0YWxsTW9kdWxlIl0sIm1hcHBpbmdzIjoiOztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQU1BLHFCQUFxQixHQUFHO0FBQzFCO0FBQ0o7QUFDQTtBQUNBO0FBQ0lDLEVBQUFBLGtCQUFrQixFQUFFQyxDQUFDLENBQUMsMEJBQUQsQ0FMSzs7QUFPMUI7QUFDSjtBQUNBO0FBQ0E7QUFDSUMsRUFBQUEsZUFBZSxFQUFFRCxDQUFDLENBQUMsZUFBRCxDQVhROztBQWExQjtBQUNKO0FBQ0E7QUFDSUUsRUFBQUEsVUFoQjBCLHdCQWdCYjtBQUNUSixJQUFBQSxxQkFBcUIsQ0FBQ0csZUFBdEIsQ0FBc0NFLEVBQXRDLENBQXlDLE9BQXpDLEVBQWlELFVBQUNDLEtBQUQsRUFBUztBQUN0RCxVQUFNQyxNQUFNLEdBQUcsRUFBZjtBQUNBQSxNQUFBQSxNQUFNLENBQUNDLE1BQVAsR0FBZ0JOLENBQUMsQ0FBQ0ksS0FBRCxDQUFELENBQVNHLE9BQVQsQ0FBaUIsSUFBakIsRUFBdUJDLElBQXZCLENBQTRCLElBQTVCLENBQWhCO0FBQ0FDLE1BQUFBLE1BQU0sQ0FBQ0Msb0JBQVAsQ0FBNEJMLE1BQTVCLEVBQW9DUCxxQkFBcUIsQ0FBQ2EsdUJBQTFEO0FBQ0gsS0FKRDtBQUtILEdBdEJ5QjtBQXVCMUJDLEVBQUFBLGdCQXZCMEIsNEJBdUJUQyxN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QyxXQUFKO0FBQ0FwQyxJQUFBQSxJQUFJLElBQUksc0JBQVI7QUFDQUEsSUFBQUEsSUFBSSwyQ0FBaUNQLFFBQVEsQ0FBQzRDLFVBQTFDLGtDQUF5RVQsZUFBZSxDQUFDVSx1QkFBekYsY0FBSjtBQUNBdEMsSUFBQUEsSUFBSSxJQUFJLE9BQVI7QUFDQSxXQUFPQSxJQUFQO0FBQ0gsR0FoSnlCO0FBaUoxQkssRUFBQUEsb0JBakowQixnQ0FpSkxaLFFBakpLLEVBaUpLO0FBQzNCLFFBQUlPLElBQUksR0FBRyxFQUFYO0FBQ0FBLElBQUFBLElBQUksY0FBT1AsUUFBUSxDQUFDOEMsU0FBaEIsQ0FBSjtBQUNBLFdBQU92QyxJQUFQO0FBQ0gsR0FySnlCO0FBc0oxQmtCLEVBQUFBLG9CQXRKMEIsZ0NBc0pMekIsUUF0SkssRUFzSks7QUFDM0IsUUFBSU8sSUFBSSxHQUFHLEVBQVg7QUFDQWhDLElBQUFBLENBQUMsQ0FBQytELElBQUYsQ0FBT3RDLFFBQVEsQ0FBQ1MsUUFBaEIsRUFBMEIsVUFBVThCLEtBQVYsRUFBaUJRLE9BQWpCLEVBQTBCO0FBQ2hELFVBQU0vQixRQUFRLEdBQUczQyxxQkFBcUIsQ0FBQzRDLDRCQUF0QixDQUFtRDhCLE9BQU8sQ0FBQzdCLElBQTNELENBQWpCO0FBQ0FYLE1BQUFBLElBQUksdUNBQTRCd0MsT0FBTyxDQUFDckMsT0FBcEMsV0FBSjtBQUNBSCxNQUFBQSxJQUFJLGlCQUFRd0MsT0FBTyxDQUFDQyxTQUFoQixTQUFKO0FBQ0F6QyxNQUFBQSxJQUFJLHVHQUNnQlAsUUFBUSxDQUFDbkIsTUFEekIsMkNBRVdrRSxPQUFPLENBQUNFLFNBRm5CLHdGQUlFZCxlQUFlLENBQUNlLGlCQUpsQixlQUl3Q2xDLFFBSnhDLHdCQUFKO0FBTUgsS0FWRDtBQVdBLFdBQU9ULElBQVA7QUFDSDtBQXBLeUIsQ0FBOUIiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogTWlrb1BCWCAtIGZyZWUgcGhvbmUgc3lzdGVtIGZvciBzbWFsbCBidXNpbmVzc1xuICogQ29weXJpZ2h0IMKpIDIwMTctMjAyNCBBbGV4ZXkgUG9ydG5vdiBhbmQgTmlrb2xheSBCZWtldG92XG4gKlxuICogVGhpcyBwcm9ncmFtIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbiAqIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uOyBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxuICogKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbiAqIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG4gKiBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG4gKiBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFsb25nIHdpdGggdGhpcyBwcm9ncmFtLlxuICogSWYgbm90LCBzZWUgPGh0dHBzOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqL1xuXG4vKiBnbG9iYWwgZ2xvYmFsUm9vdFVybCwgUGJ4QXBpLCBnbG9iYWxUcmFuc2xhdGUgKi9cblxuLyoqXG4gKiBSZXByZXNlbnRzIHRoZSBleHRlbnNpb24gbW9kdWxlIHBvcHVwLlxuICogQGNsYXNzIGV4dGVuc2lvbk1vZHVsZURldGFpbFxuICogQG1lbWJlcm9mIG1vZHVsZTpQYnhFeHRlbnNpb25Nb2R1bGVzXG4gKi9cbmNvbnN0IGV4dGVuc2lvbk1vZHVsZURldGFpbCA9IHtcbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgbW9kdWxlIGRldGFpbCBmb3JtLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJG1vZHVsZURldGFpbFBvcHVwOiAkKCcjbW9kdWxlLWRldGFpbHMtdGVtcGxhdGUnKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSB0YWJsZSByb3dzIHdoaWNoIGFjdGl2YXRlIHRoZSBwb3B1cC5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRwb3B1cEFjdGl2YXRvcjogJCgndHIubW9kdWxlLXJvdycpLFxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZSBleHRlbnNpb25Nb2R1bGVEZXRhaWxcbiAgICAgKi9cbiAgICBpbml0aWFsaXplKCkge1xuICAgICAgICBleHRlbnNpb25Nb2R1bGVEZXRhaWwuJHBvcHVwQWN0aXZhdG9yLm9uKCdjbGljaycsKGV2ZW50KT0+e1xuICAgICAgICAgICAgY29uc3QgcGFyYW1zID0ge307XG4gICAgICAgICAgICBwYXJhbXMudW5pcWlkID0gJChldmVudCkuY2xvc2VzdCgndHInKS5hdHRyKCdpZCcpO1xuICAgICAgICAgICAgUGJ4QXBpLk1vZHVsZXNHZXRNb2R1bGVJbmZvKHBhcmFtcywgZXh0ZW5zaW9uTW9kdWxlRGV0YWlsLmNiQWZ0ZXJHZXRNb2R1bGVEZXRhaWxzKTtcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBpbml0aWFsaXplU2xpZGVyKCRwb3B1cCl7XG4gICAgICAgICRwb3B1cC5maW5kKCcucmlnaHQnKVxuICAgICAgICAgICAgLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICRwb3B1cC5maW5kKCcuc2xpZGUnKVxuICAgICAgICAgICAgICAgICAgICAuc2libGluZ3MoJy5hY3RpdmU6bm90KDpsYXN0LW9mLXR5cGUpJylcbiAgICAgICAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdhY3RpdmUnKVxuICAgICAgICAgICAgICAgICAgICAubmV4dCgpXG4gICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcygnYWN0aXZlJyk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAkcG9wdXAuZmluZCgnLmxlZnQnKVxuICAgICAgICAgICAgLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICRwb3B1cC5maW5kKCcuLnNsaWRlJylcbiAgICAgICAgICAgICAgICAgICAgLnNpYmxpbmdzKCcuYWN0aXZlOm5vdCg6Zmlyc3Qtb2YtdHlwZSknKVxuICAgICAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpXG4gICAgICAgICAgICAgICAgICAgIC5wcmV2KClcbiAgICAgICAgICAgICAgICAgICAgLmFkZENsYXNzKCdhY3RpdmUnKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH0sXG4gICAgY2JPblNob3dUaGVEZXRhaWxQb3B1cChldmVudCkge1xuICAgICAgICAvLyBJbml0aWFsaXplIGltYWdlcyBzbGlkZXJcbiAgICAgICAgJG5ld1BvcHVwID0gJChldmVudCkuY2xvc2VzdCgnLm1vZHVsZS1kZXRhaWxzLW1vZGFsLWZvcm0nKVxuICAgICAgICBleHRlbnNpb25Nb2R1bGVEZXRhaWwuaW5pdGlhbGl6ZVNsaWRlcigkbmV3UG9wdXApO1xuXG4gICAgICAgIC8vIEluaXRpYWxpemUgdGFiIG1lbnVcbiAgICAgICAgJG5ld1BvcHVwLmZpbmQoJy5tb2R1bGUtZGV0YWlscy1tZW51IC5pdGVtJykudGFiKCk7XG4gICAgfSxcbiAgICBjYkFmdGVyR2V0TW9kdWxlRGV0YWlscyhyZXN1bHQsIHJlc3BvbnNlKSB7XG4gICAgICAgIGlmKHJlc3VsdCl7XG4gICAgICAgICAgICBjb25zdCByZXBvRGF0YSA9IHJlc3BvbnNlLmRhdGE7XG5cbiAgICAgICAgICAgIC8vIE1vZHVsZSBkZXRhaWwgcG9wdXAgZm9ybVxuICAgICAgICAgICAgY29uc3QgJG5ld1BvcHVwID0gZXh0ZW5zaW9uTW9kdWxlRGV0YWlsLiRtb2R1bGVEZXRhaWxQb3B1cC5jbG9uZSh0cnVlKTtcbiAgICAgICAgICAgICRuZXdQb3B1cC5hdHRyKCdpZCcsIHJlcG9EYXRhLnVuaXFpZCk7XG5cbiAgICAgICAgICAgIC8vIE1vZHVsZSBuYW1lXG4gICAgICAgICAgICAkbmV3UG9wdXAuZmluZCgnLm1vZHVsZS1uYW1lJykudGV4dChyZXBvRGF0YS5uYW1lKTtcblxuICAgICAgICAgICAgLy8gTW9kdWxlIGxvZ29cbiAgICAgICAgICAgICRuZXdQb3B1cC5maW5kKCcubW9kdWxlLWxvZ28nKS5zcmMocmVwb0RhdGEubG9nb3R5cGUpO1xuXG4gICAgICAgICAgICAvLyBNb2R1bGUgdW5pcWlkXG4gICAgICAgICAgICAkbmV3UG9wdXAuZmluZCgnLm1vZHVsZS1pZCcpLnRleHQocmVwb0RhdGEudW5pcWlkKTtcblxuICAgICAgICAgICAgLy8gSW5zdGFsbCBsYXN0IHJlbGVhc2UgYnV0dG9uXG4gICAgICAgICAgICAkbmV3UG9wdXAuZmluZCgnLm1haW4taW5zdGFsbC1idXR0b24nKS5hdHRyKCdkYXRhLXVuaXFpZCcsIHJlcG9EYXRhLnVuaXFpZCk7XG5cbiAgICAgICAgICAgIC8vIFRvdGFsIGNvdW50IG9mIGluc3RhbGxhdGlvbnNcbiAgICAgICAgICAgICRuZXdQb3B1cC5maW5kKCcubW9kdWxlLWNvdW50LWluc3RhbGxlZCcpLmh0bWwocmVwb0RhdGEuZG93bmxvYWRzKTtcblxuICAgICAgICAgICAgLy8gTGFzdCByZWxlYXNlIHZlcnNpb25cbiAgICAgICAgICAgICRuZXdQb3B1cC5maW5kKCcubW9kdWxlLWxhdGVzdC1yZWxlYXNlJykudGV4dChyZXBvRGF0YS5yZWxlYXNlc1swXS52ZXJzaW9uKTtcblxuICAgICAgICAgICAgLy8gRGV2ZWxvcGVyXG4gICAgICAgICAgICBjb25zdCBkZXZlbG9wZXJWaWV3ID0gZXh0ZW5zaW9uTW9kdWxlRGV0YWlsLnByZXBhcmVEZXZlbG9wZXJWaWV3KHJlcG9EYXRhKTtcbiAgICAgICAgICAgICRuZXdQb3B1cC5maW5kKCcubW9kdWxlLXB1Ymxpc2hlcicpLmh0bWwoZGV2ZWxvcGVyVmlldyk7XG5cbiAgICAgICAgICAgIC8vIENvbW1lcmNpYWxcbiAgICAgICAgICAgIGNvbnN0IGNvbW1lcmNpYWxWaWV3ID0gZXh0ZW5zaW9uTW9kdWxlRGV0YWlsLnByZXBhcmVDb21tZXJjaWFsVmlldyhyZXBvRGF0YS5jb21tZXJjaWFsKTtcbiAgICAgICAgICAgICRuZXdQb3B1cC5maW5kKCcubW9kdWxlLWNvbW1lcmNpYWwnKS5odG1sKGNvbW1lcmNpYWxWaWV3KTtcblxuICAgICAgICAgICAgLy8gUmVsZWFzZSBzaXplXG4gICAgICAgICAgICBjb25zdCBzaXplVGV4dCA9IGV4dGVuc2lvbk1vZHVsZURldGFpbC5jb252ZXJ0Qnl0ZXNUb1JlYWRhYmxlRm9ybWF0KHJlcG9EYXRhLnJlbGVhc2VzWzBdLnNpemUpO1xuICAgICAgICAgICAgJG5ld1BvcHVwLmZpbmQoJy5tb2R1bGUtbGF0ZXN0LXJlbGVhc2Utc2l6ZScpLnRleHQoc2l6ZVRleHQpO1xuXG4gICAgICAgICAgICAvLyBTY3JlZW5zaG90c1xuICAgICAgICAgICAgY29uc3Qgc2NyZWVuc2hvdHNWaWV3ID0gZXh0ZW5zaW9uTW9kdWxlRGV0YWlsLnByZXBhcmVTY3JlZW5zaG90c1ZpZXcocmVwb0RhdGEuc2NyZWVuc2hvdHMpO1xuICAgICAgICAgICAgJG5ld1BvcHVwLmZpbmQoJy5tb2R1bGUtc2NyZWVuc2hvdHMnKS5odG1sKHNjcmVlbnNob3RzVmlldyk7XG5cbiAgICAgICAgICAgIC8vIERlc2NyaXB0aW9uXG4gICAgICAgICAgICBjb25zdCBkZXNjcmlwdGlvblZpZXcgPSBleHRlbnNpb25Nb2R1bGVEZXRhaWwucHJlcGFyZURlc2NyaXB0aW9uVmlldyhyZXBvRGF0YSk7XG4gICAgICAgICAgICAkbmV3UG9wdXAuZmluZCgnLm1vZHVsZS1kZXNjcmlwdGlvbicpLmh0bWwoZGVzY3JpcHRpb25WaWV3KTtcblxuICAgICAgICAgICAgLy8gQ2hhbmdlbG9nXG4gICAgICAgICAgICBjb25zdCBjaGFuZ2Vsb2dWaWV3ID0gZXh0ZW5zaW9uTW9kdWxlRGV0YWlsLnByZXBhcmVDaGFuZ2VMb2dWaWV3KHJlcG9EYXRhKTtcbiAgICAgICAgICAgICRuZXdQb3B1cC5maW5kKCcubW9kdWxlLWNoYW5nZWxvZycpLmh0bWwoY2hhbmdlbG9nVmlldyk7XG5cbiAgICAgICAgICAgIC8vIFNob3cgdGhlIHBvcHVwXG4gICAgICAgICAgICAkbmV3UG9wdXAucG9wdXAoe1xuICAgICAgICAgICAgICAgIHNob3c6IHRydWUsXG4gICAgICAgICAgICAgICAgcG9zaXRpb246ICd0b3AgY2VudGVyJyxcbiAgICAgICAgICAgICAgICBjbG9zYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBvblNob3c6IGV4dGVuc2lvbk1vZHVsZURldGFpbC5jYk9uU2hvd1RoZURldGFpbFBvcHVwXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgIGNvbnZlcnRCeXRlc1RvUmVhZGFibGVGb3JtYXQoYnl0ZXMpIHtcbiAgICAgICAgY29uc3QgbWVnYWJ5dGVzID0gYnl0ZXMgLyAoMTAyNCoxMDI0KTtcbiAgICAgICAgY29uc3Qgcm91bmRlZE1lZ2FieXRlcyA9IG1lZ2FieXRlcy50b0ZpeGVkKDIpO1xuICAgICAgICByZXR1cm4gYCR7cm91bmRlZE1lZ2FieXRlc30gTWJgO1xuICAgIH0sXG4gICAgcHJlcGFyZUNvbW1lcmNpYWxWaWV3KGNvbW1lcmNpYWwpIHtcbiAgICAgICAgaWYoY29tbWVyY2lhbD09PScxJyl7XG4gICAgICAgICAgICByZXR1cm4gJzxpIGNsYXNzPVwidWkgZG9uYXRlIGljb25cIj48L2k+ICcrZ2xvYmFsVHJhbnNsYXRlLmV4dF9Db21tZXJjaWFsTW9kdWxlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnPGkgY2xhc3M9XCJwdXp6bGUgcGllY2UgaWNvblwiPjwvaT4gJytnbG9iYWxUcmFuc2xhdGUuZXh0X0ZyZWVNb2R1bGU7XG4gICAgfSxcbiAgICBwcmVwYXJlU2NyZWVuc2hvdHNWaWV3KHNjcmVlbnNob3RzKSB7XG4gICAgICAgIGxldCBodG1sID1cbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwidWkgY29udGFpbmVyXCI+XFxuJyArXG4gICAgICAgICAgICAnICAgICAgICAgICAgPGRpdiBjbGFzcz1cInVpIHRleHQgY29udGFpbmVyIHNsaWRlc1wiPlxcbicgK1xuICAgICAgICAgICAgJyAgICAgICAgICAgICAgICA8aSBjbGFzcz1cImJpZyBsZWZ0IGFuZ2xlIGljb25cIj48L2k+XFxuJyArXG4gICAgICAgICAgICAnICAgICAgICAgICAgICAgIDxpIGNsYXNzPVwiYmlnIHJpZ2h0IGFuZ2xlIGljb25cIj48L2k+JztcbiAgICAgICAgJC5lYWNoKHNjcmVlbnNob3RzLCBmdW5jdGlvbiAoaW5kZXgsIHNjcmVlbnNob3QpIHtcbiAgICAgICAgICAgIGlmIChpbmRleCA+IDApIHtcbiAgICAgICAgICAgICAgICBodG1sICs9IGA8ZGl2IGNsYXNzPVwic2xpZGVcIj48aW1nIHNyYz1cIiR7c2NyZWVuc2hvdC51cmx9XCIgYWx0PVwiJHtzY3JlZW5zaG90Lm5hbWV9XCI+PC9kaXY+YDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaHRtbCArPSBgPGRpdiBjbGFzcz1cInNsaWRlIGFjdGl2ZVwiPjxpbWcgc3JjPVwiJHtzY3JlZW5zaG90LnVybH1cIiBhbHQ9XCIke3NjcmVlbnNob3QubmFtZX1cIj48L2Rpdj5gO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgaHRtbCArPSAnPC9kaXY+PC9kaXY+JztcbiAgICAgICAgcmV0dXJuIGh0bWw7XG4gICAgfSxcbiAgICBwcmVwYXJlRGVzY3JpcHRpb25WaWV3KHJlcG9EYXRhKSB7XG4gICAgICAgIGxldCBodG1sID0gYDxkaXYgY2xhc3M9XCJ1aSBoZWFkZXJcIj4ke3JlcG9EYXRhLm5hbWV9PC9kaXY+YDtcbiAgICAgICAgaHRtbCArPSBgPHA+JHtyZXBvRGF0YS5kZXNjcmlwdGlvbn08L3A+YDtcbiAgICAgICAgaHRtbCArPSBgPGRpdiBjbGFzcz1cInVpIGhlYWRlclwiPiR7Z2xvYmFsVHJhbnNsYXRlLmV4dF9Vc2VmdWxMaW5rc308L2Rpdj5gO1xuICAgICAgICBodG1sICs9ICc8dWwgY2xhc3M9XCJ1aSBsaXN0XCI+JztcbiAgICAgICAgaHRtbCArPSBgPGxpIGNsYXNzPVwiaXRlbVwiPjxhIGhyZWY9XCIke3JlcG9EYXRhLnByb21vX2xpbmt9XCIgdGFyZ2V0PVwiX2JsYW5rXCI+JHtnbG9iYWxUcmFuc2xhdGUuZXh0X0V4dGVybmFsRGVzY3JpcHRpb259PC9hPjwvbGk+YDtcbiAgICAgICAgaHRtbCArPSAnPC91bD4nO1xuICAgICAgICByZXR1cm4gaHRtbDtcbiAgICB9LFxuICAgIHByZXBhcmVEZXZlbG9wZXJWaWV3KHJlcG9EYXRhKSB7XG4gICAgICAgIGxldCBodG1sID0gJyc7XG4gICAgICAgIGh0bWwgKz0gYCR7cmVwb0RhdGEuZGV2ZWxvcGVyfWA7XG4gICAgICAgIHJldHVybiBodG1sO1xuICAgIH0sXG4gICAgcHJlcGFyZUNoYW5nZUxvZ1ZpZXcocmVwb0RhdGEpIHtcbiAgICAgICAgbGV0IGh0bWwgPSAnJztcbiAgICAgICAgJC5lYWNoKHJlcG9EYXRhLnJlbGVhc2VzLCBmdW5jdGlvbiAoaW5kZXgsIHJlbGVhc2UpIHtcbiAgICAgICAgICAgIGNvbnN0IHNpemVUZXh0ID0gZXh0ZW5zaW9uTW9kdWxlRGV0YWlsLmNvbnZlcnRCeXRlc1RvUmVhZGFibGVGb3JtYXQocmVsZWFzZS5zaXplKTtcbiAgICAgICAgICAgIGh0bWwrPWA8ZGl2IGNsYXNzPVwidWkgaGVhZGVyXCI+JHtyZWxlYXNlLnZlcnNpb259PC9kaXY+YDtcbiAgICAgICAgICAgIGh0bWwrPWA8cD4ke3JlbGVhc2UuY2hhbmdlbG9nfTwvcD5gO1xuICAgICAgICAgICAgaHRtbCs9YDxhIGhyZWY9XCIjXCIgY2xhc3M9XCJ1aSBsYWJlbGVkIGJhc2ljIGJ1dHRvbiBkb3dubG9hZFwiXG4gICAgICAgICAgICAgICBkYXRhLXVuaXFpZCA9IFwiJHtyZXBvRGF0YS51bmlxaWR9XCJcbiAgICAgICAgICAgICAgIGRhdGEtaWQgPVwiJHtyZWxlYXNlLnJlbGVhc2VJRH1cIj5cbiAgICAgICAgICAgICAgICA8aSBjbGFzcz1cImljb24gZG93bmxvYWQgYmx1ZVwiPjwvaT5cbiAgICAgICAgICAgICAgICAke2dsb2JhbFRyYW5zbGF0ZS5leHRfSW5zdGFsbE1vZHVsZX0gKCR7c2l6ZVRleHR9KVxuICAgICAgICAgICAgPC9hPmA7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gaHRtbDtcbiAgICB9XG59XG5cbiJdfQ==