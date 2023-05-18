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
var PasswordScore = {
  scorePassword: function scorePassword(pass) {
    var score = 0;

    if (!pass) {
      return score;
    }

    if (pass.length > 5) {
      score = 2;
    }

    var variations = {
      digits: /\d/.test(pass),
      lower: /[a-z]/.test(pass),
      upper: /[A-Z]/.test(pass),
      nonWords: /\W/.test(pass)
    };

    for (var check in variations) {
      score += variations[check] === true ? 2 : 0;
    }

    return score * 10;
  },
  checkPassStrength: function checkPassStrength(param) {
    var score = PasswordScore.scorePassword(param.pass);
    param.bar.progress({
      percent: Math.min(score, 100),
      showActivity: false
    });
    param.section.show();
    return '';
  }
}; // export default PasswordScore;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9tYWluL3Bhc3N3b3JkLXNjb3JlLmpzIl0sIm5hbWVzIjpbIlBhc3N3b3JkU2NvcmUiLCJzY29yZVBhc3N3b3JkIiwicGFzcyIsInNjb3JlIiwibGVuZ3RoIiwidmFyaWF0aW9ucyIsImRpZ2l0cyIsInRlc3QiLCJsb3dlciIsInVwcGVyIiwibm9uV29yZHMiLCJjaGVjayIsImNoZWNrUGFzc1N0cmVuZ3RoIiwicGFyYW0iLCJiYXIiLCJwcm9ncmVzcyIsInBlcmNlbnQiLCJNYXRoIiwibWluIiwic2hvd0FjdGl2aXR5Iiwic2VjdGlvbiIsInNob3ciXSwibWFwcGluZ3MiOiI7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUdBLElBQU1BLGFBQWEsR0FBRztBQUNyQkMsRUFBQUEsYUFEcUIseUJBQ1BDLElBRE8sRUFDRDtBQUNuQixRQUFJQyxLQUFLLEdBQUcsQ0FBWjs7QUFDQSxRQUFJLENBQUNELElBQUwsRUFBVztBQUNWLGFBQU9DLEtBQVA7QUFDQTs7QUFDRCxRQUFHRCxJQUFJLENBQUNFLE1BQUwsR0FBYyxDQUFqQixFQUFtQjtBQUNsQkQsTUFBQUEsS0FBSyxHQUFHLENBQVI7QUFDQTs7QUFDRCxRQUFNRSxVQUFVLEdBQUc7QUFDbEJDLE1BQUFBLE1BQU0sRUFBRSxLQUFLQyxJQUFMLENBQVVMLElBQVYsQ0FEVTtBQUVsQk0sTUFBQUEsS0FBSyxFQUFFLFFBQVFELElBQVIsQ0FBYUwsSUFBYixDQUZXO0FBR2xCTyxNQUFBQSxLQUFLLEVBQUUsUUFBUUYsSUFBUixDQUFhTCxJQUFiLENBSFc7QUFJbEJRLE1BQUFBLFFBQVEsRUFBRSxLQUFLSCxJQUFMLENBQVVMLElBQVY7QUFKUSxLQUFuQjs7QUFNQSxTQUFLLElBQU1TLEtBQVgsSUFBb0JOLFVBQXBCLEVBQWdDO0FBQy9CRixNQUFBQSxLQUFLLElBQUtFLFVBQVUsQ0FBQ00sS0FBRCxDQUFWLEtBQXNCLElBQXZCLEdBQStCLENBQS9CLEdBQW1DLENBQTVDO0FBQ0E7O0FBQ0QsV0FBT1IsS0FBSyxHQUFHLEVBQWY7QUFDQSxHQW5Cb0I7QUFvQnJCUyxFQUFBQSxpQkFwQnFCLDZCQW9CSEMsS0FwQkcsRUFvQkk7QUFDeEIsUUFBTVYsS0FBSyxHQUFHSCxhQUFhLENBQUNDLGFBQWQsQ0FBNEJZLEtBQUssQ0FBQ1gsSUFBbEMsQ0FBZDtBQUNBVyxJQUFBQSxLQUFLLENBQUNDLEdBQU4sQ0FBVUMsUUFBVixDQUFtQjtBQUNsQkMsTUFBQUEsT0FBTyxFQUFFQyxJQUFJLENBQUNDLEdBQUwsQ0FBU2YsS0FBVCxFQUFnQixHQUFoQixDQURTO0FBRWxCZ0IsTUFBQUEsWUFBWSxFQUFFO0FBRkksS0FBbkI7QUFJQU4sSUFBQUEsS0FBSyxDQUFDTyxPQUFOLENBQWNDLElBQWQ7QUFDQSxXQUFPLEVBQVA7QUFDQTtBQTVCb0IsQ0FBdEIsQyxDQStCQSIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBNaWtvUEJYIC0gZnJlZSBwaG9uZSBzeXN0ZW0gZm9yIHNtYWxsIGJ1c2luZXNzXG4gKiBDb3B5cmlnaHQgKEMpIDIwMTctMjAyMyBBbGV4ZXkgUG9ydG5vdiBhbmQgTmlrb2xheSBCZWtldG92XG4gKlxuICogVGhpcyBwcm9ncmFtIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbiAqIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uOyBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxuICogKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbiAqIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG4gKiBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG4gKiBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFsb25nIHdpdGggdGhpcyBwcm9ncmFtLlxuICogSWYgbm90LCBzZWUgPGh0dHBzOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqL1xuXG5cbmNvbnN0IFBhc3N3b3JkU2NvcmUgPSB7XG5cdHNjb3JlUGFzc3dvcmQocGFzcykge1xuXHRcdGxldCBzY29yZSA9IDA7XG5cdFx0aWYgKCFwYXNzKSB7XG5cdFx0XHRyZXR1cm4gc2NvcmU7XG5cdFx0fVxuXHRcdGlmKHBhc3MubGVuZ3RoID4gNSl7XG5cdFx0XHRzY29yZSA9IDI7XG5cdFx0fVxuXHRcdGNvbnN0IHZhcmlhdGlvbnMgPSB7XG5cdFx0XHRkaWdpdHM6IC9cXGQvLnRlc3QocGFzcyksXG5cdFx0XHRsb3dlcjogL1thLXpdLy50ZXN0KHBhc3MpLFxuXHRcdFx0dXBwZXI6IC9bQS1aXS8udGVzdChwYXNzKSxcblx0XHRcdG5vbldvcmRzOiAvXFxXLy50ZXN0KHBhc3MpLFxuXHRcdH07XG5cdFx0Zm9yIChjb25zdCBjaGVjayBpbiB2YXJpYXRpb25zKSB7XG5cdFx0XHRzY29yZSArPSAodmFyaWF0aW9uc1tjaGVja10gPT09IHRydWUpID8gMiA6IDA7XG5cdFx0fVxuXHRcdHJldHVybiBzY29yZSAqIDEwO1xuXHR9LFxuXHRjaGVja1Bhc3NTdHJlbmd0aChwYXJhbSkge1xuXHRcdGNvbnN0IHNjb3JlID0gUGFzc3dvcmRTY29yZS5zY29yZVBhc3N3b3JkKHBhcmFtLnBhc3MpO1xuXHRcdHBhcmFtLmJhci5wcm9ncmVzcyh7XG5cdFx0XHRwZXJjZW50OiBNYXRoLm1pbihzY29yZSwgMTAwKSxcblx0XHRcdHNob3dBY3Rpdml0eTogZmFsc2UsXG5cdFx0fSk7XG5cdFx0cGFyYW0uc2VjdGlvbi5zaG93KCk7IFxuXHRcdHJldHVybiAnJztcblx0fSxcbn07XG5cbi8vIGV4cG9ydCBkZWZhdWx0IFBhc3N3b3JkU2NvcmU7XG4iXX0=