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
var DebuggerInfo = {
  $debugInfoDiv: $('#debug-info'),
  delta: 500,
  lastKeypressTime: 0,
  initialize: function initialize() {
    DebuggerInfo.$debugInfoDiv.addClass('ui right very wide sidebar');
    window.$(document).on('keydown', function (event) {
      DebuggerInfo.keyHandler(event);
    });
  },
  UpdateContent: function UpdateContent(newContent) {
    // let newHtml = `<h2>${globalTranslate.dbg_Header}</h2>`;
    // newHtml += newContent;
    DebuggerInfo.$debugInfoDiv.html(newContent);
  },
  showSidebar: function showSidebar() {
    if (DebuggerInfo.$debugInfoDiv.html().length === 0) return;
    DebuggerInfo.$debugInfoDiv.sidebar({
      transition: 'overlay',
      dimPage: false
    }).sidebar('toggle');
  },
  keyHandler: function keyHandler(event) {
    // Double press to ESC will show the debug information
    if (event.keyCode === 27) {
      var thisKeypressTime = new Date();

      if (thisKeypressTime - DebuggerInfo.lastKeypressTime <= DebuggerInfo.delta) {
        DebuggerInfo.showSidebar();
        thisKeypressTime = 0;
      }

      DebuggerInfo.lastKeypressTime = thisKeypressTime;
    }
  }
}; // export default DebuggerInfo;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9tYWluL2RlYnVnZ2VyLWluZm8uanMiXSwibmFtZXMiOlsiRGVidWdnZXJJbmZvIiwiJGRlYnVnSW5mb0RpdiIsIiQiLCJkZWx0YSIsImxhc3RLZXlwcmVzc1RpbWUiLCJpbml0aWFsaXplIiwiYWRkQ2xhc3MiLCJ3aW5kb3ciLCJkb2N1bWVudCIsIm9uIiwiZXZlbnQiLCJrZXlIYW5kbGVyIiwiVXBkYXRlQ29udGVudCIsIm5ld0NvbnRlbnQiLCJodG1sIiwic2hvd1NpZGViYXIiLCJsZW5ndGgiLCJzaWRlYmFyIiwidHJhbnNpdGlvbiIsImRpbVBhZ2UiLCJrZXlDb2RlIiwidGhpc0tleXByZXNzVGltZSIsIkRhdGUiXSwibWFwcGluZ3MiOiI7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBLElBQU1BLFlBQVksR0FBRztBQUNwQkMsRUFBQUEsYUFBYSxFQUFFQyxDQUFDLENBQUMsYUFBRCxDQURJO0FBRXBCQyxFQUFBQSxLQUFLLEVBQUUsR0FGYTtBQUdwQkMsRUFBQUEsZ0JBQWdCLEVBQUUsQ0FIRTtBQUlwQkMsRUFBQUEsVUFKb0Isd0JBSVA7QUFDWkwsSUFBQUEsWUFBWSxDQUFDQyxhQUFiLENBQTJCSyxRQUEzQixDQUFvQyw0QkFBcEM7QUFDQUMsSUFBQUEsTUFBTSxDQUFDTCxDQUFQLENBQVNNLFFBQVQsRUFBbUJDLEVBQW5CLENBQXNCLFNBQXRCLEVBQWlDLFVBQUNDLEtBQUQsRUFBVztBQUMzQ1YsTUFBQUEsWUFBWSxDQUFDVyxVQUFiLENBQXdCRCxLQUF4QjtBQUNBLEtBRkQ7QUFHQSxHQVRtQjtBQVVwQkUsRUFBQUEsYUFWb0IseUJBVU5DLFVBVk0sRUFVTTtBQUN6QjtBQUNBO0FBQ0FiLElBQUFBLFlBQVksQ0FBQ0MsYUFBYixDQUEyQmEsSUFBM0IsQ0FBZ0NELFVBQWhDO0FBQ0EsR0FkbUI7QUFlcEJFLEVBQUFBLFdBZm9CLHlCQWVOO0FBQ2IsUUFBSWYsWUFBWSxDQUFDQyxhQUFiLENBQTJCYSxJQUEzQixHQUFrQ0UsTUFBbEMsS0FBNkMsQ0FBakQsRUFBb0Q7QUFDcERoQixJQUFBQSxZQUFZLENBQUNDLGFBQWIsQ0FDRWdCLE9BREYsQ0FDVTtBQUNSQyxNQUFBQSxVQUFVLEVBQUUsU0FESjtBQUVSQyxNQUFBQSxPQUFPLEVBQUU7QUFGRCxLQURWLEVBS0VGLE9BTEYsQ0FLVSxRQUxWO0FBTUEsR0F2Qm1CO0FBd0JwQk4sRUFBQUEsVUF4Qm9CLHNCQXdCVEQsS0F4QlMsRUF3QkY7QUFDakI7QUFDQSxRQUFJQSxLQUFLLENBQUNVLE9BQU4sS0FBa0IsRUFBdEIsRUFBMEI7QUFDekIsVUFBSUMsZ0JBQWdCLEdBQUcsSUFBSUMsSUFBSixFQUF2Qjs7QUFDQSxVQUFJRCxnQkFBZ0IsR0FBR3JCLFlBQVksQ0FBQ0ksZ0JBQWhDLElBQW9ESixZQUFZLENBQUNHLEtBQXJFLEVBQTRFO0FBQzNFSCxRQUFBQSxZQUFZLENBQUNlLFdBQWI7QUFDQU0sUUFBQUEsZ0JBQWdCLEdBQUcsQ0FBbkI7QUFDQTs7QUFDRHJCLE1BQUFBLFlBQVksQ0FBQ0ksZ0JBQWIsR0FBZ0NpQixnQkFBaEM7QUFDQTtBQUNEO0FBbENtQixDQUFyQixDLENBc0NBIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIE1pa29QQlggLSBmcmVlIHBob25lIHN5c3RlbSBmb3Igc21hbGwgYnVzaW5lc3NcbiAqIENvcHlyaWdodCAoQykgMjAxNy0yMDIzIEFsZXhleSBQb3J0bm92IGFuZCBOaWtvbGF5IEJla2V0b3ZcbiAqXG4gKiBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuICogaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb247IGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4gKiAoYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFRoaXMgcHJvZ3JhbSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuICogYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcbiAqIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYWxvbmcgd2l0aCB0aGlzIHByb2dyYW0uXG4gKiBJZiBub3QsIHNlZSA8aHR0cHM6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICovXG5cbmNvbnN0IERlYnVnZ2VySW5mbyA9IHtcblx0JGRlYnVnSW5mb0RpdjogJCgnI2RlYnVnLWluZm8nKSxcblx0ZGVsdGE6IDUwMCxcblx0bGFzdEtleXByZXNzVGltZTogMCxcblx0aW5pdGlhbGl6ZSgpIHtcblx0XHREZWJ1Z2dlckluZm8uJGRlYnVnSW5mb0Rpdi5hZGRDbGFzcygndWkgcmlnaHQgdmVyeSB3aWRlIHNpZGViYXInKTtcblx0XHR3aW5kb3cuJChkb2N1bWVudCkub24oJ2tleWRvd24nLCAoZXZlbnQpID0+IHtcblx0XHRcdERlYnVnZ2VySW5mby5rZXlIYW5kbGVyKGV2ZW50KTtcblx0XHR9KTtcblx0fSxcblx0VXBkYXRlQ29udGVudChuZXdDb250ZW50KSB7XG5cdFx0Ly8gbGV0IG5ld0h0bWwgPSBgPGgyPiR7Z2xvYmFsVHJhbnNsYXRlLmRiZ19IZWFkZXJ9PC9oMj5gO1xuXHRcdC8vIG5ld0h0bWwgKz0gbmV3Q29udGVudDtcblx0XHREZWJ1Z2dlckluZm8uJGRlYnVnSW5mb0Rpdi5odG1sKG5ld0NvbnRlbnQpO1xuXHR9LFxuXHRzaG93U2lkZWJhcigpIHtcblx0XHRpZiAoRGVidWdnZXJJbmZvLiRkZWJ1Z0luZm9EaXYuaHRtbCgpLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuXHRcdERlYnVnZ2VySW5mby4kZGVidWdJbmZvRGl2XG5cdFx0XHQuc2lkZWJhcih7XG5cdFx0XHRcdHRyYW5zaXRpb246ICdvdmVybGF5Jyxcblx0XHRcdFx0ZGltUGFnZTogZmFsc2UsXG5cdFx0XHR9KVxuXHRcdFx0LnNpZGViYXIoJ3RvZ2dsZScpO1xuXHR9LFxuXHRrZXlIYW5kbGVyKGV2ZW50KSB7XG5cdFx0Ly8gRG91YmxlIHByZXNzIHRvIEVTQyB3aWxsIHNob3cgdGhlIGRlYnVnIGluZm9ybWF0aW9uXG5cdFx0aWYgKGV2ZW50LmtleUNvZGUgPT09IDI3KSB7XG5cdFx0XHRsZXQgdGhpc0tleXByZXNzVGltZSA9IG5ldyBEYXRlKCk7XG5cdFx0XHRpZiAodGhpc0tleXByZXNzVGltZSAtIERlYnVnZ2VySW5mby5sYXN0S2V5cHJlc3NUaW1lIDw9IERlYnVnZ2VySW5mby5kZWx0YSkge1xuXHRcdFx0XHREZWJ1Z2dlckluZm8uc2hvd1NpZGViYXIoKTtcblx0XHRcdFx0dGhpc0tleXByZXNzVGltZSA9IDA7XG5cdFx0XHR9XG5cdFx0XHREZWJ1Z2dlckluZm8ubGFzdEtleXByZXNzVGltZSA9IHRoaXNLZXlwcmVzc1RpbWU7XG5cdFx0fVxuXHR9LFxufTtcblxuXG4vLyBleHBvcnQgZGVmYXVsdCBEZWJ1Z2dlckluZm87XG4iXX0=