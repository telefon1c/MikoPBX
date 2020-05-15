"use strict";

/*
 * Copyright (C) MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Nikolay Beketov, 12 2019
 *
 */

/* global globalRootUrl, globalTranslate, Extensions,Form  */
// Проверка нет ли ошибки занятого другой учеткой номера
$.fn.form.settings.rules.existRule = function (value, parameter) {
  return $("#".concat(parameter)).hasClass('hidden');
};

var callQueue = {
  defaultExtension: '',
  $number: $('#extension'),
  $dirrtyField: $('#dirrty'),
  AvailableMembersList: [],
  $formObj: $('#queue-form'),
  $accordions: $('#queue-form .ui.accordion'),
  $dropDowns: $('#queue-form .dropdown'),
  $errorMessages: $('#form-error-messages'),
  $checkBoxes: $('#queue-form .checkbox'),
  forwardingSelect: '#queue-form .forwarding-select',
  $deleteRowButton: $('.delete-row-button'),
  $periodicAnnounceDropdown: $('#queue-form .periodic-announce-sound-id-select'),
  memberRow: '#queue-form .member-row',
  $extensionSelectDropdown: $('#extensionselect'),
  $extensionsTable: $('#extensionsTable'),
  validateRules: {
    name: {
      identifier: 'name',
      rules: [{
        type: 'empty',
        prompt: globalTranslate.cq_ValidateNameEmpty
      }]
    },
    extension: {
      identifier: 'extension',
      rules: [{
        type: 'empty',
        prompt: globalTranslate.cq_ValidateExtensionEmpty
      }, {
        type: 'existRule[extension-error]',
        prompt: globalTranslate.cq_ValidateExtensionDouble
      }]
    }
  },
  initialize: function () {
    function initialize() {
      Extensions.getPhoneExtensions(callQueue.setAvailableQueueMembers);
      callQueue.defaultExtension = $('#extension').val();
      callQueue.$accordions.accordion();
      callQueue.$dropDowns.dropdown();
      callQueue.$checkBoxes.checkbox();
      callQueue.$periodicAnnounceDropdown.dropdown({
        onChange: function () {
          function onChange(value) {
            if (parseInt(value, 10) === -1) {
              callQueue.$periodicAnnounceDropdown.dropdown('clear');
            }
          }

          return onChange;
        }()
      });
      $(callQueue.forwardingSelect).dropdown(Extensions.getDropdownSettingsWithEmpty());
      Extensions.fixBugDropdownIcon(); // Динамическая прововерка свободен ли внутренний номер

      callQueue.$number.on('change', function () {
        var newNumber = callQueue.$formObj.form('get value', 'extension');
        Extensions.checkAvailability(callQueue.defaultNumber, newNumber);
      });
      callQueue.initializeDragAndDropExtensionTableRows(); // Удаление строки из таблицы участников очереди

      callQueue.$deleteRowButton.on('click', function (e) {
        $(e.target).closest('tr').remove();
        callQueue.reinitializeExtensionSelect();
        callQueue.updateExtensionTableView();
        callQueue.$dirrtyField.val(Math.random());
        callQueue.$dirrtyField.trigger('change');
        e.preventDefault();
        return false;
      });
      callQueue.initializeForm();
    }

    return initialize;
  }(),
  setAvailableQueueMembers: function () {
    function setAvailableQueueMembers(arrResult) {
      $.each(arrResult.results, function (index, extension) {
        callQueue.AvailableMembersList.push({
          number: extension.value,
          callerid: extension.name
        });
      });
      callQueue.reinitializeExtensionSelect();
      callQueue.updateExtensionTableView();
    }

    return setAvailableQueueMembers;
  }(),
  // Вернуть список доступных членов очереди
  getAvailableQueueMembers: function () {
    function getAvailableQueueMembers() {
      var result = [];
      callQueue.AvailableMembersList.forEach(function (member) {
        if ($(".member-row#".concat(member.number)).length === 0) {
          result.push({
            name: member.callerid,
            value: member.number
          });
        }
      }); // result.sort((a, b) => ((a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0)));

      return result;
    }

    return getAvailableQueueMembers;
  }(),
  // Пересобрать членов очереди с учетом уже выбранных
  reinitializeExtensionSelect: function () {
    function reinitializeExtensionSelect() {
      callQueue.$extensionSelectDropdown.dropdown({
        action: 'hide',
        forceSelection: false,
        onChange: function () {
          function onChange(value, text) {
            if (value) {
              var $tr = $('.member-row-tpl').last();
              var $clone = $tr.clone(true);
              $clone.removeClass('member-row-tpl').addClass('member-row').show();
              $clone.attr('id', value);
              $clone.find('.number').html(value);
              $clone.find('.callerid').html(text);

              if ($(callQueue.memberRow).last().length === 0) {
                $tr.after($clone);
              } else {
                $(callQueue.memberRow).last().after($clone);
              }

              callQueue.reinitializeExtensionSelect();
              callQueue.updateExtensionTableView();
              callQueue.$dirrtyField.val(Math.random());
              callQueue.$dirrtyField.trigger('change');
            }
          }

          return onChange;
        }(),
        values: callQueue.getAvailableQueueMembers()
      });
    }

    return reinitializeExtensionSelect;
  }(),
  // Включить возможность перетаскивания элементов таблицы участников очереди
  initializeDragAndDropExtensionTableRows: function () {
    function initializeDragAndDropExtensionTableRows() {
      callQueue.$extensionsTable.tableDnD({
        onDragClass: 'hoveringRow',
        dragHandle: '.dragHandle',
        onDrop: function () {
          function onDrop() {
            callQueue.$dirrtyField.val(Math.random());
            callQueue.$dirrtyField.trigger('change');
          }

          return onDrop;
        }()
      });
    }

    return initializeDragAndDropExtensionTableRows;
  }(),
  // Отобразить заглушку если в таблице 0 строк
  updateExtensionTableView: function () {
    function updateExtensionTableView() {
      var dummy = "<tr class=\"dummy\"><td colspan=\"4\" class=\"center aligned\">".concat(globalTranslate.cq_AddQueueMembers, "</td></tr>");

      if ($(callQueue.memberRow).length === 0) {
        $('#extensionsTable tbody').append(dummy);
      } else {
        $('#extensionsTable tbody .dummy').remove();
      }
    }

    return updateExtensionTableView;
  }(),
  cbBeforeSendForm: function () {
    function cbBeforeSendForm(settings) {
      var result = settings;
      result.data = callQueue.$formObj.form('get values');
      var arrMembers = [];
      $('#queue-form .member-row').each(function (index, obj) {
        if ($(obj).attr('id')) {
          arrMembers.push({
            number: $(obj).attr('id'),
            priority: index
          });
        }
      });

      if (arrMembers.length === 0) {
        result = false;
        callQueue.$errorMessages.html(globalTranslate.cq_ValidateNoExtensions);
        callQueue.$formObj.addClass('error');
      } else {
        result.data.members = JSON.stringify(arrMembers);
      }

      return result;
    }

    return cbBeforeSendForm;
  }(),
  cbAfterSendForm: function () {
    function cbAfterSendForm() {
      callQueue.defaultNumber = callQueue.$number.val();
    }

    return cbAfterSendForm;
  }(),
  initializeForm: function () {
    function initializeForm() {
      Form.$formObj = callQueue.$formObj;
      Form.url = "".concat(globalRootUrl, "call-queues/save");
      Form.validateRules = callQueue.validateRules;
      Form.cbBeforeSendForm = callQueue.cbBeforeSendForm;
      Form.cbAfterSendForm = callQueue.cbAfterSendForm;
      Form.initialize();
    }

    return initializeForm;
  }()
};
$(document).ready(function () {
  callQueue.initialize();
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9DYWxsUXVldWVzL2NhbGxxdWV1ZS1tb2RpZnkuanMiXSwibmFtZXMiOlsiJCIsImZuIiwiZm9ybSIsInNldHRpbmdzIiwicnVsZXMiLCJleGlzdFJ1bGUiLCJ2YWx1ZSIsInBhcmFtZXRlciIsImhhc0NsYXNzIiwiY2FsbFF1ZXVlIiwiZGVmYXVsdEV4dGVuc2lvbiIsIiRudW1iZXIiLCIkZGlycnR5RmllbGQiLCJBdmFpbGFibGVNZW1iZXJzTGlzdCIsIiRmb3JtT2JqIiwiJGFjY29yZGlvbnMiLCIkZHJvcERvd25zIiwiJGVycm9yTWVzc2FnZXMiLCIkY2hlY2tCb3hlcyIsImZvcndhcmRpbmdTZWxlY3QiLCIkZGVsZXRlUm93QnV0dG9uIiwiJHBlcmlvZGljQW5ub3VuY2VEcm9wZG93biIsIm1lbWJlclJvdyIsIiRleHRlbnNpb25TZWxlY3REcm9wZG93biIsIiRleHRlbnNpb25zVGFibGUiLCJ2YWxpZGF0ZVJ1bGVzIiwibmFtZSIsImlkZW50aWZpZXIiLCJ0eXBlIiwicHJvbXB0IiwiZ2xvYmFsVHJhbnNsYXRlIiwiY3FfVmFsaWRhdGVOYW1lRW1wdHkiLCJleHRlbnNpb24iLCJjcV9WYWxpZGF0ZUV4dGVuc2lvbkVtcHR5IiwiY3FfVmFsaWRhdGVFeHRlbnNpb25Eb3VibGUiLCJpbml0aWFsaXplIiwiRXh0ZW5zaW9ucyIsImdldFBob25lRXh0ZW5zaW9ucyIsInNldEF2YWlsYWJsZVF1ZXVlTWVtYmVycyIsInZhbCIsImFjY29yZGlvbiIsImRyb3Bkb3duIiwiY2hlY2tib3giLCJvbkNoYW5nZSIsInBhcnNlSW50IiwiZ2V0RHJvcGRvd25TZXR0aW5nc1dpdGhFbXB0eSIsImZpeEJ1Z0Ryb3Bkb3duSWNvbiIsIm9uIiwibmV3TnVtYmVyIiwiY2hlY2tBdmFpbGFiaWxpdHkiLCJkZWZhdWx0TnVtYmVyIiwiaW5pdGlhbGl6ZURyYWdBbmREcm9wRXh0ZW5zaW9uVGFibGVSb3dzIiwiZSIsInRhcmdldCIsImNsb3Nlc3QiLCJyZW1vdmUiLCJyZWluaXRpYWxpemVFeHRlbnNpb25TZWxlY3QiLCJ1cGRhdGVFeHRlbnNpb25UYWJsZVZpZXciLCJNYXRoIiwicmFuZG9tIiwidHJpZ2dlciIsInByZXZlbnREZWZhdWx0IiwiaW5pdGlhbGl6ZUZvcm0iLCJhcnJSZXN1bHQiLCJlYWNoIiwicmVzdWx0cyIsImluZGV4IiwicHVzaCIsIm51bWJlciIsImNhbGxlcmlkIiwiZ2V0QXZhaWxhYmxlUXVldWVNZW1iZXJzIiwicmVzdWx0IiwiZm9yRWFjaCIsIm1lbWJlciIsImxlbmd0aCIsImFjdGlvbiIsImZvcmNlU2VsZWN0aW9uIiwidGV4dCIsIiR0ciIsImxhc3QiLCIkY2xvbmUiLCJjbG9uZSIsInJlbW92ZUNsYXNzIiwiYWRkQ2xhc3MiLCJzaG93IiwiYXR0ciIsImZpbmQiLCJodG1sIiwiYWZ0ZXIiLCJ2YWx1ZXMiLCJ0YWJsZURuRCIsIm9uRHJhZ0NsYXNzIiwiZHJhZ0hhbmRsZSIsIm9uRHJvcCIsImR1bW15IiwiY3FfQWRkUXVldWVNZW1iZXJzIiwiYXBwZW5kIiwiY2JCZWZvcmVTZW5kRm9ybSIsImRhdGEiLCJhcnJNZW1iZXJzIiwib2JqIiwicHJpb3JpdHkiLCJjcV9WYWxpZGF0ZU5vRXh0ZW5zaW9ucyIsIm1lbWJlcnMiLCJKU09OIiwic3RyaW5naWZ5IiwiY2JBZnRlclNlbmRGb3JtIiwiRm9ybSIsInVybCIsImdsb2JhbFJvb3RVcmwiLCJkb2N1bWVudCIsInJlYWR5Il0sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7OztBQVFBO0FBRUE7QUFDQUEsQ0FBQyxDQUFDQyxFQUFGLENBQUtDLElBQUwsQ0FBVUMsUUFBVixDQUFtQkMsS0FBbkIsQ0FBeUJDLFNBQXpCLEdBQXFDLFVBQUNDLEtBQUQsRUFBUUMsU0FBUjtBQUFBLFNBQXNCUCxDQUFDLFlBQUtPLFNBQUwsRUFBRCxDQUFtQkMsUUFBbkIsQ0FBNEIsUUFBNUIsQ0FBdEI7QUFBQSxDQUFyQzs7QUFFQSxJQUFNQyxTQUFTLEdBQUc7QUFDakJDLEVBQUFBLGdCQUFnQixFQUFF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O0FBMUxnQjtBQUFBO0FBQUEsQ0FBbEI7QUE2TEFuQyxDQUFDLENBQUM4RyxRQUFELENBQUQsQ0FBWUMsS0FBWixDQUFrQixZQUFNO0FBQ3ZCdEcsRUFBQUEsU0FBUyxDQUFDMEIsVUFBVjtBQUNBLENBRkQiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IChDKSBNSUtPIExMQyAtIEFsbCBSaWdodHMgUmVzZXJ2ZWRcbiAqIFVuYXV0aG9yaXplZCBjb3B5aW5nIG9mIHRoaXMgZmlsZSwgdmlhIGFueSBtZWRpdW0gaXMgc3RyaWN0bHkgcHJvaGliaXRlZFxuICogUHJvcHJpZXRhcnkgYW5kIGNvbmZpZGVudGlhbFxuICogV3JpdHRlbiBieSBOaWtvbGF5IEJla2V0b3YsIDEyIDIwMTlcbiAqXG4gKi9cblxuLyogZ2xvYmFsIGdsb2JhbFJvb3RVcmwsIGdsb2JhbFRyYW5zbGF0ZSwgRXh0ZW5zaW9ucyxGb3JtICAqL1xuXG4vLyDQn9GA0L7QstC10YDQutCwINC90LXRgiDQu9C4INC+0YjQuNCx0LrQuCDQt9Cw0L3Rj9GC0L7Qs9C+INC00YDRg9Cz0L7QuSDRg9GH0LXRgtC60L7QuSDQvdC+0LzQtdGA0LBcbiQuZm4uZm9ybS5zZXR0aW5ncy5ydWxlcy5leGlzdFJ1bGUgPSAodmFsdWUsIHBhcmFtZXRlcikgPT4gJChgIyR7cGFyYW1ldGVyfWApLmhhc0NsYXNzKCdoaWRkZW4nKTtcblxuY29uc3QgY2FsbFF1ZXVlID0ge1xuXHRkZWZhdWx0RXh0ZW5zaW9uOiAnJyxcblx0JG51bWJlcjogJCgnI2V4dGVuc2lvbicpLFxuXHQkZGlycnR5RmllbGQ6ICQoJyNkaXJydHknKSxcblx0QXZhaWxhYmxlTWVtYmVyc0xpc3Q6IFtdLFxuXHQkZm9ybU9iajogJCgnI3F1ZXVlLWZvcm0nKSxcblx0JGFjY29yZGlvbnM6ICQoJyNxdWV1ZS1mb3JtIC51aS5hY2NvcmRpb24nKSxcblx0JGRyb3BEb3duczogJCgnI3F1ZXVlLWZvcm0gLmRyb3Bkb3duJyksXG5cdCRlcnJvck1lc3NhZ2VzOiAkKCcjZm9ybS1lcnJvci1tZXNzYWdlcycpLFxuXHQkY2hlY2tCb3hlczogJCgnI3F1ZXVlLWZvcm0gLmNoZWNrYm94JyksXG5cdGZvcndhcmRpbmdTZWxlY3Q6ICcjcXVldWUtZm9ybSAuZm9yd2FyZGluZy1zZWxlY3QnLFxuXHQkZGVsZXRlUm93QnV0dG9uOiAkKCcuZGVsZXRlLXJvdy1idXR0b24nKSxcblx0JHBlcmlvZGljQW5ub3VuY2VEcm9wZG93bjogJCgnI3F1ZXVlLWZvcm0gLnBlcmlvZGljLWFubm91bmNlLXNvdW5kLWlkLXNlbGVjdCcpLFxuXHRtZW1iZXJSb3c6ICcjcXVldWUtZm9ybSAubWVtYmVyLXJvdycsXG5cdCRleHRlbnNpb25TZWxlY3REcm9wZG93bjogJCgnI2V4dGVuc2lvbnNlbGVjdCcpLFxuXHQkZXh0ZW5zaW9uc1RhYmxlOiAkKCcjZXh0ZW5zaW9uc1RhYmxlJyksXG5cdHZhbGlkYXRlUnVsZXM6IHtcblx0XHRuYW1lOiB7XG5cdFx0XHRpZGVudGlmaWVyOiAnbmFtZScsXG5cdFx0XHRydWxlczogW1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dHlwZTogJ2VtcHR5Jyxcblx0XHRcdFx0XHRwcm9tcHQ6IGdsb2JhbFRyYW5zbGF0ZS5jcV9WYWxpZGF0ZU5hbWVFbXB0eSxcblx0XHRcdFx0fSxcblx0XHRcdF0sXG5cdFx0fSxcblx0XHRleHRlbnNpb246IHtcblx0XHRcdGlkZW50aWZpZXI6ICdleHRlbnNpb24nLFxuXHRcdFx0cnVsZXM6IFtcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHR5cGU6ICdlbXB0eScsXG5cdFx0XHRcdFx0cHJvbXB0OiBnbG9iYWxUcmFuc2xhdGUuY3FfVmFsaWRhdGVFeHRlbnNpb25FbXB0eSxcblx0XHRcdFx0fSxcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHR5cGU6ICdleGlzdFJ1bGVbZXh0ZW5zaW9uLWVycm9yXScsXG5cdFx0XHRcdFx0cHJvbXB0OiBnbG9iYWxUcmFuc2xhdGUuY3FfVmFsaWRhdGVFeHRlbnNpb25Eb3VibGUsXG5cdFx0XHRcdH0sXG5cdFx0XHRdLFxuXHRcdH0sXG5cdH0sXG5cdGluaXRpYWxpemUoKSB7XG5cdFx0RXh0ZW5zaW9ucy5nZXRQaG9uZUV4dGVuc2lvbnMoY2FsbFF1ZXVlLnNldEF2YWlsYWJsZVF1ZXVlTWVtYmVycyk7XG5cdFx0Y2FsbFF1ZXVlLmRlZmF1bHRFeHRlbnNpb24gPSAkKCcjZXh0ZW5zaW9uJykudmFsKCk7XG5cdFx0Y2FsbFF1ZXVlLiRhY2NvcmRpb25zLmFjY29yZGlvbigpO1xuXHRcdGNhbGxRdWV1ZS4kZHJvcERvd25zLmRyb3Bkb3duKCk7XG5cdFx0Y2FsbFF1ZXVlLiRjaGVja0JveGVzLmNoZWNrYm94KCk7XG5cdFx0Y2FsbFF1ZXVlLiRwZXJpb2RpY0Fubm91bmNlRHJvcGRvd24uZHJvcGRvd24oe1xuXHRcdFx0b25DaGFuZ2UodmFsdWUpIHtcblx0XHRcdFx0aWYgKHBhcnNlSW50KHZhbHVlLCAxMCkgPT09IC0xKSB7XG5cdFx0XHRcdFx0Y2FsbFF1ZXVlLiRwZXJpb2RpY0Fubm91bmNlRHJvcGRvd24uZHJvcGRvd24oJ2NsZWFyJyk7XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0fSk7XG5cdFx0JChjYWxsUXVldWUuZm9yd2FyZGluZ1NlbGVjdCkuZHJvcGRvd24oRXh0ZW5zaW9ucy5nZXREcm9wZG93blNldHRpbmdzV2l0aEVtcHR5KCkpO1xuXHRcdEV4dGVuc2lvbnMuZml4QnVnRHJvcGRvd25JY29uKCk7XG5cdFx0Ly8g0JTQuNC90LDQvNC40YfQtdGB0LrQsNGPINC/0YDQvtCy0L7QstC10YDQutCwINGB0LLQvtCx0L7QtNC10L0g0LvQuCDQstC90YPRgtGA0LXQvdC90LjQuSDQvdC+0LzQtdGAXG5cdFx0Y2FsbFF1ZXVlLiRudW1iZXIub24oJ2NoYW5nZScsICgpID0+IHtcblx0XHRcdGNvbnN0IG5ld051bWJlciA9IGNhbGxRdWV1ZS4kZm9ybU9iai5mb3JtKCdnZXQgdmFsdWUnLCAnZXh0ZW5zaW9uJyk7XG5cdFx0XHRFeHRlbnNpb25zLmNoZWNrQXZhaWxhYmlsaXR5KGNhbGxRdWV1ZS5kZWZhdWx0TnVtYmVyLCBuZXdOdW1iZXIpO1xuXHRcdH0pO1xuXG5cdFx0Y2FsbFF1ZXVlLmluaXRpYWxpemVEcmFnQW5kRHJvcEV4dGVuc2lvblRhYmxlUm93cygpO1xuXG5cdFx0Ly8g0KPQtNCw0LvQtdC90LjQtSDRgdGC0YDQvtC60Lgg0LjQtyDRgtCw0LHQu9C40YbRiyDRg9GH0LDRgdGC0L3QuNC60L7QsiDQvtGH0LXRgNC10LTQuFxuXHRcdGNhbGxRdWV1ZS4kZGVsZXRlUm93QnV0dG9uLm9uKCdjbGljaycsIChlKSA9PiB7XG5cdFx0XHQkKGUudGFyZ2V0KS5jbG9zZXN0KCd0cicpLnJlbW92ZSgpO1xuXHRcdFx0Y2FsbFF1ZXVlLnJlaW5pdGlhbGl6ZUV4dGVuc2lvblNlbGVjdCgpO1xuXHRcdFx0Y2FsbFF1ZXVlLnVwZGF0ZUV4dGVuc2lvblRhYmxlVmlldygpO1xuXHRcdFx0Y2FsbFF1ZXVlLiRkaXJydHlGaWVsZC52YWwoTWF0aC5yYW5kb20oKSk7XG5cdFx0XHRjYWxsUXVldWUuJGRpcnJ0eUZpZWxkLnRyaWdnZXIoJ2NoYW5nZScpO1xuXHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH0pO1xuXG5cdFx0Y2FsbFF1ZXVlLmluaXRpYWxpemVGb3JtKCk7XG5cdH0sXG5cdHNldEF2YWlsYWJsZVF1ZXVlTWVtYmVycyhhcnJSZXN1bHQpIHtcblx0XHQkLmVhY2goYXJyUmVzdWx0LnJlc3VsdHMsIChpbmRleCwgZXh0ZW5zaW9uKSA9PiB7XG5cdFx0XHRjYWxsUXVldWUuQXZhaWxhYmxlTWVtYmVyc0xpc3QucHVzaCh7XG5cdFx0XHRcdG51bWJlcjogZXh0ZW5zaW9uLnZhbHVlLFxuXHRcdFx0XHRjYWxsZXJpZDogZXh0ZW5zaW9uLm5hbWUsXG5cdFx0XHR9KTtcblx0XHR9KTtcblx0XHRjYWxsUXVldWUucmVpbml0aWFsaXplRXh0ZW5zaW9uU2VsZWN0KCk7XG5cdFx0Y2FsbFF1ZXVlLnVwZGF0ZUV4dGVuc2lvblRhYmxlVmlldygpO1xuXHR9LFxuXHQvLyDQktC10YDQvdGD0YLRjCDRgdC/0LjRgdC+0Log0LTQvtGB0YLRg9C/0L3Ri9GFINGH0LvQtdC90L7QsiDQvtGH0LXRgNC10LTQuFxuXHRnZXRBdmFpbGFibGVRdWV1ZU1lbWJlcnMoKSB7XG5cdFx0Y29uc3QgcmVzdWx0ID0gW107XG5cdFx0Y2FsbFF1ZXVlLkF2YWlsYWJsZU1lbWJlcnNMaXN0LmZvckVhY2goKG1lbWJlcikgPT4ge1xuXHRcdFx0aWYgKCQoYC5tZW1iZXItcm93IyR7bWVtYmVyLm51bWJlcn1gKS5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0cmVzdWx0LnB1c2goe1xuXHRcdFx0XHRcdG5hbWU6IG1lbWJlci5jYWxsZXJpZCxcblx0XHRcdFx0XHR2YWx1ZTogbWVtYmVyLm51bWJlcixcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0Ly8gcmVzdWx0LnNvcnQoKGEsIGIpID0+ICgoYS5uYW1lID4gYi5uYW1lKSA/IDEgOiAoKGIubmFtZSA+IGEubmFtZSkgPyAtMSA6IDApKSk7XG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fSxcblx0Ly8g0J/QtdGA0LXRgdC+0LHRgNCw0YLRjCDRh9C70LXQvdC+0LIg0L7Rh9C10YDQtdC00Lgg0YEg0YPRh9C10YLQvtC8INGD0LbQtSDQstGL0LHRgNCw0L3QvdGL0YVcblx0cmVpbml0aWFsaXplRXh0ZW5zaW9uU2VsZWN0KCkge1xuXHRcdGNhbGxRdWV1ZS4kZXh0ZW5zaW9uU2VsZWN0RHJvcGRvd24uZHJvcGRvd24oe1xuXHRcdFx0YWN0aW9uOiAnaGlkZScsXG5cdFx0XHRmb3JjZVNlbGVjdGlvbjogZmFsc2UsXG5cdFx0XHRvbkNoYW5nZSh2YWx1ZSwgdGV4dCkge1xuXHRcdFx0XHRpZiAodmFsdWUpIHtcblx0XHRcdFx0XHRjb25zdCAkdHIgPSAkKCcubWVtYmVyLXJvdy10cGwnKS5sYXN0KCk7XG5cdFx0XHRcdFx0Y29uc3QgJGNsb25lID0gJHRyLmNsb25lKHRydWUpO1xuXHRcdFx0XHRcdCRjbG9uZVxuXHRcdFx0XHRcdFx0LnJlbW92ZUNsYXNzKCdtZW1iZXItcm93LXRwbCcpXG5cdFx0XHRcdFx0XHQuYWRkQ2xhc3MoJ21lbWJlci1yb3cnKVxuXHRcdFx0XHRcdFx0LnNob3coKTtcblx0XHRcdFx0XHQkY2xvbmUuYXR0cignaWQnLCB2YWx1ZSk7XG5cdFx0XHRcdFx0JGNsb25lLmZpbmQoJy5udW1iZXInKS5odG1sKHZhbHVlKTtcblx0XHRcdFx0XHQkY2xvbmUuZmluZCgnLmNhbGxlcmlkJykuaHRtbCh0ZXh0KTtcblx0XHRcdFx0XHRpZiAoJChjYWxsUXVldWUubWVtYmVyUm93KS5sYXN0KCkubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRcdFx0XHQkdHIuYWZ0ZXIoJGNsb25lKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0JChjYWxsUXVldWUubWVtYmVyUm93KS5sYXN0KCkuYWZ0ZXIoJGNsb25lKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRjYWxsUXVldWUucmVpbml0aWFsaXplRXh0ZW5zaW9uU2VsZWN0KCk7XG5cdFx0XHRcdFx0Y2FsbFF1ZXVlLnVwZGF0ZUV4dGVuc2lvblRhYmxlVmlldygpO1xuXHRcdFx0XHRcdGNhbGxRdWV1ZS4kZGlycnR5RmllbGQudmFsKE1hdGgucmFuZG9tKCkpO1xuXHRcdFx0XHRcdGNhbGxRdWV1ZS4kZGlycnR5RmllbGQudHJpZ2dlcignY2hhbmdlJyk7XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHR2YWx1ZXM6IGNhbGxRdWV1ZS5nZXRBdmFpbGFibGVRdWV1ZU1lbWJlcnMoKSxcblxuXHRcdH0pO1xuXHR9LCAvLyDQktC60LvRjtGH0LjRgtGMINCy0L7Qt9C80L7QttC90L7RgdGC0Ywg0L/QtdGA0LXRgtCw0YHQutC40LLQsNC90LjRjyDRjdC70LXQvNC10L3RgtC+0LIg0YLQsNCx0LvQuNGG0Ysg0YPRh9Cw0YHRgtC90LjQutC+0LIg0L7Rh9C10YDQtdC00LhcblxuXHRpbml0aWFsaXplRHJhZ0FuZERyb3BFeHRlbnNpb25UYWJsZVJvd3MoKSB7XG5cdFx0Y2FsbFF1ZXVlLiRleHRlbnNpb25zVGFibGUudGFibGVEbkQoe1xuXHRcdFx0b25EcmFnQ2xhc3M6ICdob3ZlcmluZ1JvdycsXG5cdFx0XHRkcmFnSGFuZGxlOiAnLmRyYWdIYW5kbGUnLFxuXHRcdFx0b25Ecm9wOiAoKSA9PiB7XG5cdFx0XHRcdGNhbGxRdWV1ZS4kZGlycnR5RmllbGQudmFsKE1hdGgucmFuZG9tKCkpO1xuXHRcdFx0XHRjYWxsUXVldWUuJGRpcnJ0eUZpZWxkLnRyaWdnZXIoJ2NoYW5nZScpO1xuXHRcdFx0fSxcblx0XHR9KTtcblx0fSxcblxuXHQvLyDQntGC0L7QsdGA0LDQt9C40YLRjCDQt9Cw0LPQu9GD0YjQutGDINC10YHQu9C4INCyINGC0LDQsdC70LjRhtC1IDAg0YHRgtGA0L7QulxuXHR1cGRhdGVFeHRlbnNpb25UYWJsZVZpZXcoKSB7XG5cdFx0Y29uc3QgZHVtbXkgPSBgPHRyIGNsYXNzPVwiZHVtbXlcIj48dGQgY29sc3Bhbj1cIjRcIiBjbGFzcz1cImNlbnRlciBhbGlnbmVkXCI+JHtnbG9iYWxUcmFuc2xhdGUuY3FfQWRkUXVldWVNZW1iZXJzfTwvdGQ+PC90cj5gO1xuXG5cdFx0aWYgKCQoY2FsbFF1ZXVlLm1lbWJlclJvdykubGVuZ3RoID09PSAwKSB7XG5cdFx0XHQkKCcjZXh0ZW5zaW9uc1RhYmxlIHRib2R5JykuYXBwZW5kKGR1bW15KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0JCgnI2V4dGVuc2lvbnNUYWJsZSB0Ym9keSAuZHVtbXknKS5yZW1vdmUoKTtcblx0XHR9XG5cdH0sXG5cdGNiQmVmb3JlU2VuZEZvcm0oc2V0dGluZ3MpIHtcblx0XHRsZXQgcmVzdWx0ID0gc2V0dGluZ3M7XG5cdFx0cmVzdWx0LmRhdGEgPSBjYWxsUXVldWUuJGZvcm1PYmouZm9ybSgnZ2V0IHZhbHVlcycpO1xuXHRcdGNvbnN0IGFyck1lbWJlcnMgPSBbXTtcblx0XHQkKCcjcXVldWUtZm9ybSAubWVtYmVyLXJvdycpLmVhY2goKGluZGV4LCBvYmopID0+IHtcblx0XHRcdGlmICgkKG9iaikuYXR0cignaWQnKSkge1xuXHRcdFx0XHRhcnJNZW1iZXJzLnB1c2goe1xuXHRcdFx0XHRcdG51bWJlcjogJChvYmopLmF0dHIoJ2lkJyksXG5cdFx0XHRcdFx0cHJpb3JpdHk6IGluZGV4LFxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9KTtcblx0XHRpZiAoYXJyTWVtYmVycy5sZW5ndGggPT09IDApIHtcblx0XHRcdHJlc3VsdCA9IGZhbHNlO1xuXHRcdFx0Y2FsbFF1ZXVlLiRlcnJvck1lc3NhZ2VzLmh0bWwoZ2xvYmFsVHJhbnNsYXRlLmNxX1ZhbGlkYXRlTm9FeHRlbnNpb25zKTtcblx0XHRcdGNhbGxRdWV1ZS4kZm9ybU9iai5hZGRDbGFzcygnZXJyb3InKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmVzdWx0LmRhdGEubWVtYmVycyA9IEpTT04uc3RyaW5naWZ5KGFyck1lbWJlcnMpO1xuXHRcdH1cblxuXHRcdHJldHVybiByZXN1bHQ7XG5cdH0sXG5cdGNiQWZ0ZXJTZW5kRm9ybSgpIHtcblx0XHRjYWxsUXVldWUuZGVmYXVsdE51bWJlciA9IGNhbGxRdWV1ZS4kbnVtYmVyLnZhbCgpO1xuXHR9LFxuXHRpbml0aWFsaXplRm9ybSgpIHtcblx0XHRGb3JtLiRmb3JtT2JqID0gY2FsbFF1ZXVlLiRmb3JtT2JqO1xuXHRcdEZvcm0udXJsID0gYCR7Z2xvYmFsUm9vdFVybH1jYWxsLXF1ZXVlcy9zYXZlYDtcblx0XHRGb3JtLnZhbGlkYXRlUnVsZXMgPSBjYWxsUXVldWUudmFsaWRhdGVSdWxlcztcblx0XHRGb3JtLmNiQmVmb3JlU2VuZEZvcm0gPSBjYWxsUXVldWUuY2JCZWZvcmVTZW5kRm9ybTtcblx0XHRGb3JtLmNiQWZ0ZXJTZW5kRm9ybSA9IGNhbGxRdWV1ZS5jYkFmdGVyU2VuZEZvcm07XG5cdFx0Rm9ybS5pbml0aWFsaXplKCk7XG5cdH0sXG59O1xuXG4kKGRvY3VtZW50KS5yZWFkeSgoKSA9PiB7XG5cdGNhbGxRdWV1ZS5pbml0aWFsaXplKCk7XG59KTtcblxuIl19