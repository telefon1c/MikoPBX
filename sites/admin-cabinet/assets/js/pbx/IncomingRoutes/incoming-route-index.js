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

/* global globalRootUrl,globalTranslate, Extensions, Form */
// Если выбран вариант переадресации на номер, а сам номер не выбран
//
$.fn.form.settings.rules.extensionRule = function (value) {
  if ($('#action').val() === 'extension' && (value === -1 || value === '')) {
    return false;
  }

  return true;
};

var incomingRoutes = {
  $formObj: $('#default-rule-form'),
  $actionDropdown: $('#action'),
  validateRules: {
    extension: {
      identifier: 'extension',
      rules: [{
        type: 'extensionRule',
        prompt: globalTranslate.ir_ValidateForwardingToBeFilled
      }]
    }
  },
  initialize: function initialize() {
    $('#routingTable').tableDnD({
      onDrop: incomingRoutes.cbOnDrop,
      onDragClass: 'hoveringRow',
      dragHandle: '.dragHandle'
    });
    incomingRoutes.$actionDropdown.dropdown({
      onChange: incomingRoutes.toggleDisabledFieldClass
    });
    incomingRoutes.toggleDisabledFieldClass();
    incomingRoutes.initializeForm();
    $('.forwarding-select').dropdown(Extensions.getDropdownSettingsForRouting());
    $('.rule-row td').on('dblclick', function (e) {
      var id = $(e.target).closest('tr').attr('id');
      window.location = "".concat(globalRootUrl, "incoming-routes/modify/").concat(id);
    });
  },
  cbOnDrop: function cbOnDrop() {
    var priorityWasChanged = false;
    var priorityData = {};
    $('.rule-row').each(function (index, obj) {
      var ruleId = $(obj).attr('id');
      var oldPriority = parseInt($(obj).attr('data-value'), 10);
      var newPriority = obj.rowIndex;

      if (oldPriority !== newPriority) {
        priorityWasChanged = true;
        priorityData[ruleId] = newPriority;
      }
    });

    if (priorityWasChanged) {
      $.api({
        on: 'now',
        url: "".concat(globalRootUrl, "incoming-routes/changePriority"),
        method: 'POST',
        data: priorityData
      });
    }
  },
  toggleDisabledFieldClass: function toggleDisabledFieldClass() {
    if (incomingRoutes.$formObj.form('get value', 'action') === 'extension') {
      $('#extension-group').show();
    } else {
      $('#extension-group').hide();
      $('#extension').dropdown('clear');
    }
  },
  cbBeforeSendForm: function cbBeforeSendForm(settings) {
    var result = settings;
    result.data = incomingRoutes.$formObj.form('get values');
    return result;
  },
  cbAfterSendForm: function cbAfterSendForm() {},
  initializeForm: function initializeForm() {
    Form.$formObj = incomingRoutes.$formObj;
    Form.url = "".concat(globalRootUrl, "incoming-routes/save");
    Form.validateRules = incomingRoutes.validateRules;
    Form.cbBeforeSendForm = incomingRoutes.cbBeforeSendForm;
    Form.cbAfterSendForm = incomingRoutes.cbAfterSendForm;
    Form.initialize();
  }
};
$(document).ready(function () {
  incomingRoutes.initialize();
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9JbmNvbWluZ1JvdXRlcy9pbmNvbWluZy1yb3V0ZS1pbmRleC5qcyJdLCJuYW1lcyI6WyIkIiwiZm4iLCJmb3JtIiwic2V0dGluZ3MiLCJydWxlcyIsImV4dGVuc2lvblJ1bGUiLCJ2YWx1ZSIsInZhbCIsImluY29taW5nUm91dGVzIiwiJGZvcm1PYmoiLCIkYWN0aW9uRHJvcGRvd24iLCJ2YWxpZGF0ZVJ1bGVzIiwiZXh0ZW5zaW9uIiwiaWRlbnRpZmllciIsInR5cGUiLCJwcm9tcHQiLCJnbG9iYWxUcmFuc2xhdGUiLCJpcl9WYWxpZGF0ZUZvcndhcmRpbmdUb0JlRmlsbGVkIiwiaW5pdGlhbGl6ZSIsInRhYmxlRG5EIiwib25Ecm9wIiwiY2JPbkRyb3AiLCJvbkRyYWdDbGFzcyIsImRyYWdIYW5kbGUiLCJkcm9wZG93biIsIm9uQ2hhbmdlIiwidG9nZ2xlRGlzYWJsZWRGaWVsZENsYXNzIiwiaW5pdGlhbGl6ZUZvcm0iLCJFeHRlbnNpb25zIiwiZ2V0RHJvcGRvd25TZXR0aW5nc0ZvclJvdXRpbmciLCJvbiIsImUiLCJpZCIsInRhcmdldCIsImNsb3Nlc3QiLCJhdHRyIiwid2luZG93IiwibG9jYXRpb24iLCJnbG9iYWxSb290VXJsIiwicHJpb3JpdHlXYXNDaGFuZ2VkIiwicHJpb3JpdHlEYXRhIiwiZWFjaCIsImluZGV4Iiwib2JqIiwicnVsZUlkIiwib2xkUHJpb3JpdHkiLCJwYXJzZUludCIsIm5ld1ByaW9yaXR5Iiwicm93SW5kZXgiLCJhcGkiLCJ1cmwiLCJtZXRob2QiLCJkYXRhIiwic2hvdyIsImhpZGUiLCJjYkJlZm9yZVNlbmRGb3JtIiwicmVzdWx0IiwiY2JBZnRlclNlbmRGb3JtIiwiRm9ybSIsImRvY3VtZW50IiwicmVhZHkiXSwibWFwcGluZ3MiOiI7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtB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QkFBdkM7QUFDQUcsSUFBQUEsSUFBSSxDQUFDRCxlQUFMLEdBQXVCakQsY0FBYyxDQUFDaUQsZUFBdEM7QUFDQUMsSUFBQUEsSUFBSSxDQUFDeEMsVUFBTDtBQUNBO0FBL0VxQixDQUF2QjtBQWtGQWxCLENBQUMsQ0FBQzJELFFBQUQsQ0FBRCxDQUFZQyxLQUFaLENBQWtCLFlBQU07QUFDdkJwRCxFQUFBQSxjQUFjLENBQUNVLFVBQWY7QUFDQSxDQUZEIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIE1pa29QQlggLSBmcmVlIHBob25lIHN5c3RlbSBmb3Igc21hbGwgYnVzaW5lc3NcbiAqIENvcHlyaWdodCAoQykgMjAxNy0yMDIzIEFsZXhleSBQb3J0bm92IGFuZCBOaWtvbGF5IEJla2V0b3ZcbiAqXG4gKiBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuICogaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb247IGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4gKiAoYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFRoaXMgcHJvZ3JhbSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuICogYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcbiAqIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYWxvbmcgd2l0aCB0aGlzIHByb2dyYW0uXG4gKiBJZiBub3QsIHNlZSA8aHR0cHM6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICovXG5cbi8qIGdsb2JhbCBnbG9iYWxSb290VXJsLGdsb2JhbFRyYW5zbGF0ZSwgRXh0ZW5zaW9ucywgRm9ybSAqL1xuXG4vLyDQldGB0LvQuCDQstGL0LHRgNCw0L0g0LLQsNGA0LjQsNC90YIg0L/QtdGA0LXQsNC00YDQtdGB0LDRhtC40Lgg0L3QsCDQvdC+0LzQtdGALCDQsCDRgdCw0Lwg0L3QvtC80LXRgCDQvdC1INCy0YvQsdGA0LDQvVxuLy9cbiQuZm4uZm9ybS5zZXR0aW5ncy5ydWxlcy5leHRlbnNpb25SdWxlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG5cdGlmICgoJCgnI2FjdGlvbicpLnZhbCgpID09PSAnZXh0ZW5zaW9uJykgJiZcblx0XHQodmFsdWUgPT09IC0xIHx8IHZhbHVlID09PSAnJykpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblx0cmV0dXJuIHRydWU7XG59O1xuXG5jb25zdCBpbmNvbWluZ1JvdXRlcyA9IHtcblx0JGZvcm1PYmo6ICQoJyNkZWZhdWx0LXJ1bGUtZm9ybScpLFxuXHQkYWN0aW9uRHJvcGRvd246ICQoJyNhY3Rpb24nKSxcblx0dmFsaWRhdGVSdWxlczoge1xuXHRcdGV4dGVuc2lvbjoge1xuXHRcdFx0aWRlbnRpZmllcjogJ2V4dGVuc2lvbicsXG5cdFx0XHRydWxlczogW1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dHlwZTogJ2V4dGVuc2lvblJ1bGUnLFxuXHRcdFx0XHRcdHByb21wdDogZ2xvYmFsVHJhbnNsYXRlLmlyX1ZhbGlkYXRlRm9yd2FyZGluZ1RvQmVGaWxsZWQsXG5cdFx0XHRcdH0sXG5cdFx0XHRdLFxuXHRcdH0sXG5cdH0sXG5cdGluaXRpYWxpemUoKSB7XG5cdFx0JCgnI3JvdXRpbmdUYWJsZScpLnRhYmxlRG5EKHtcblx0XHRcdG9uRHJvcDogaW5jb21pbmdSb3V0ZXMuY2JPbkRyb3AsXG5cdFx0XHRvbkRyYWdDbGFzczogJ2hvdmVyaW5nUm93Jyxcblx0XHRcdGRyYWdIYW5kbGU6ICcuZHJhZ0hhbmRsZScsXG5cdFx0fSk7XG5cblx0XHRpbmNvbWluZ1JvdXRlcy4kYWN0aW9uRHJvcGRvd24uZHJvcGRvd24oe1xuXHRcdFx0b25DaGFuZ2U6IGluY29taW5nUm91dGVzLnRvZ2dsZURpc2FibGVkRmllbGRDbGFzc1xuXHRcdH0pO1xuXG5cdFx0aW5jb21pbmdSb3V0ZXMudG9nZ2xlRGlzYWJsZWRGaWVsZENsYXNzKCk7XG5cblx0XHRpbmNvbWluZ1JvdXRlcy5pbml0aWFsaXplRm9ybSgpO1xuXHRcdCQoJy5mb3J3YXJkaW5nLXNlbGVjdCcpLmRyb3Bkb3duKEV4dGVuc2lvbnMuZ2V0RHJvcGRvd25TZXR0aW5nc0ZvclJvdXRpbmcoKSk7XG5cblx0XHQkKCcucnVsZS1yb3cgdGQnKS5vbignZGJsY2xpY2snLCAoZSkgPT4ge1xuXHRcdFx0Y29uc3QgaWQgPSAkKGUudGFyZ2V0KS5jbG9zZXN0KCd0cicpLmF0dHIoJ2lkJyk7XG5cdFx0XHR3aW5kb3cubG9jYXRpb24gPSBgJHtnbG9iYWxSb290VXJsfWluY29taW5nLXJvdXRlcy9tb2RpZnkvJHtpZH1gO1xuXHRcdH0pO1xuXHR9LFxuXHRjYk9uRHJvcCgpIHtcblx0XHRsZXQgcHJpb3JpdHlXYXNDaGFuZ2VkID0gZmFsc2U7XG5cdFx0Y29uc3QgcHJpb3JpdHlEYXRhID0ge307XG5cdFx0JCgnLnJ1bGUtcm93JykuZWFjaCgoaW5kZXgsIG9iaikgPT4ge1xuXHRcdFx0Y29uc3QgcnVsZUlkID0gJChvYmopLmF0dHIoJ2lkJyk7XG5cdFx0XHRjb25zdCBvbGRQcmlvcml0eSA9IHBhcnNlSW50KCQob2JqKS5hdHRyKCdkYXRhLXZhbHVlJyksIDEwKTtcblx0XHRcdGNvbnN0IG5ld1ByaW9yaXR5ID0gb2JqLnJvd0luZGV4O1xuXHRcdFx0aWYgKG9sZFByaW9yaXR5ICE9PSBuZXdQcmlvcml0eSkge1xuXHRcdFx0XHRwcmlvcml0eVdhc0NoYW5nZWQgPSB0cnVlO1xuXHRcdFx0XHRwcmlvcml0eURhdGFbcnVsZUlkXSA9IG5ld1ByaW9yaXR5O1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdGlmIChwcmlvcml0eVdhc0NoYW5nZWQpIHtcblx0XHRcdCQuYXBpKHtcblx0XHRcdFx0b246ICdub3cnLFxuXHRcdFx0XHR1cmw6IGAke2dsb2JhbFJvb3RVcmx9aW5jb21pbmctcm91dGVzL2NoYW5nZVByaW9yaXR5YCxcblx0XHRcdFx0bWV0aG9kOiAnUE9TVCcsXG5cdFx0XHRcdGRhdGE6IHByaW9yaXR5RGF0YSxcblx0XHRcdH0pO1xuXHRcdH1cblx0fSxcblx0dG9nZ2xlRGlzYWJsZWRGaWVsZENsYXNzKCkge1xuXHRcdGlmIChpbmNvbWluZ1JvdXRlcy4kZm9ybU9iai5mb3JtKCdnZXQgdmFsdWUnLCAnYWN0aW9uJykgPT09ICdleHRlbnNpb24nKSB7XG5cdFx0XHQkKCcjZXh0ZW5zaW9uLWdyb3VwJykuc2hvdygpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQkKCcjZXh0ZW5zaW9uLWdyb3VwJykuaGlkZSgpO1xuXHRcdFx0JCgnI2V4dGVuc2lvbicpLmRyb3Bkb3duKCdjbGVhcicpO1xuXHRcdH1cblx0fSxcblx0Y2JCZWZvcmVTZW5kRm9ybShzZXR0aW5ncykge1xuXHRcdGNvbnN0IHJlc3VsdCA9IHNldHRpbmdzO1xuXHRcdHJlc3VsdC5kYXRhID0gaW5jb21pbmdSb3V0ZXMuJGZvcm1PYmouZm9ybSgnZ2V0IHZhbHVlcycpO1xuXHRcdHJldHVybiByZXN1bHQ7XG5cdH0sXG5cdGNiQWZ0ZXJTZW5kRm9ybSgpIHtcblxuXHR9LFxuXHRpbml0aWFsaXplRm9ybSgpIHtcblx0XHRGb3JtLiRmb3JtT2JqID0gaW5jb21pbmdSb3V0ZXMuJGZvcm1PYmo7XG5cdFx0Rm9ybS51cmwgPSBgJHtnbG9iYWxSb290VXJsfWluY29taW5nLXJvdXRlcy9zYXZlYDtcblx0XHRGb3JtLnZhbGlkYXRlUnVsZXMgPSBpbmNvbWluZ1JvdXRlcy52YWxpZGF0ZVJ1bGVzO1xuXHRcdEZvcm0uY2JCZWZvcmVTZW5kRm9ybSA9IGluY29taW5nUm91dGVzLmNiQmVmb3JlU2VuZEZvcm07XG5cdFx0Rm9ybS5jYkFmdGVyU2VuZEZvcm0gPSBpbmNvbWluZ1JvdXRlcy5jYkFmdGVyU2VuZEZvcm07XG5cdFx0Rm9ybS5pbml0aWFsaXplKCk7XG5cdH0sXG59O1xuXG4kKGRvY3VtZW50KS5yZWFkeSgoKSA9PiB7XG5cdGluY29taW5nUm91dGVzLmluaXRpYWxpemUoKTtcbn0pO1xuIl19