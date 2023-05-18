"use strict";

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

/* global globalRootUrl, globalWebAdminLanguage, sessionStorage, $, globalTranslate */
var advicesWorker = {
  timeOut: 300000,
  timeOutHandle: '',
  $advices: $('#advices'),
  $advicesBellButton: $('#show-advices-button'),
  initialize: function initialize() {
    advicesWorker.showPreviousAdvice(); // Let's initiate the retrieval of new advices.

    advicesWorker.restartWorker();
    window.addEventListener('ConfigDataChanged', advicesWorker.cbOnDataChanged);
  },
  restartWorker: function restartWorker() {
    window.clearTimeout(advicesWorker.timeoutHandle);
    advicesWorker.worker();
  },

  /**
   * Handling the event of language or data change.
   */
  cbOnDataChanged: function cbOnDataChanged() {
    sessionStorage.removeItem("previousAdvice".concat(globalWebAdminLanguage));
    sessionStorage.removeItem("previousAdviceBell".concat(globalWebAdminLanguage));
    setTimeout(advicesWorker.restartWorker, 3000);
  },

  /**
   * Shows old advice until receiving an update from the station.
   */
  showPreviousAdvice: function showPreviousAdvice() {
    var previousAdviceBell = sessionStorage.getItem("previousAdviceBell".concat(globalWebAdminLanguage));

    if (previousAdviceBell) {
      advicesWorker.$advicesBellButton.html(previousAdviceBell);
    }

    var previousAdvice = sessionStorage.getItem("previousAdvice".concat(globalWebAdminLanguage));

    if (previousAdvice) {
      advicesWorker.$advices.html(previousAdvice);
    }
  },
  worker: function worker() {
    PbxApi.AdvicesGetList(advicesWorker.cbAfterResponse);
  },
  cbAfterResponse: function cbAfterResponse(response) {
    if (response === false) {
      return;
    }

    advicesWorker.$advices.html('');

    if (response.advices !== undefined) {
      var htmlMessages = '';
      var countMessages = 0;
      var iconBellClass = '';
      htmlMessages += '<div class="ui relaxed divided list">';

      if (response.advices.needUpdate !== undefined && response.advices.needUpdate.length > 0) {
        $(window).trigger('SecurityWarning', [response.advices]);
      }

      if (response.advices.error !== undefined && response.advices.error.length > 0) {
        $.each(response.advices.error, function (key, value) {
          htmlMessages += '<div class="item">';
          htmlMessages += '<i class="frown outline red icon"></i>';
          htmlMessages += "<b>".concat(value, "</b>");
          htmlMessages += '</div>';
          countMessages += 1;
        });
      }

      if (response.advices.warning !== undefined && response.advices.warning.length > 0) {
        $.each(response.advices.warning, function (key, value) {
          htmlMessages += '<div class="item yellow">';
          htmlMessages += '<i class="meh outline yellow icon"></i>';
          htmlMessages += "<b>".concat(value, "</b>");
          htmlMessages += '</div>';
          countMessages += 1;
        });
      }

      if (response.advices.info !== undefined && response.advices.info.length > 0) {
        $.each(response.advices.info, function (key, value) {
          htmlMessages += '<div class="item">';
          htmlMessages += '<i class="smile outline blue icon"></i>';
          htmlMessages += "<b>".concat(value, "</b>");
          htmlMessages += '</div>';
          countMessages += 1;
        });
      }

      if (response.advices.error !== undefined && response.advices.error.length > 0) {
        iconBellClass = 'red large icon bell';
      } else if (response.advices.warning !== undefined && response.advices.warning.length > 0) {
        iconBellClass = 'yellow icon bell';
      } else if (response.advices.info !== undefined && response.advices.info.length > 0) {
        iconBellClass = 'blue icon bell';
      }

      htmlMessages += '</div>';
      advicesWorker.$advices.html(htmlMessages);
      sessionStorage.setItem("previousAdvice".concat(globalWebAdminLanguage), htmlMessages);

      if (countMessages > 0) {
        advicesWorker.$advicesBellButton.html("<i class=\"".concat(iconBellClass, "\"></i>").concat(countMessages)).popup({
          position: 'bottom left',
          popup: advicesWorker.$advices,
          delay: {
            show: 300,
            hide: 10000
          },
          movePopup: false
        });
        advicesWorker.$advicesBellButton.find('i').transition('set looping').transition('pulse', '1000ms');
      } else {
        advicesWorker.$advicesBellButton.html("<i class=\"grey icon bell\"></i>");
      }

      sessionStorage.setItem("previousAdviceBell".concat(globalWebAdminLanguage), advicesWorker.$advicesBellButton.html());
      advicesWorker.timeoutHandle = window.setTimeout(advicesWorker.worker, advicesWorker.timeOut);
    } else if (response.success === true && response.advices !== undefined && response.advices.length === 0) {
      sessionStorage.removeItem("previousAdvice".concat(globalWebAdminLanguage));
      sessionStorage.removeItem("previousAdviceBell".concat(globalWebAdminLanguage));
      advicesWorker.$advicesBellButton.html('<i class="grey icon bell outline"></i>');
    }
  }
};
$(document).ready(function () {
  advicesWorker.initialize();
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9BZHZpY2VzL2FkdmljZXMtd29ya2VyLmpzIl0sIm5hbWVzIjpbImFkdmljZXNXb3JrZXIiLCJ0aW1lT3V0IiwidGltZU91dEhhbmRsZSIsIiRhZHZpY2VzIiwiJCIsIiRhZHZpY2VzQmVsbEJ1dHRvbiIsImluaXRpYWxpemUiLCJzaG93UHJldmlvdXNBZHZpY2UiLCJyZXN0YXJ0V29ya2VyIiwid2luZG93IiwiYWRkRXZlbnRMaXN0ZW5lciIsImNiT25EYXRhQ2hhbmdlZCIsImNsZWFyVGltZW91dCIsInRpbWVvdXRIYW5kbGUiLCJ3b3JrZXIiLCJzZXNzaW9uU3RvcmFnZSIsInJlbW92ZUl0ZW0iLCJnbG9iYWxXZWJBZG1pbkxhbmd1YWdlIiwic2V0VGltZW91dCIsInByZXZpb3VzQWR2aWNlQmVsbCIsImdldEl0ZW0iLCJodG1sIiwicHJldmlvdXNBZHZpY2UiLCJQYnhBcGkiLCJBZHZpY2VzR2V0TGlzdCIsImNiQWZ0ZXJSZXNwb25zZSIsInJlc3BvbnNlIiwiYWR2aWNlcyIsInVuZGVmaW5lZCIsImh0bWxNZXNzYWdlcyIsImNvdW50TWVzc2FnZXMiLCJpY29uQmVsbENsYXNzIiwibmVlZFVwZGF0ZSIsImxlbmd0aCIsInRyaWdnZXIiLCJlcnJvciIsImVhY2giLCJrZXkiLCJ2YWx1ZSIsIndhcm5pbmciLCJpbmZvIiwic2V0SXRlbSIsInBvcHVwIiwicG9zaXRpb24iLCJkZWxheSIsInNob3ciLCJoaWRlIiwibW92ZVBvcHVwIiwiZmluZCIsInRyYW5zaXRpb24iLCJzdWNjZXNzIiwiZG9jdW1lbnQiLCJyZWFkeSJdLCJtYXBwaW5ncyI6Ijs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBRUEsSUFBTUEsYUFBYSxHQUFHO0FBQ3JCQyxFQUFBQSxPQUFPLEVBQUUsTUFEWTtBQUVyQkMsRUFBQUEsYUFBYSxFQUFFLEVBRk07QUFHckJDLEVBQUFBLFFBQVEsRUFBRUMsQ0FBQyxDQUFDLFVBQUQsQ0FIVTtBQUlyQkMsRUFBQUEsa0JBQWtCLEVBQUVELENBQUMsQ0FBQyxzQkFBRCxDQUpBO0FBS3JCRSxFQUFBQSxVQUxxQix3QkFLUjtBQUNaTixJQUFBQSxhQUFhLENBQUNPLGtCQUFkLEdBRFksQ0FFWjs7QUFDQVAsSUFBQUEsYUFBYSxDQUFDUSxhQUFkO0FBQ0FDLElBQUFBLE1BQU0sQ0FBQ0MsZ0JBQVAsQ0FBd0IsbUJBQXhCLEVBQTZDVixhQUFhLENBQUNXLGVBQTNEO0FBQ0EsR0FWb0I7QUFXckJILEVBQUFBLGFBWHFCLDJCQVdMO0FBQ2ZDLElBQUFBLE1BQU0sQ0FBQ0csWUFBUCxDQUFvQlosYUFBYSxDQUFDYSxhQUFsQztBQUNBYixJQUFBQSxhQUFhLENBQUNjLE1BQWQ7QUFDQSxHQWRvQjs7QUFlckI7QUFDRDtBQUNBO0FBQ0NILEVBQUFBLGVBbEJxQiw2QkFrQkg7QUFDakJJLElBQUFBLGNBQWMsQ0FBQ0MsVUFBZix5QkFBMkNDLHNCQUEzQztBQUNBRixJQUFBQSxjQUFjLENBQUNDLFVBQWYsNkJBQStDQyxzQkFBL0M7QUFDQUMsSUFBQUEsVUFBVSxDQUFDbEIsYUFBYSxDQUFDUSxhQUFmLEVBQTZCLElBQTdCLENBQVY7QUFDQSxHQXRCb0I7O0FBdUJyQjtBQUNEO0FBQ0E7QUFDQ0QsRUFBQUEsa0JBMUJxQixnQ0EwQkE7QUFDcEIsUUFBTVksa0JBQWtCLEdBQUdKLGNBQWMsQ0FBQ0ssT0FBZiw2QkFBNENILHNCQUE1QyxFQUEzQjs7QUFDQSxRQUFJRSxrQkFBSixFQUF3QjtBQUN2Qm5CLE1BQUFBLGFBQWEsQ0FBQ0ssa0JBQWQsQ0FBaUNnQixJQUFqQyxDQUFzQ0Ysa0JBQXRDO0FBQ0E7O0FBQ0QsUUFBTUcsY0FBYyxHQUFHUCxjQUFjLENBQUNLLE9BQWYseUJBQXdDSCxzQkFBeEMsRUFBdkI7O0FBQ0EsUUFBSUssY0FBSixFQUFvQjtBQUNuQnRCLE1BQUFBLGFBQWEsQ0FBQ0csUUFBZCxDQUF1QmtCLElBQXZCLENBQTRCQyxjQUE1QjtBQUNBO0FBQ0QsR0FuQ29CO0FBb0NyQlIsRUFBQUEsTUFwQ3FCLG9CQW9DWjtBQUNSUyxJQUFBQSxNQUFNLENBQUNDLGNBQVAsQ0FBc0J4QixhQUFhLENBQUN5QixlQUFwQztBQUNBLEdBdENvQjtBQXVDckJBLEVBQUFBLGVBdkNxQiwyQkF1Q0xDLFFBdkNLLEVBdUNLO0FBQ3pCLFFBQUlBLFFBQVEsS0FBSyxLQUFqQixFQUF3QjtBQUN2QjtBQUNBOztBQUNEMUIsSUFBQUEsYUFBYSxDQUFDRyxRQUFkLENBQXVCa0IsSUFBdkIsQ0FBNEIsRUFBNUI7O0FBQ0EsUUFBSUssUUFBUSxDQUFDQyxPQUFULEtBQXFCQyxTQUF6QixFQUFvQztBQUNuQyxVQUFJQyxZQUFZLEdBQUcsRUFBbkI7QUFDQSxVQUFJQyxhQUFhLEdBQUcsQ0FBcEI7QUFDQSxVQUFJQyxhQUFhLEdBQUcsRUFBcEI7QUFDQUYsTUFBQUEsWUFBWSxJQUFJLHVDQUFoQjs7QUFFQSxVQUFJSCxRQUFRLENBQUNDLE9BQVQsQ0FBaUJLLFVBQWpCLEtBQWdDSixTQUFoQyxJQUNBRixRQUFRLENBQUNDLE9BQVQsQ0FBaUJLLFVBQWpCLENBQTRCQyxNQUE1QixHQUFxQyxDQUR6QyxFQUM0QztBQUMzQzdCLFFBQUFBLENBQUMsQ0FBQ0ssTUFBRCxDQUFELENBQVV5QixPQUFWLENBQWtCLGlCQUFsQixFQUFxQyxDQUFDUixRQUFRLENBQUNDLE9BQVYsQ0FBckM7QUFDQTs7QUFFRCxVQUFJRCxRQUFRLENBQUNDLE9BQVQsQ0FBaUJRLEtBQWpCLEtBQTJCUCxTQUEzQixJQUNBRixRQUFRLENBQUNDLE9BQVQsQ0FBaUJRLEtBQWpCLENBQXVCRixNQUF2QixHQUFnQyxDQURwQyxFQUN1QztBQUN0QzdCLFFBQUFBLENBQUMsQ0FBQ2dDLElBQUYsQ0FBT1YsUUFBUSxDQUFDQyxPQUFULENBQWlCUSxLQUF4QixFQUErQixVQUFDRSxHQUFELEVBQU1DLEtBQU4sRUFBZ0I7QUFDOUNULFVBQUFBLFlBQVksSUFBSSxvQkFBaEI7QUFDQUEsVUFBQUEsWUFBWSxJQUFJLHdDQUFoQjtBQUNBQSxVQUFBQSxZQUFZLGlCQUFVUyxLQUFWLFNBQVo7QUFDQVQsVUFBQUEsWUFBWSxJQUFJLFFBQWhCO0FBQ0FDLFVBQUFBLGFBQWEsSUFBSSxDQUFqQjtBQUNBLFNBTkQ7QUFPQTs7QUFDRCxVQUFJSixRQUFRLENBQUNDLE9BQVQsQ0FBaUJZLE9BQWpCLEtBQTZCWCxTQUE3QixJQUNBRixRQUFRLENBQUNDLE9BQVQsQ0FBaUJZLE9BQWpCLENBQXlCTixNQUF6QixHQUFrQyxDQUR0QyxFQUN5QztBQUN4QzdCLFFBQUFBLENBQUMsQ0FBQ2dDLElBQUYsQ0FBT1YsUUFBUSxDQUFDQyxPQUFULENBQWlCWSxPQUF4QixFQUFpQyxVQUFDRixHQUFELEVBQU1DLEtBQU4sRUFBZ0I7QUFDaERULFVBQUFBLFlBQVksSUFBSSwyQkFBaEI7QUFDQUEsVUFBQUEsWUFBWSxJQUFJLHlDQUFoQjtBQUNBQSxVQUFBQSxZQUFZLGlCQUFVUyxLQUFWLFNBQVo7QUFDQVQsVUFBQUEsWUFBWSxJQUFJLFFBQWhCO0FBQ0FDLFVBQUFBLGFBQWEsSUFBSSxDQUFqQjtBQUNBLFNBTkQ7QUFPQTs7QUFDRCxVQUFJSixRQUFRLENBQUNDLE9BQVQsQ0FBaUJhLElBQWpCLEtBQTBCWixTQUExQixJQUNBRixRQUFRLENBQUNDLE9BQVQsQ0FBaUJhLElBQWpCLENBQXNCUCxNQUF0QixHQUErQixDQURuQyxFQUNzQztBQUNyQzdCLFFBQUFBLENBQUMsQ0FBQ2dDLElBQUYsQ0FBT1YsUUFBUSxDQUFDQyxPQUFULENBQWlCYSxJQUF4QixFQUE4QixVQUFDSCxHQUFELEVBQU1DLEtBQU4sRUFBZ0I7QUFDN0NULFVBQUFBLFlBQVksSUFBSSxvQkFBaEI7QUFDQUEsVUFBQUEsWUFBWSxJQUFJLHlDQUFoQjtBQUNBQSxVQUFBQSxZQUFZLGlCQUFVUyxLQUFWLFNBQVo7QUFDQVQsVUFBQUEsWUFBWSxJQUFJLFFBQWhCO0FBQ0FDLFVBQUFBLGFBQWEsSUFBSSxDQUFqQjtBQUNBLFNBTkQ7QUFPQTs7QUFFRCxVQUFJSixRQUFRLENBQUNDLE9BQVQsQ0FBaUJRLEtBQWpCLEtBQTJCUCxTQUEzQixJQUNBRixRQUFRLENBQUNDLE9BQVQsQ0FBaUJRLEtBQWpCLENBQXVCRixNQUF2QixHQUFnQyxDQURwQyxFQUN1QztBQUN0Q0YsUUFBQUEsYUFBYSxHQUFHLHFCQUFoQjtBQUNBLE9BSEQsTUFHTyxJQUFJTCxRQUFRLENBQUNDLE9BQVQsQ0FBaUJZLE9BQWpCLEtBQTZCWCxTQUE3QixJQUNQRixRQUFRLENBQUNDLE9BQVQsQ0FBaUJZLE9BQWpCLENBQXlCTixNQUF6QixHQUFrQyxDQUQvQixFQUNpQztBQUN2Q0YsUUFBQUEsYUFBYSxHQUFHLGtCQUFoQjtBQUVBLE9BSk0sTUFJQSxJQUFJTCxRQUFRLENBQUNDLE9BQVQsQ0FBaUJhLElBQWpCLEtBQTBCWixTQUExQixJQUNQRixRQUFRLENBQUNDLE9BQVQsQ0FBaUJhLElBQWpCLENBQXNCUCxNQUF0QixHQUErQixDQUQ1QixFQUM4QjtBQUNwQ0YsUUFBQUEsYUFBYSxHQUFHLGdCQUFoQjtBQUNBOztBQUdERixNQUFBQSxZQUFZLElBQUksUUFBaEI7QUFDQTdCLE1BQUFBLGFBQWEsQ0FBQ0csUUFBZCxDQUF1QmtCLElBQXZCLENBQTRCUSxZQUE1QjtBQUNBZCxNQUFBQSxjQUFjLENBQUMwQixPQUFmLHlCQUF3Q3hCLHNCQUF4QyxHQUFrRVksWUFBbEU7O0FBRUEsVUFBSUMsYUFBYSxHQUFDLENBQWxCLEVBQW9CO0FBQ25COUIsUUFBQUEsYUFBYSxDQUFDSyxrQkFBZCxDQUNFZ0IsSUFERixzQkFDb0JVLGFBRHBCLG9CQUMwQ0QsYUFEMUMsR0FFRVksS0FGRixDQUVRO0FBQ05DLFVBQUFBLFFBQVEsRUFBRSxhQURKO0FBRU5ELFVBQUFBLEtBQUssRUFBRTFDLGFBQWEsQ0FBQ0csUUFGZjtBQUdOeUMsVUFBQUEsS0FBSyxFQUFFO0FBQ05DLFlBQUFBLElBQUksRUFBRSxHQURBO0FBRU5DLFlBQUFBLElBQUksRUFBRTtBQUZBLFdBSEQ7QUFPTkMsVUFBQUEsU0FBUyxFQUFFO0FBUEwsU0FGUjtBQVdBL0MsUUFBQUEsYUFBYSxDQUFDSyxrQkFBZCxDQUFpQzJDLElBQWpDLENBQXNDLEdBQXRDLEVBQ0VDLFVBREYsQ0FDYSxhQURiLEVBRUVBLFVBRkYsQ0FFYSxPQUZiLEVBRXNCLFFBRnRCO0FBR0EsT0FmRCxNQWVPO0FBQ05qRCxRQUFBQSxhQUFhLENBQUNLLGtCQUFkLENBQ0VnQixJQURGO0FBRUE7O0FBQ0ROLE1BQUFBLGNBQWMsQ0FBQzBCLE9BQWYsNkJBQTRDeEIsc0JBQTVDLEdBQXNFakIsYUFBYSxDQUFDSyxrQkFBZCxDQUFpQ2dCLElBQWpDLEVBQXRFO0FBQ0FyQixNQUFBQSxhQUFhLENBQUNhLGFBQWQsR0FBOEJKLE1BQU0sQ0FBQ1MsVUFBUCxDQUM3QmxCLGFBQWEsQ0FBQ2MsTUFEZSxFQUU3QmQsYUFBYSxDQUFDQyxPQUZlLENBQTlCO0FBSUEsS0FuRkQsTUFtRk8sSUFBSXlCLFFBQVEsQ0FBQ3dCLE9BQVQsS0FBcUIsSUFBckIsSUFDUHhCLFFBQVEsQ0FBQ0MsT0FBVCxLQUFxQkMsU0FEZCxJQUVQRixRQUFRLENBQUNDLE9BQVQsQ0FBaUJNLE1BQWpCLEtBQTRCLENBRnpCLEVBRTRCO0FBQ2xDbEIsTUFBQUEsY0FBYyxDQUFDQyxVQUFmLHlCQUEyQ0Msc0JBQTNDO0FBQ0FGLE1BQUFBLGNBQWMsQ0FBQ0MsVUFBZiw2QkFBK0NDLHNCQUEvQztBQUNBakIsTUFBQUEsYUFBYSxDQUFDSyxrQkFBZCxDQUNFZ0IsSUFERixDQUNPLHdDQURQO0FBRUE7QUFDRDtBQXZJb0IsQ0FBdEI7QUEwSUFqQixDQUFDLENBQUMrQyxRQUFELENBQUQsQ0FBWUMsS0FBWixDQUFrQixZQUFNO0FBQ3ZCcEQsRUFBQUEsYUFBYSxDQUFDTSxVQUFkO0FBQ0EsQ0FGRCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBNaWtvUEJYIC0gZnJlZSBwaG9uZSBzeXN0ZW0gZm9yIHNtYWxsIGJ1c2luZXNzXG4gKiBDb3B5cmlnaHQgKEMpIDIwMTctMjAyMyBBbGV4ZXkgUG9ydG5vdiBhbmQgTmlrb2xheSBCZWtldG92XG4gKlxuICogVGhpcyBwcm9ncmFtIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbiAqIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uOyBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxuICogKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbiAqIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG4gKiBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG4gKiBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFsb25nIHdpdGggdGhpcyBwcm9ncmFtLlxuICogSWYgbm90LCBzZWUgPGh0dHBzOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqL1xuXG4vKiBnbG9iYWwgZ2xvYmFsUm9vdFVybCwgZ2xvYmFsV2ViQWRtaW5MYW5ndWFnZSwgc2Vzc2lvblN0b3JhZ2UsICQsIGdsb2JhbFRyYW5zbGF0ZSAqL1xuXG5jb25zdCBhZHZpY2VzV29ya2VyID0ge1xuXHR0aW1lT3V0OiAzMDAwMDAsXG5cdHRpbWVPdXRIYW5kbGU6ICcnLFxuXHQkYWR2aWNlczogJCgnI2FkdmljZXMnKSxcblx0JGFkdmljZXNCZWxsQnV0dG9uOiAkKCcjc2hvdy1hZHZpY2VzLWJ1dHRvbicpLFxuXHRpbml0aWFsaXplKCkge1xuXHRcdGFkdmljZXNXb3JrZXIuc2hvd1ByZXZpb3VzQWR2aWNlKCk7XG5cdFx0Ly8gTGV0J3MgaW5pdGlhdGUgdGhlIHJldHJpZXZhbCBvZiBuZXcgYWR2aWNlcy5cblx0XHRhZHZpY2VzV29ya2VyLnJlc3RhcnRXb3JrZXIoKTtcblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignQ29uZmlnRGF0YUNoYW5nZWQnLCBhZHZpY2VzV29ya2VyLmNiT25EYXRhQ2hhbmdlZCk7XG5cdH0sXG5cdHJlc3RhcnRXb3JrZXIoKSB7XG5cdFx0d2luZG93LmNsZWFyVGltZW91dChhZHZpY2VzV29ya2VyLnRpbWVvdXRIYW5kbGUpO1xuXHRcdGFkdmljZXNXb3JrZXIud29ya2VyKCk7XG5cdH0sXG5cdC8qKlxuXHQgKiBIYW5kbGluZyB0aGUgZXZlbnQgb2YgbGFuZ3VhZ2Ugb3IgZGF0YSBjaGFuZ2UuXG5cdCAqL1xuXHRjYk9uRGF0YUNoYW5nZWQoKSB7XG5cdFx0c2Vzc2lvblN0b3JhZ2UucmVtb3ZlSXRlbShgcHJldmlvdXNBZHZpY2Uke2dsb2JhbFdlYkFkbWluTGFuZ3VhZ2V9YCk7XG5cdFx0c2Vzc2lvblN0b3JhZ2UucmVtb3ZlSXRlbShgcHJldmlvdXNBZHZpY2VCZWxsJHtnbG9iYWxXZWJBZG1pbkxhbmd1YWdlfWApO1xuXHRcdHNldFRpbWVvdXQoYWR2aWNlc1dvcmtlci5yZXN0YXJ0V29ya2VyLDMwMDApO1xuXHR9LFxuXHQvKipcblx0ICogU2hvd3Mgb2xkIGFkdmljZSB1bnRpbCByZWNlaXZpbmcgYW4gdXBkYXRlIGZyb20gdGhlIHN0YXRpb24uXG5cdCAqL1xuXHRzaG93UHJldmlvdXNBZHZpY2UoKSB7XG5cdFx0Y29uc3QgcHJldmlvdXNBZHZpY2VCZWxsID0gc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShgcHJldmlvdXNBZHZpY2VCZWxsJHtnbG9iYWxXZWJBZG1pbkxhbmd1YWdlfWApO1xuXHRcdGlmIChwcmV2aW91c0FkdmljZUJlbGwpIHtcblx0XHRcdGFkdmljZXNXb3JrZXIuJGFkdmljZXNCZWxsQnV0dG9uLmh0bWwocHJldmlvdXNBZHZpY2VCZWxsKTtcblx0XHR9XG5cdFx0Y29uc3QgcHJldmlvdXNBZHZpY2UgPSBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKGBwcmV2aW91c0FkdmljZSR7Z2xvYmFsV2ViQWRtaW5MYW5ndWFnZX1gKTtcblx0XHRpZiAocHJldmlvdXNBZHZpY2UpIHtcblx0XHRcdGFkdmljZXNXb3JrZXIuJGFkdmljZXMuaHRtbChwcmV2aW91c0FkdmljZSk7XG5cdFx0fVxuXHR9LFxuXHR3b3JrZXIoKSB7XG5cdFx0UGJ4QXBpLkFkdmljZXNHZXRMaXN0KGFkdmljZXNXb3JrZXIuY2JBZnRlclJlc3BvbnNlKTtcblx0fSxcblx0Y2JBZnRlclJlc3BvbnNlKHJlc3BvbnNlKSB7XG5cdFx0aWYgKHJlc3BvbnNlID09PSBmYWxzZSkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRhZHZpY2VzV29ya2VyLiRhZHZpY2VzLmh0bWwoJycpO1xuXHRcdGlmIChyZXNwb25zZS5hZHZpY2VzICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdGxldCBodG1sTWVzc2FnZXMgPSAnJztcblx0XHRcdGxldCBjb3VudE1lc3NhZ2VzID0gMDtcblx0XHRcdGxldCBpY29uQmVsbENsYXNzID0gJyc7XG5cdFx0XHRodG1sTWVzc2FnZXMgKz0gJzxkaXYgY2xhc3M9XCJ1aSByZWxheGVkIGRpdmlkZWQgbGlzdFwiPic7XG5cblx0XHRcdGlmIChyZXNwb25zZS5hZHZpY2VzLm5lZWRVcGRhdGUgIT09IHVuZGVmaW5lZFxuXHRcdFx0XHQmJiByZXNwb25zZS5hZHZpY2VzLm5lZWRVcGRhdGUubGVuZ3RoID4gMCkge1xuXHRcdFx0XHQkKHdpbmRvdykudHJpZ2dlcignU2VjdXJpdHlXYXJuaW5nJywgW3Jlc3BvbnNlLmFkdmljZXNdKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHJlc3BvbnNlLmFkdmljZXMuZXJyb3IgIT09IHVuZGVmaW5lZFxuXHRcdFx0XHQmJiByZXNwb25zZS5hZHZpY2VzLmVycm9yLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0JC5lYWNoKHJlc3BvbnNlLmFkdmljZXMuZXJyb3IsIChrZXksIHZhbHVlKSA9PiB7XG5cdFx0XHRcdFx0aHRtbE1lc3NhZ2VzICs9ICc8ZGl2IGNsYXNzPVwiaXRlbVwiPic7XG5cdFx0XHRcdFx0aHRtbE1lc3NhZ2VzICs9ICc8aSBjbGFzcz1cImZyb3duIG91dGxpbmUgcmVkIGljb25cIj48L2k+Jztcblx0XHRcdFx0XHRodG1sTWVzc2FnZXMgKz0gYDxiPiR7dmFsdWV9PC9iPmA7XG5cdFx0XHRcdFx0aHRtbE1lc3NhZ2VzICs9ICc8L2Rpdj4nO1xuXHRcdFx0XHRcdGNvdW50TWVzc2FnZXMgKz0gMTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0XHRpZiAocmVzcG9uc2UuYWR2aWNlcy53YXJuaW5nICE9PSB1bmRlZmluZWRcblx0XHRcdFx0JiYgcmVzcG9uc2UuYWR2aWNlcy53YXJuaW5nLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0JC5lYWNoKHJlc3BvbnNlLmFkdmljZXMud2FybmluZywgKGtleSwgdmFsdWUpID0+IHtcblx0XHRcdFx0XHRodG1sTWVzc2FnZXMgKz0gJzxkaXYgY2xhc3M9XCJpdGVtIHllbGxvd1wiPic7XG5cdFx0XHRcdFx0aHRtbE1lc3NhZ2VzICs9ICc8aSBjbGFzcz1cIm1laCBvdXRsaW5lIHllbGxvdyBpY29uXCI+PC9pPic7XG5cdFx0XHRcdFx0aHRtbE1lc3NhZ2VzICs9IGA8Yj4ke3ZhbHVlfTwvYj5gO1xuXHRcdFx0XHRcdGh0bWxNZXNzYWdlcyArPSAnPC9kaXY+Jztcblx0XHRcdFx0XHRjb3VudE1lc3NhZ2VzICs9IDE7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdFx0aWYgKHJlc3BvbnNlLmFkdmljZXMuaW5mbyAhPT0gdW5kZWZpbmVkXG5cdFx0XHRcdCYmIHJlc3BvbnNlLmFkdmljZXMuaW5mby5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdCQuZWFjaChyZXNwb25zZS5hZHZpY2VzLmluZm8sIChrZXksIHZhbHVlKSA9PiB7XG5cdFx0XHRcdFx0aHRtbE1lc3NhZ2VzICs9ICc8ZGl2IGNsYXNzPVwiaXRlbVwiPic7XG5cdFx0XHRcdFx0aHRtbE1lc3NhZ2VzICs9ICc8aSBjbGFzcz1cInNtaWxlIG91dGxpbmUgYmx1ZSBpY29uXCI+PC9pPic7XG5cdFx0XHRcdFx0aHRtbE1lc3NhZ2VzICs9IGA8Yj4ke3ZhbHVlfTwvYj5gO1xuXHRcdFx0XHRcdGh0bWxNZXNzYWdlcyArPSAnPC9kaXY+Jztcblx0XHRcdFx0XHRjb3VudE1lc3NhZ2VzICs9IDE7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAocmVzcG9uc2UuYWR2aWNlcy5lcnJvciAhPT0gdW5kZWZpbmVkXG5cdFx0XHRcdCYmIHJlc3BvbnNlLmFkdmljZXMuZXJyb3IubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRpY29uQmVsbENsYXNzID0gJ3JlZCBsYXJnZSBpY29uIGJlbGwnO1xuXHRcdFx0fSBlbHNlIGlmIChyZXNwb25zZS5hZHZpY2VzLndhcm5pbmcgIT09IHVuZGVmaW5lZFxuXHRcdFx0XHQmJiByZXNwb25zZS5hZHZpY2VzLndhcm5pbmcubGVuZ3RoID4gMCl7XG5cdFx0XHRcdGljb25CZWxsQ2xhc3MgPSAneWVsbG93IGljb24gYmVsbCc7XG5cblx0XHRcdH0gZWxzZSBpZiAocmVzcG9uc2UuYWR2aWNlcy5pbmZvICE9PSB1bmRlZmluZWRcblx0XHRcdFx0JiYgcmVzcG9uc2UuYWR2aWNlcy5pbmZvLmxlbmd0aCA+IDApe1xuXHRcdFx0XHRpY29uQmVsbENsYXNzID0gJ2JsdWUgaWNvbiBiZWxsJztcblx0XHRcdH1cblxuXG5cdFx0XHRodG1sTWVzc2FnZXMgKz0gJzwvZGl2Pic7XG5cdFx0XHRhZHZpY2VzV29ya2VyLiRhZHZpY2VzLmh0bWwoaHRtbE1lc3NhZ2VzKTtcblx0XHRcdHNlc3Npb25TdG9yYWdlLnNldEl0ZW0oYHByZXZpb3VzQWR2aWNlJHtnbG9iYWxXZWJBZG1pbkxhbmd1YWdlfWAsIGh0bWxNZXNzYWdlcyk7XG5cblx0XHRcdGlmIChjb3VudE1lc3NhZ2VzPjApe1xuXHRcdFx0XHRhZHZpY2VzV29ya2VyLiRhZHZpY2VzQmVsbEJ1dHRvblxuXHRcdFx0XHRcdC5odG1sKGA8aSBjbGFzcz1cIiR7aWNvbkJlbGxDbGFzc31cIj48L2k+JHtjb3VudE1lc3NhZ2VzfWApXG5cdFx0XHRcdFx0LnBvcHVwKHtcblx0XHRcdFx0XHRcdHBvc2l0aW9uOiAnYm90dG9tIGxlZnQnLFxuXHRcdFx0XHRcdFx0cG9wdXA6IGFkdmljZXNXb3JrZXIuJGFkdmljZXMsXG5cdFx0XHRcdFx0XHRkZWxheToge1xuXHRcdFx0XHRcdFx0XHRzaG93OiAzMDAsXG5cdFx0XHRcdFx0XHRcdGhpZGU6IDEwMDAwLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdG1vdmVQb3B1cDogZmFsc2Vcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0YWR2aWNlc1dvcmtlci4kYWR2aWNlc0JlbGxCdXR0b24uZmluZCgnaScpXG5cdFx0XHRcdFx0LnRyYW5zaXRpb24oJ3NldCBsb29waW5nJylcblx0XHRcdFx0XHQudHJhbnNpdGlvbigncHVsc2UnLCAnMTAwMG1zJyk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRhZHZpY2VzV29ya2VyLiRhZHZpY2VzQmVsbEJ1dHRvblxuXHRcdFx0XHRcdC5odG1sKGA8aSBjbGFzcz1cImdyZXkgaWNvbiBiZWxsXCI+PC9pPmApXG5cdFx0XHR9XG5cdFx0XHRzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKGBwcmV2aW91c0FkdmljZUJlbGwke2dsb2JhbFdlYkFkbWluTGFuZ3VhZ2V9YCwgYWR2aWNlc1dvcmtlci4kYWR2aWNlc0JlbGxCdXR0b24uaHRtbCgpKTtcblx0XHRcdGFkdmljZXNXb3JrZXIudGltZW91dEhhbmRsZSA9IHdpbmRvdy5zZXRUaW1lb3V0KFxuXHRcdFx0XHRhZHZpY2VzV29ya2VyLndvcmtlcixcblx0XHRcdFx0YWR2aWNlc1dvcmtlci50aW1lT3V0LFxuXHRcdFx0KTtcblx0XHR9IGVsc2UgaWYgKHJlc3BvbnNlLnN1Y2Nlc3MgPT09IHRydWVcblx0XHRcdCYmIHJlc3BvbnNlLmFkdmljZXMgIT09IHVuZGVmaW5lZFxuXHRcdFx0JiYgcmVzcG9uc2UuYWR2aWNlcy5sZW5ndGggPT09IDApIHtcblx0XHRcdHNlc3Npb25TdG9yYWdlLnJlbW92ZUl0ZW0oYHByZXZpb3VzQWR2aWNlJHtnbG9iYWxXZWJBZG1pbkxhbmd1YWdlfWApO1xuXHRcdFx0c2Vzc2lvblN0b3JhZ2UucmVtb3ZlSXRlbShgcHJldmlvdXNBZHZpY2VCZWxsJHtnbG9iYWxXZWJBZG1pbkxhbmd1YWdlfWApO1xuXHRcdFx0YWR2aWNlc1dvcmtlci4kYWR2aWNlc0JlbGxCdXR0b25cblx0XHRcdFx0Lmh0bWwoJzxpIGNsYXNzPVwiZ3JleSBpY29uIGJlbGwgb3V0bGluZVwiPjwvaT4nKTtcblx0XHR9XG5cdH0sXG59O1xuXG4kKGRvY3VtZW50KS5yZWFkeSgoKSA9PiB7XG5cdGFkdmljZXNXb3JrZXIuaW5pdGlhbGl6ZSgpO1xufSk7XG4iXX0=