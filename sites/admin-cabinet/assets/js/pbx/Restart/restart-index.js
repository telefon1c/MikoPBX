"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

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

/* global globalTranslate, PbxApi, Extensions */
var restart = {
  initialize: function initialize() {
    $('#restart-button').on('click', function (e) {
      $(e.target).closest('button').addClass('loading');
      PbxApi.SystemReboot();
    });
    $('#shutdown-button').on('click', function (e) {
      $(e.target).closest('button').addClass('loading');
      PbxApi.SystemShutDown();
    });
  }
};
var currentCallsWorker = {
  timeOut: 3000,
  timeOutHandle: '',
  $currentCallsInfo: $('#current-calls-info'),
  initialize: function initialize() {
    currentCallsWorker.restartWorker();
  },
  restartWorker: function restartWorker() {
    window.clearTimeout(currentCallsWorker.timeoutHandle);
    currentCallsWorker.worker();
  },
  worker: function worker() {
    PbxApi.GetCurrentCalls(currentCallsWorker.cbGetCurrentCalls); //TODO::Проверить согласно новой структуре ответа PBXCore

    currentCallsWorker.timeoutHandle = window.setTimeout(currentCallsWorker.worker, currentCallsWorker.timeOut);
  },
  cbGetCurrentCalls: function cbGetCurrentCalls(response) {
    currentCallsWorker.$currentCallsInfo.empty();
    if (response === false || _typeof(response) !== 'object') return;
    var respObject = response;
    var resultUl = "<h2 class=\"ui header\">".concat(globalTranslate.rs_CurrentCalls, "</h2>");
    resultUl += '<table class="ui very compact unstackable table">';
    resultUl += '<thead>';
    resultUl += "<th></th><th>".concat(globalTranslate.rs_DateCall, "</th><th>").concat(globalTranslate.rs_Src, "</th><th>").concat(globalTranslate.rs_Dst, "</th>");
    resultUl += '</thead>';
    resultUl += '<tbody>';
    $.each(respObject, function (index, value) {
      resultUl += '<tr>';
      resultUl += '<td><i class="spinner loading icon"></i></td>';
      resultUl += "<td>".concat(value.start, "</td>");
      resultUl += "<td class=\"need-update\">".concat(value.src_num, "</td>");
      resultUl += "<td class=\"need-update\">".concat(value.dst_num, "</td>");
      resultUl += '</tr>';
    });
    resultUl += '</tbody></table>';
    currentCallsWorker.$currentCallsInfo.html(resultUl);
    Extensions.UpdatePhonesRepresent('need-update');
  }
};
$(document).ready(function () {
  restart.initialize();
  currentCallsWorker.initialize();
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9SZXN0YXJ0L3Jlc3RhcnQtaW5kZXguanMiXSwibmFtZXMiOlsicmVzdGFydCIsImluaXRpYWxpemUiLCIkIiwib24iLCJlIiwidGFyZ2V0IiwiY2xvc2VzdCIsImFkZENsYXNzIiwiUGJ4QXBpIiwiU3lzdGVtUmVib290IiwiU3lzdGVtU2h1dERvd24iLCJjdXJyZW50Q2FsbHNXb3JrZXIiLCJ0aW1lT3V0IiwidGltZU91dEhhbmRsZSIsIiRjdXJyZW50Q2FsbHNJbmZvIiwicmVzdGFydFdvcmtlciIsIndpbmRvdyIsImNsZWFyVGltZW91dCIsInRpbWVvdXRIYW5kbGUiLCJ3b3JrZXIiLCJHZXRDdXJyZW50Q2FsbHMiLCJjYkdldEN1cnJlbnRDYWxscyIsInNldFRpbWVvdXQiLCJyZXNwb25zZSIsImVtcHR5IiwicmVzcE9iamVjdCIsInJlc3VsdFVsIiwiZ2xvYmFsVHJhbnNsYXRlIiwicnNfQ3VycmVudENhbGxzIiwicnNfRGF0ZUNhbGwiLCJyc19TcmMiLCJyc19Ec3QiLCJlYWNoIiwiaW5kZXgiLCJ2YWx1ZSIsInN0YXJ0Iiwic3JjX251bSIsImRzdF9udW0iLCJodG1sIiwiRXh0ZW5zaW9ucyIsIlVwZGF0ZVBob25lc1JlcHJlc2VudCIsImRvY3VtZW50IiwicmVhZHkiXSwibWFwcGluZ3MiOiI7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBRUEsSUFBTUEsT0FBTyxHQUFHO0FBQ2ZDLEVBQUFBLFVBRGUsd0JBQ0Y7QUFDWkMsSUFBQUEsQ0FBQyxDQUFDLGlCQUFELENBQUQsQ0FBcUJDLEVBQXJCLENBQXdCLE9BQXhCLEVBQWlDLFVBQUNDLENBQUQsRUFBTztBQUN2Q0YsTUFBQUEsQ0FBQyxDQUFDRSxDQUFDLENBQUNDLE1BQUgsQ0FBRCxDQUFZQyxPQUFaLENBQW9CLFFBQXBCLEVBQThCQyxRQUE5QixD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bkI7QUFDQSxDQUhEIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIE1pa29QQlggLSBmcmVlIHBob25lIHN5c3RlbSBmb3Igc21hbGwgYnVzaW5lc3NcbiAqIENvcHlyaWdodCAoQykgMjAxNy0yMDIzIEFsZXhleSBQb3J0bm92IGFuZCBOaWtvbGF5IEJla2V0b3ZcbiAqXG4gKiBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuICogaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb247IGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4gKiAoYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFRoaXMgcHJvZ3JhbSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuICogYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcbiAqIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYWxvbmcgd2l0aCB0aGlzIHByb2dyYW0uXG4gKiBJZiBub3QsIHNlZSA8aHR0cHM6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICovXG5cbi8qIGdsb2JhbCBnbG9iYWxUcmFuc2xhdGUsIFBieEFwaSwgRXh0ZW5zaW9ucyAqL1xuXG5jb25zdCByZXN0YXJ0ID0ge1xuXHRpbml0aWFsaXplKCkge1xuXHRcdCQoJyNyZXN0YXJ0LWJ1dHRvbicpLm9uKCdjbGljaycsIChlKSA9PiB7XG5cdFx0XHQkKGUudGFyZ2V0KS5jbG9zZXN0KCdidXR0b24nKS5hZGRDbGFzcygnbG9hZGluZycpO1xuXHRcdFx0UGJ4QXBpLlN5c3RlbVJlYm9vdCgpO1xuXHRcdH0pO1xuXHRcdCQoJyNzaHV0ZG93bi1idXR0b24nKS5vbignY2xpY2snLCAoZSkgPT4ge1xuXHRcdFx0JChlLnRhcmdldCkuY2xvc2VzdCgnYnV0dG9uJykuYWRkQ2xhc3MoJ2xvYWRpbmcnKTtcblx0XHRcdFBieEFwaS5TeXN0ZW1TaHV0RG93bigpO1xuXHRcdH0pO1xuXHR9LFxufTtcblxuY29uc3QgY3VycmVudENhbGxzV29ya2VyID0ge1xuXHR0aW1lT3V0OiAzMDAwLFxuXHR0aW1lT3V0SGFuZGxlOiAnJyxcblx0JGN1cnJlbnRDYWxsc0luZm86ICQoJyNjdXJyZW50LWNhbGxzLWluZm8nKSxcblx0aW5pdGlhbGl6ZSgpIHtcblx0XHRjdXJyZW50Q2FsbHNXb3JrZXIucmVzdGFydFdvcmtlcigpO1xuXHR9LFxuXHRyZXN0YXJ0V29ya2VyKCkge1xuXHRcdHdpbmRvdy5jbGVhclRpbWVvdXQoY3VycmVudENhbGxzV29ya2VyLnRpbWVvdXRIYW5kbGUpO1xuXHRcdGN1cnJlbnRDYWxsc1dvcmtlci53b3JrZXIoKTtcblx0fSxcblx0d29ya2VyKCkge1xuXHRcdFBieEFwaS5HZXRDdXJyZW50Q2FsbHMoY3VycmVudENhbGxzV29ya2VyLmNiR2V0Q3VycmVudENhbGxzKTsgLy9UT0RPOjrQn9GA0L7QstC10YDQuNGC0Ywg0YHQvtCz0LvQsNGB0L3QviDQvdC+0LLQvtC5INGB0YLRgNGD0LrRgtGD0YDQtSDQvtGC0LLQtdGC0LAgUEJYQ29yZVxuXHRcdGN1cnJlbnRDYWxsc1dvcmtlci50aW1lb3V0SGFuZGxlXG5cdFx0XHQ9IHdpbmRvdy5zZXRUaW1lb3V0KGN1cnJlbnRDYWxsc1dvcmtlci53b3JrZXIsIGN1cnJlbnRDYWxsc1dvcmtlci50aW1lT3V0KTtcblx0fSxcblx0Y2JHZXRDdXJyZW50Q2FsbHMocmVzcG9uc2UpIHtcblx0XHRjdXJyZW50Q2FsbHNXb3JrZXIuJGN1cnJlbnRDYWxsc0luZm8uZW1wdHkoKTtcblx0XHRpZiAocmVzcG9uc2UgPT09IGZhbHNlIHx8IHR5cGVvZiByZXNwb25zZSAhPT0gJ29iamVjdCcpIHJldHVybjtcblx0XHRjb25zdCByZXNwT2JqZWN0ID0gcmVzcG9uc2U7XG5cdFx0bGV0IHJlc3VsdFVsID0gYDxoMiBjbGFzcz1cInVpIGhlYWRlclwiPiR7Z2xvYmFsVHJhbnNsYXRlLnJzX0N1cnJlbnRDYWxsc308L2gyPmA7XG5cdFx0cmVzdWx0VWwgKz0gJzx0YWJsZSBjbGFzcz1cInVpIHZlcnkgY29tcGFjdCB1bnN0YWNrYWJsZSB0YWJsZVwiPic7XG5cdFx0cmVzdWx0VWwgKz0gJzx0aGVhZD4nO1xuXHRcdHJlc3VsdFVsICs9IGA8dGg+PC90aD48dGg+JHtnbG9iYWxUcmFuc2xhdGUucnNfRGF0ZUNhbGx9PC90aD48dGg+JHtnbG9iYWxUcmFuc2xhdGUucnNfU3JjfTwvdGg+PHRoPiR7Z2xvYmFsVHJhbnNsYXRlLnJzX0RzdH08L3RoPmA7XG5cdFx0cmVzdWx0VWwgKz0gJzwvdGhlYWQ+Jztcblx0XHRyZXN1bHRVbCArPSAnPHRib2R5Pic7XG5cdFx0JC5lYWNoKHJlc3BPYmplY3QsIChpbmRleCwgdmFsdWUpID0+IHtcblx0XHRcdHJlc3VsdFVsICs9ICc8dHI+Jztcblx0XHRcdHJlc3VsdFVsICs9ICc8dGQ+PGkgY2xhc3M9XCJzcGlubmVyIGxvYWRpbmcgaWNvblwiPjwvaT48L3RkPic7XG5cdFx0XHRyZXN1bHRVbCArPSBgPHRkPiR7dmFsdWUuc3RhcnR9PC90ZD5gO1xuXHRcdFx0cmVzdWx0VWwgKz0gYDx0ZCBjbGFzcz1cIm5lZWQtdXBkYXRlXCI+JHt2YWx1ZS5zcmNfbnVtfTwvdGQ+YDtcblx0XHRcdHJlc3VsdFVsICs9IGA8dGQgY2xhc3M9XCJuZWVkLXVwZGF0ZVwiPiR7dmFsdWUuZHN0X251bX08L3RkPmA7XG5cdFx0XHRyZXN1bHRVbCArPSAnPC90cj4nO1xuXHRcdH0pO1xuXHRcdHJlc3VsdFVsICs9ICc8L3Rib2R5PjwvdGFibGU+Jztcblx0XHRjdXJyZW50Q2FsbHNXb3JrZXIuJGN1cnJlbnRDYWxsc0luZm8uaHRtbChyZXN1bHRVbCk7XG5cdFx0RXh0ZW5zaW9ucy5VcGRhdGVQaG9uZXNSZXByZXNlbnQoJ25lZWQtdXBkYXRlJyk7XG5cdH0sXG59O1xuXG5cbiQoZG9jdW1lbnQpLnJlYWR5KCgpID0+IHtcblx0cmVzdGFydC5pbml0aWFsaXplKCk7XG5cdGN1cnJlbnRDYWxsc1dvcmtlci5pbml0aWFsaXplKCk7XG59KTtcblxuIl19