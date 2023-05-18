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

/* global moment */
var clockWorker = {
  timeoutHandle: null,
  options: null,
  initialize: function initialize() {
    clockWorker.restartWorker();
  },
  restartWorker: function restartWorker() {
    window.clearTimeout(clockWorker.timeoutHandle);
    clockWorker.worker();
  },
  worker: function worker() {
    PbxApi.GetDateTime(clockWorker.cbAfterReceiveDateTimeFromServer);
  },
  cbAfterReceiveDateTimeFromServer: function cbAfterReceiveDateTimeFromServer(response) {
    var options = {
      timeZone: timeSettings.$formObj.form('get value', 'PBXTimezone'),
      timeZoneName: 'short'
    };

    if (timeSettings.$formObj.form('get value', 'PBXManualTimeSettings') !== 'on') {
      clockWorker.timeoutHandle = window.setTimeout(clockWorker.worker, 1000);
    } else {
      options.timeZoneName = undefined;
    }

    if (response !== false) {
      var dateTime = new Date(response.timestamp * 1000);
      moment.locale(globalWebAdminLanguage);
      var m = moment(dateTime); //timeSettings.$formObj.form('set value', 'ManualDateTime', dateTime.toLocaleString(globalWebAdminLanguage, options));

      timeSettings.$formObj.form('set value', 'ManualDateTime', m.tz(options.timeZone).format());
    }
  }
};
$(document).ready(function () {
  clockWorker.initialize();
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9UaW1lU2V0dGluZ3MvdGltZS1zZXR0aW5ncy13b3JrZXIuanMiXSwibmFtZXMiOlsiY2xvY2tXb3JrZXIiLCJ0aW1lb3V0SGFuZGxlIiwib3B0aW9ucyIsImluaXRpYWxpemUiLCJyZXN0YXJ0V29ya2VyIiwid2luZG93IiwiY2xlYXJUaW1lb3V0Iiwid29ya2VyIiwiUGJ4QXBpIiwiR2V0RGF0ZVRpbWUiLCJjYkFmdGVyUmVjZWl2ZURhdGVUaW1lRnJvbVNlcnZlciIsInJlc3BvbnNlIiwidGltZVpvbmUiLCJ0aW1lU2V0dGluZ3MiLCIkZm9ybU9iaiIsImZvcm0iLCJ0aW1lWm9uZU5hbWUiLCJzZXRUaW1lb3V0IiwidW5kZWZpbmVkIiwiZGF0ZVRpbWUiLCJEYXRlIiwidGltZXN0YW1wIiwibW9tZW50IiwibG9jYWxlIiwiZ2xvYmFsV2ViQWRtaW5MYW5ndWFnZSIsIm0iLCJ0eiIsImZvcm1hdCIsIiQiLCJkb2N1bWVudCIsInJlYWR5Il0sIm1hcHBpbmdzIjoiOztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFFQSxJQUFNQSxXQUFXLEdBQUc7QUFDbkJDLEVBQUFBLGFBQWEsRUFBRSxJQURJO0FBRW5CQyxFQUFBQSxPQUFPLEVBQUUsSUFGVTtBQUduQkMsRUFBQUEsVUFIbUIsd0JBR047QUFDWkgsSUFBQUEsV0FBVyxDQUFDSSxhQUFaO0FBQ0EsR0FMa0I7QUFNbkJBLEVBQUFBLGFBTm1CLDJCQU1IO0FBQ2ZDLElBQUFBLE1BQU0sQ0FBQ0MsWUFBUCxDQUFvQk4sV0FBVyxDQUFDQyxhQUFoQztBQUNBRCxJQUFBQSxXQUFXLENBQUNPLE1BQVo7QUFDQSxHQVRrQjtBQVVuQkEsRUFBQUEsTUFWbUIsb0JBVVY7QUFDUkMsSUFBQUEsTUFBTSxDQUFDQyxXQUFQLENBQW1CVCxXQUFXLENBQUNVLGdDQUEvQjtBQUNBLEdBWmtCO0FBY25CQSxFQUFBQSxnQ0FkbUIsNENBY2NDLFFBZGQsRUFjdUI7QUFDekMsUUFBTVQsT0FBTyxHQUFHO0FBQUVVLE1BQUFBLFFBQVEsRUFBRUMsWUFBWSxDQUFDQyxRQUFiLENBQXNCQyxJQUF0QixDQUEyQixXQUEzQixFQUF3QyxhQUF4QyxDQUFaO0FBQW9FQyxNQUFBQSxZQUFZLEVBQUc7QUFBbkYsS0FBaEI7O0FBQ0EsUUFBSUgsWUFBWSxDQUFDQyxRQUFiLENBQXNCQyxJQUF0QixDQUEyQixXQUEzQixFQUF3Qyx1QkFBeEMsTUFBcUUsSUFBekUsRUFBK0U7QUFDOUVmLE1BQUFBLFdBQVcsQ0FBQ0MsYUFBWixHQUE0QkksTUFBTSxDQUFDWSxVQUFQLENBQzNCakIsV0FBVyxDQUFDTyxNQURlLEVBRTNCLElBRjJCLENBQTVCO0FBSUEsS0FMRCxNQUtPO0FBQ05MLE1BQUFBLE9BQU8sQ0FBQ2MsWUFBUixHQUF1QkUsU0FBdkI7QUFDQTs7QUFDRCxRQUFJUCxRQUFRLEtBQUcsS0FBZixFQUFxQjtBQUVwQixVQUFNUSxRQUFRLEdBQUksSUFBSUMsSUFBSixDQUFTVCxRQUFRLENBQUNVLFNBQVQsR0FBbUIsSUFBNUIsQ0FBbEI7QUFDQUMsTUFBQUEsTUFBTSxDQUFDQyxNQUFQLENBQWNDLHNCQUFkO0FBQ0EsVUFBTUMsQ0FBQyxHQUFHSCxNQUFNLENBQUNILFFBQUQsQ0FBaEIsQ0FKb0IsQ0FLcEI7O0FBQ0FOLE1BQUFBLFlBQVksQ0FBQ0MsUUFBYixDQUFzQkMsSUFBdEIsQ0FBMkIsV0FBM0IsRUFBd0MsZ0JBQXhDLEVBQXlEVSxDQUFDLENBQUNDLEVBQUYsQ0FBS3hCLE9BQU8sQ0FBQ1UsUUFBYixFQUF1QmUsTUFBdkIsRUFBekQ7QUFDQTtBQUNEO0FBaENrQixDQUFwQjtBQW1DQUMsQ0FBQyxDQUFDQyxRQUFELENBQUQsQ0FBWUMsS0FBWixDQUFrQixZQUFNO0FBQ3ZCOUIsRUFBQUEsV0FBVyxDQUFDRyxVQUFaO0FBQ0EsQ0FGRCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBNaWtvUEJYIC0gZnJlZSBwaG9uZSBzeXN0ZW0gZm9yIHNtYWxsIGJ1c2luZXNzXG4gKiBDb3B5cmlnaHQgKEMpIDIwMTctMjAyMyBBbGV4ZXkgUG9ydG5vdiBhbmQgTmlrb2xheSBCZWtldG92XG4gKlxuICogVGhpcyBwcm9ncmFtIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbiAqIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uOyBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxuICogKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbiAqIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG4gKiBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG4gKiBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFsb25nIHdpdGggdGhpcyBwcm9ncmFtLlxuICogSWYgbm90LCBzZWUgPGh0dHBzOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqL1xuXG4vKiBnbG9iYWwgbW9tZW50ICovXG5cbmNvbnN0IGNsb2NrV29ya2VyID0ge1xuXHR0aW1lb3V0SGFuZGxlOiBudWxsLFxuXHRvcHRpb25zOiBudWxsLFxuXHRpbml0aWFsaXplKCkge1xuXHRcdGNsb2NrV29ya2VyLnJlc3RhcnRXb3JrZXIoKTtcblx0fSxcblx0cmVzdGFydFdvcmtlcigpIHtcblx0XHR3aW5kb3cuY2xlYXJUaW1lb3V0KGNsb2NrV29ya2VyLnRpbWVvdXRIYW5kbGUpO1xuXHRcdGNsb2NrV29ya2VyLndvcmtlcigpO1xuXHR9LFxuXHR3b3JrZXIoKSB7XG5cdFx0UGJ4QXBpLkdldERhdGVUaW1lKGNsb2NrV29ya2VyLmNiQWZ0ZXJSZWNlaXZlRGF0ZVRpbWVGcm9tU2VydmVyKTtcblx0fSxcblxuXHRjYkFmdGVyUmVjZWl2ZURhdGVUaW1lRnJvbVNlcnZlcihyZXNwb25zZSl7XG5cdFx0Y29uc3Qgb3B0aW9ucyA9IHsgdGltZVpvbmU6IHRpbWVTZXR0aW5ncy4kZm9ybU9iai5mb3JtKCdnZXQgdmFsdWUnLCAnUEJYVGltZXpvbmUnKSwgdGltZVpvbmVOYW1lIDogJ3Nob3J0J307XG5cdFx0aWYgKHRpbWVTZXR0aW5ncy4kZm9ybU9iai5mb3JtKCdnZXQgdmFsdWUnLCAnUEJYTWFudWFsVGltZVNldHRpbmdzJykgIT09ICdvbicpIHtcblx0XHRcdGNsb2NrV29ya2VyLnRpbWVvdXRIYW5kbGUgPSB3aW5kb3cuc2V0VGltZW91dChcblx0XHRcdFx0Y2xvY2tXb3JrZXIud29ya2VyLFxuXHRcdFx0XHQxMDAwLFxuXHRcdFx0KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0b3B0aW9ucy50aW1lWm9uZU5hbWUgPSB1bmRlZmluZWQ7XG5cdFx0fVxuXHRcdGlmIChyZXNwb25zZSE9PWZhbHNlKXtcblxuXHRcdFx0Y29uc3QgZGF0ZVRpbWUgPSAgbmV3IERhdGUocmVzcG9uc2UudGltZXN0YW1wKjEwMDApO1xuXHRcdFx0bW9tZW50LmxvY2FsZShnbG9iYWxXZWJBZG1pbkxhbmd1YWdlKTtcblx0XHRcdGNvbnN0IG0gPSBtb21lbnQoZGF0ZVRpbWUsKTtcblx0XHRcdC8vdGltZVNldHRpbmdzLiRmb3JtT2JqLmZvcm0oJ3NldCB2YWx1ZScsICdNYW51YWxEYXRlVGltZScsIGRhdGVUaW1lLnRvTG9jYWxlU3RyaW5nKGdsb2JhbFdlYkFkbWluTGFuZ3VhZ2UsIG9wdGlvbnMpKTtcblx0XHRcdHRpbWVTZXR0aW5ncy4kZm9ybU9iai5mb3JtKCdzZXQgdmFsdWUnLCAnTWFudWFsRGF0ZVRpbWUnLG0udHoob3B0aW9ucy50aW1lWm9uZSkuZm9ybWF0KCkpO1xuXHRcdH1cblx0fVxufTtcblxuJChkb2N1bWVudCkucmVhZHkoKCkgPT4ge1xuXHRjbG9ja1dvcmtlci5pbml0aWFsaXplKCk7XG59KTtcbiJdfQ==