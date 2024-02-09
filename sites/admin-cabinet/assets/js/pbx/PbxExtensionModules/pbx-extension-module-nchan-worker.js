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

/* global globalDebugMode, EventSource */

/**
 * The nchanStatusWorker object is responsible for receiving signals from backend
 *
 * @module nchanStatusWorker
 */
var nchanStatusWorker = {
  /**
   * EventSource object for the module installation and upgrade status
   * @type {EventSource}
   */
  eventSource: null,

  /**
   * Initialize the connection check worker.
   */
  initialize: function initialize() {
    nchanStatusWorker.eventSource = new EventSource('/pbxcore/api/nchan/sub/install-module');
    nchanStatusWorker.eventSource.addEventListener('error', function (e) {
      if (e.readyState === EventSource.CLOSED) {
        console.log('Connection was closed! ', e);
      } else {
        console.log('An unknown error occurred: ', e);
      }
    }, false);
    nchanStatusWorker.eventSource.addEventListener('message', function (e) {
      var message = JSON.parse(e.data);
      console.log('New message: ', message);
    });
  }
}; // When the document is ready, initialize the module installation/upgrade status worker

$(document).ready(function () {
  if (!globalDebugMode) {
    nchanStatusWorker.initialize();
  }
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9QYnhFeHRlbnNpb25Nb2R1bGVzL3BieC1leHRlbnNpb24tbW9kdWxlLW5jaGFuLXdvcmtlci5qcyJdLCJuYW1lcyI6WyJuY2hhblN0YXR1c1dvcmtlciIsImV2ZW50U291cmNlIiwiaW5pdGlhbGl6ZSIsIkV2ZW50U291cmNlIiwiYWRkRXZlbnRMaXN0ZW5lciIsImUiLCJyZWFkeVN0YXRlIiwiQ0xPU0VEIiwiY29uc29sZSIsImxvZyIsIm1lc3NhZ2UiLCJKU09OIiwicGFyc2UiLCJkYXRhIiwiJCIsImRvY3VtZW50IiwicmVhZHkiLCJnbG9iYWxEZWJ1Z01vZGUiXSwibWFwcGluZ3MiOiI7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBTUEsaUJBQWlCLEdBQUc7QUFFdEI7QUFDSjtBQUNBO0FBQ0E7QUFDSUMsRUFBQUEsV0FBVyxFQUFFLElBTlM7O0FBUXRCO0FBQ0o7QUFDQTtBQUNJQyxFQUFBQSxVQVhzQix3QkFXVDtBQUNURixJQUFBQSxpQkFBaUIsQ0FBQ0MsV0FBbEIsR0FBZ0MsSUFBSUUsV0FBSixDQUFnQix1Q0FBaEIsQ0FBaEM7QUFFQUgsSUFBQUEsaUJBQWlCLENBQUNDLFdBQWxCLENBQThCRyxnQkFBOUIsQ0FBK0MsT0FBL0MsRUFBd0QsVUFBQUMsQ0FBQyxFQUFJO0FBQ3pELFVBQUlBLENBQUMsQ0FBQ0MsVUFBRixLQUFpQkgsV0FBVyxDQUFDSSxNQUFqQyxFQUF5QztBQUNyQ0MsUUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVkseUJBQVosRUFBdUNKLENBQXZDO0FBQ0gsT0FGRCxNQUVPO0FBQ0hHLFFBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLDZCQUFaLEVBQTJDSixDQUEzQztBQUNIO0FBQ0osS0FORCxFQU1HLEtBTkg7QUFRQUwsSUFBQUEsaUJBQWlCLENBQUNDLFdBQWxCLENBQThCRyxnQkFBOUIsQ0FBK0MsU0FBL0MsRUFBMEQsVUFBQUMsQ0FBQyxFQUFJO0FBQzNELFVBQU1LLE9BQU8sR0FBR0MsSUFBSSxDQUFDQyxLQUFMLENBQVdQLENBQUMsQ0FBQ1EsSUFBYixDQUFoQjtBQUNBTCxNQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxlQUFaLEVBQTZCQyxPQUE3QjtBQUNILEtBSEQ7QUFJSDtBQTFCcUIsQ0FBMUIsQyxDQTZCQTs7QUFDQUksQ0FBQyxDQUFDQyxRQUFELENBQUQsQ0FBWUMsS0FBWixDQUFrQixZQUFNO0FBQ3BCLE1BQUksQ0FBQ0MsZUFBTCxFQUFzQjtBQUNsQmpCLElBQUFBLGlCQUFpQixDQUFDRSxVQUFsQjtBQUNIO0FBQ0osQ0FKRCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBNaWtvUEJYIC0gZnJlZSBwaG9uZSBzeXN0ZW0gZm9yIHNtYWxsIGJ1c2luZXNzXG4gKiBDb3B5cmlnaHQgwqkgMjAxNy0yMDI0IEFsZXhleSBQb3J0bm92IGFuZCBOaWtvbGF5IEJla2V0b3ZcbiAqXG4gKiBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuICogaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb247IGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4gKiAoYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFRoaXMgcHJvZ3JhbSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuICogYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcbiAqIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYWxvbmcgd2l0aCB0aGlzIHByb2dyYW0uXG4gKiBJZiBub3QsIHNlZSA8aHR0cHM6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICovXG5cbi8qIGdsb2JhbCBnbG9iYWxEZWJ1Z01vZGUsIEV2ZW50U291cmNlICovXG5cbi8qKlxuICogVGhlIG5jaGFuU3RhdHVzV29ya2VyIG9iamVjdCBpcyByZXNwb25zaWJsZSBmb3IgcmVjZWl2aW5nIHNpZ25hbHMgZnJvbSBiYWNrZW5kXG4gKlxuICogQG1vZHVsZSBuY2hhblN0YXR1c1dvcmtlclxuICovXG5jb25zdCBuY2hhblN0YXR1c1dvcmtlciA9IHtcblxuICAgIC8qKlxuICAgICAqIEV2ZW50U291cmNlIG9iamVjdCBmb3IgdGhlIG1vZHVsZSBpbnN0YWxsYXRpb24gYW5kIHVwZ3JhZGUgc3RhdHVzXG4gICAgICogQHR5cGUge0V2ZW50U291cmNlfVxuICAgICAqL1xuICAgIGV2ZW50U291cmNlOiBudWxsLFxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZSB0aGUgY29ubmVjdGlvbiBjaGVjayB3b3JrZXIuXG4gICAgICovXG4gICAgaW5pdGlhbGl6ZSgpIHtcbiAgICAgICAgbmNoYW5TdGF0dXNXb3JrZXIuZXZlbnRTb3VyY2UgPSBuZXcgRXZlbnRTb3VyY2UoJy9wYnhjb3JlL2FwaS9uY2hhbi9zdWIvaW5zdGFsbC1tb2R1bGUnKTtcblxuICAgICAgICBuY2hhblN0YXR1c1dvcmtlci5ldmVudFNvdXJjZS5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIGUgPT4ge1xuICAgICAgICAgICAgaWYgKGUucmVhZHlTdGF0ZSA9PT0gRXZlbnRTb3VyY2UuQ0xPU0VEKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0Nvbm5lY3Rpb24gd2FzIGNsb3NlZCEgJywgZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBbiB1bmtub3duIGVycm9yIG9jY3VycmVkOiAnLCBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgZmFsc2UpO1xuXG4gICAgICAgIG5jaGFuU3RhdHVzV29ya2VyLmV2ZW50U291cmNlLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBlID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBKU09OLnBhcnNlKGUuZGF0YSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnTmV3IG1lc3NhZ2U6ICcsIG1lc3NhZ2UpO1xuICAgICAgICB9KTtcbiAgICB9LFxufTtcblxuLy8gV2hlbiB0aGUgZG9jdW1lbnQgaXMgcmVhZHksIGluaXRpYWxpemUgdGhlIG1vZHVsZSBpbnN0YWxsYXRpb24vdXBncmFkZSBzdGF0dXMgd29ya2VyXG4kKGRvY3VtZW50KS5yZWFkeSgoKSA9PiB7XG4gICAgaWYgKCFnbG9iYWxEZWJ1Z01vZGUpIHtcbiAgICAgICAgbmNoYW5TdGF0dXNXb3JrZXIuaW5pdGlhbGl6ZSgpO1xuICAgIH1cbn0pOyJdfQ==